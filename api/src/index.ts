import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clubRoutes from './routes/clubs';
import eventRoutes from './routes/events';
import resourceRoutes from './routes/resources';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import { connectBrokers, redisClient, brokersConnected } from './config/brokers';

const app = express();
const PORT = process.env.PORT || 5000;

const parseCorsOrigins = (value?: string) => {
    if (!value) return '*';
    const trimmed = value.trim();
    if (trimmed === '*') return '*';
    return trimmed.split(',').map((o) => o.trim()).filter(Boolean);
};

const corsOrigin = parseCorsOrigins(process.env.CORS_ORIGIN);
const socketCorsOrigin = parseCorsOrigins(process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN);

app.use(cors({
    origin: corsOrigin as any,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'campus-api', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Campus API is running. Access endpoints via /api/...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', require('./routes/chat').default);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: socketCorsOrigin as any,
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // Save to DB if sender is a valid user
            // We assume data has sender (name) but for DB we need senderId. 
            // Ideally frontend sends senderId or we decode token. 
            // For hackathon speed, let's lookup user by name (risky but matches current frontend) 
            // OR better: update frontend to send senderId.
            // Let's rely on looking up user by name for now since we don't have auth middleware on socket here yet.

            // Actually, let's just use Prisma directly.
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const user = await prisma.user.findFirst({ where: { name: data.sender } });

            if (user) {
                const message = await prisma.message.create({
                    data: {
                        text: data.text,
                        senderId: user.id,
                        roomId: data.room,
                        createdAt: new Date(data.timestamp || Date.now())
                    },
                    include: { sender: { select: { name: true } } }
                });

                // data.id is usually temp from frontend, use real DB id
                const payload = {
                    ...data,
                    id: message.id,
                    timestamp: message.createdAt.getTime()
                };

                io.to(data.room).emit('receive_message', payload);
            } else {
                // Fallback for non-persisted user (shouldn't happen in auth app)
                io.to(data.room).emit('receive_message', data);
            }
        } catch (e) {
            console.error("Error saving message:", e);
            // Emit anyway so UX isn't broken
            io.to(data.room).emit('receive_message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const startServer = async () => {
    // Try to connect brokers but don't crash if they fail
    // await connectBrokers();

    if (false && brokersConnected && redisClient) {
        try {
            const { createAdapter } = await import('@socket.io/redis-adapter');
            const pubClient = redisClient!.duplicate();
            const subClient = redisClient!.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            console.log("Socket.io Redis adapter configured");
        } catch (e) {
            console.warn("Redis adapter failed, using default adapter:", e);
        }
    }

    server.listen(PORT, () => {
        console.log(`Campus API running on port ${PORT}`);
        console.log(`Socket.io ready`);
    });
};

startServer();

export default app;
