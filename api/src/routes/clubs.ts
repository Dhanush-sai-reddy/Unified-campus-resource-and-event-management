import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all clubs
router.get('/', async (req, res) => {
    try {
        const clubs = await prisma.club.findMany({
            include: {
                _count: { select: { members: true, events: true } }
            },
        });
        res.json(clubs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clubs' });
    }
});

// Get club by ID
router.get('/:id', async (req, res) => {
    try {
        const club = await prisma.club.findUnique({
            where: { id: req.params.id },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, avatar: true } } }
                },
                events: true,
            },
        });

        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        res.json(club);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch club' });
    }
});

// Create club (admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, category, logo } = req.body;

        const club = await prisma.club.create({
            data: { name, description, category, logo },
        });

        res.status(201).json(club);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create club' });
    }
});

// Join club
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const membership = await prisma.membership.create({
            data: {
                userId: req.userId!,
                clubId: req.params.id,
                role: 'MEMBER',
            },
        });

        res.status(201).json(membership);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Already a member' });
        }
        res.status(500).json({ error: 'Failed to join club' });
    }
});

// Leave club
router.delete('/:id/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.membership.delete({
            where: {
                userId_clubId: {
                    userId: req.userId!,
                    clubId: req.params.id,
                },
            },
        });

        res.json({ message: 'Left club successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to leave club' });
    }
});

export default router;
