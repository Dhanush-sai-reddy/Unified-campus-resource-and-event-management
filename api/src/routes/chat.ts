import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

 
router.get('/:roomId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const { limit } = req.query;

        const messages = await prisma.message.findMany({
            where: { roomId },
            take: limit ? parseInt(limit as string) : 50,
            orderBy: { createdAt: 'asc' },  
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender.name,
            timestamp: msg.createdAt.getTime(),
            room: msg.roomId,
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Failed to fetch chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

export default router;
