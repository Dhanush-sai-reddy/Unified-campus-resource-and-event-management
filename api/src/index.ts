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

                 
                const payload = {
                    ...data,
                    id: message.id,
                    timestamp: message.createdAt.getTime()
                };

                io.to(data.room).emit('receive_message', payload);
            } else {
                 
                io.to(data.room).emit('receive_message', data);
            }
        } catch (e) {
            console.error("Error saving message:", e);
             
            io.to(data.room).emit('receive_message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const startServer = async () => {
     
     

    if (false) {
         
    }

    server.listen(PORT, () => {
        console.log(`Campus API running on port ${PORT}`);
        console.log(`Socket.io ready`);
    });
};

startServer();

export default app;
