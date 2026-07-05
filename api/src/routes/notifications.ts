import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

 
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { unreadOnly } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.userId,
                ...(unreadOnly === 'true' && { isRead: false }),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

 
router.get('/count', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.userId,
                isRead: false,
            },
        });

        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get notification count' });
    }
});

 
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: req.params.id,
                userId: req.userId,
            },
            data: { isRead: true },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

 
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

 
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                id: req.params.id,
                userId: req.userId,
            },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

 
router.delete('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.deleteMany({
            where: { userId: req.userId },
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

 
router.post('/announce', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { title, message, targetRole, link } = req.body;

        const users = await prisma.user.findMany({
            where: targetRole ? { role: targetRole } : {},
            select: { id: true },
        });

        const notifications = await prisma.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                type: 'ANNOUNCEMENT',
                title,
                message,
                link,
            })),
        });


        res.json({ sent: notifications.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send announcement' });
    }
});

 
export async function createNotification(
    userId: string,
    type: 'EVENT_APPROVED' | 'EVENT_REJECTED' | 'EVENT_REMINDER' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_REMINDER' | 'CLUB_INVITE' | 'ANNOUNCEMENT' | 'SYSTEM',
    title: string,
    message: string,
    link?: string
) {
    return prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            link,
        },
    });
}

export default router;
