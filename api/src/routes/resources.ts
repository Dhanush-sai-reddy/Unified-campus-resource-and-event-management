import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { auditLog } from '../services/gitAudit';

const router = Router();
const prisma = new PrismaClient();

// Get all resources
router.get('/', async (req, res) => {
    try {
        const { type, available } = req.query;

        const resources = await prisma.resource.findMany({
            where: {
                ...(type && { type: type as any }),
                ...(available === 'true' && { isAvailable: true }),
            },
            include: {
                _count: { select: { bookings: true } },
            },
            orderBy: { name: 'asc' },
        });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// Get resource by ID with bookings
router.get('/:id', async (req, res) => {
    try {
        const resource = await prisma.resource.findUnique({
            where: { id: req.params.id },
            include: {
                bookings: {
                    where: {
                        status: { in: ['PENDING', 'APPROVED'] },
                        endTime: { gte: new Date() },
                    },
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                        event: { select: { id: true, title: true } },
                    },
                    orderBy: { startTime: 'asc' },
                },
            },
        });

        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json(resource);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resource' });
    }
});

// Create resource (admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, description, location, capacity, image, requiresApproval } = req.body;

        const resource = await prisma.resource.create({
            data: {
                name,
                type,
                description,
                location,
                capacity: capacity ? parseInt(capacity) : null,
                image,
                requiresApproval: requiresApproval !== false,
            },
        });

        await auditLog('resource_created', { resourceId: resource.id, name, type, userId: req.userId });

        res.status(201).json(resource);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resource' });
    }
});

// Update resource (admin only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, description, location, capacity, image, isAvailable, requiresApproval } = req.body;

        const resource = await prisma.resource.update({
            where: { id: req.params.id },
            data: {
                name,
                type,
                description,
                location,
                capacity: capacity !== undefined ? parseInt(capacity) : undefined,
                image,
                isAvailable,
                requiresApproval,
            },
        });

        await auditLog('resource_updated', { resourceId: resource.id, changes: req.body, userId: req.userId });

        res.json(resource);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

// Delete resource (admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        await prisma.resource.delete({
            where: { id: req.params.id },
        });

        await auditLog('resource_deleted', { resourceId: req.params.id, userId: req.userId });

        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// Check for booking conflicts
async function hasConflict(resourceId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
    const conflicting = await prisma.resourceBooking.findFirst({
        where: {
            resourceId,
            status: { in: ['PENDING', 'APPROVED'] },
            id: excludeBookingId ? { not: excludeBookingId } : undefined,
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        },
    });
    return conflicting !== null;
}

