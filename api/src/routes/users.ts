import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                avatar: true,
                createdAt: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                avatar: true,
                memberships: {
                    include: { club: true }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { name, department, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { name, department, avatar },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                avatar: true,
            },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
