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

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'campus-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
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
        console.log(`🚀 Campus API running on port ${PORT}`);
        console.log(`🔌 Socket.io ready`);
    });
};

startServer();

export default app;