// Get resource availability for a date range
router.get('/:id/availability', async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates required' });
        }

        const bookings = await prisma.resourceBooking.findMany({
            where: {
                resourceId: req.params.id,
                status: { in: ['PENDING', 'APPROVED'] },
                startTime: { gte: new Date(start as string) },
                endTime: { lte: new Date(end as string) },
            },
            select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                status: true,
                user: { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
        });

        res.json({ bookings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

// Create booking (ORGANIZER or ADMIN only)
router.post('/:id/book', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { title, purpose, startTime, endTime, eventId } = req.body;

        // Check user role - only ADMIN and ORGANIZER can book resources
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
            return res.status(403).json({ error: 'Only organizers and admins can book resources' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        // Check for conflicts
        if (await hasConflict(req.params.id, start, end)) {
            return res.status(409).json({ error: 'Time slot conflicts with existing booking' });
        }

        // Get resource to check if approval is required
        const resource = await prisma.resource.findUnique({
            where: { id: req.params.id },
        });

        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        if (!resource.isAvailable) {
            return res.status(400).json({ error: 'Resource is not available for booking' });
        }

        const booking = await prisma.resourceBooking.create({
            data: {
                resourceId: req.params.id,
                userId: req.userId!,
                eventId,
                title,
                purpose,
                startTime: start,
                endTime: end,
                status: resource.requiresApproval ? 'PENDING' : 'APPROVED',
            },
            include: {
                resource: { select: { name: true, type: true } },
                user: { select: { name: true } },
            },
        });

        await auditLog('booking_created', {
            bookingId: booking.id,
            resourceId: req.params.id,
            userId: req.userId,
            startTime,
            endTime,
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get all bookings (filterable)
router.get('/bookings/all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { status, resourceId, userId, upcoming } = req.query;

        const bookings = await prisma.resourceBooking.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(resourceId && { resourceId: resourceId as string }),
                ...(userId && { userId: userId as string }),
                ...(upcoming === 'true' && { endTime: { gte: new Date() } }),
            },
            include: {
                resource: { select: { id: true, name: true, type: true, location: true } },
                user: { select: { id: true, name: true, avatar: true } },
                event: { select: { id: true, title: true } },
            },
            orderBy: { startTime: 'asc' },
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get user's bookings
router.get('/bookings/my', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await prisma.resourceBooking.findMany({
            where: { userId: req.userId },
            include: {
                resource: { select: { id: true, name: true, type: true, location: true } },
                event: { select: { id: true, title: true } },
            },
            orderBy: { startTime: 'desc' },
        });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch your bookings' });
    }
});

// Approve booking (admin only)
router.post('/bookings/:bookingId/approve', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { adminNotes } = req.body;

        const booking = await prisma.resourceBooking.update({
            where: { id: req.params.bookingId },
            data: {
                status: 'APPROVED',
                adminNotes,
            },
            include: {
                resource: { select: { name: true } },
                user: { select: { name: true, email: true } },
            },
        });

        await auditLog('booking_approved', {
            bookingId: booking.id,
            approvedBy: req.userId,
            adminNotes,
        });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve booking' });
    }
});

// Reject booking (admin only)
router.post('/bookings/:bookingId/reject', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { adminNotes } = req.body;

        const booking = await prisma.resourceBooking.update({
            where: { id: req.params.bookingId },
            data: {
                status: 'REJECTED',
                adminNotes,
            },
        });

        await auditLog('booking_rejected', {
            bookingId: booking.id,
            rejectedBy: req.userId,
            adminNotes,
        });

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject booking' });
    }
});

// Cancel booking (owner or admin)
router.post('/bookings/:bookingId/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const booking = await prisma.resourceBooking.findUnique({
            where: { id: req.params.bookingId },
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (booking.userId !== req.userId && user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        const updatedBooking = await prisma.resourceBooking.update({
            where: { id: req.params.bookingId },
            data: { status: 'CANCELLED' },
        });

        await auditLog('booking_cancelled', {
            bookingId: booking.id,
            cancelledBy: req.userId,
        });

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// Get booking statistics (admin)
router.get('/stats/utilization', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        // Get booking counts by resource
        const resourceStats = await prisma.resourceBooking.groupBy({
            by: ['resourceId'],
            where: {
                status: 'COMPLETED',
                startTime: { gte: start },
                endTime: { lte: end },
            },
            _count: { id: true },
        });

        // Get resources for names
        const resources = await prisma.resource.findMany({
            select: { id: true, name: true, type: true },
        });

        const stats = resourceStats.map(stat => {
            const resource = resources.find(r => r.id === stat.resourceId);
            return {
                resourceId: stat.resourceId,
                resourceName: resource?.name || 'Unknown',
                resourceType: resource?.type || 'OTHER',
                bookingCount: stat._count.id,
            };
        });

        // Get overall stats
        const totalBookings = await prisma.resourceBooking.count({
            where: {
                startTime: { gte: start },
                endTime: { lte: end },
            },
        });

        const pendingBookings = await prisma.resourceBooking.count({
            where: { status: 'PENDING' },
        });

        res.json({
            period: { start, end },
            resourceUtilization: stats,
            totalBookings,
            pendingBookings,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch utilization stats' });
    }
});

export default router;
