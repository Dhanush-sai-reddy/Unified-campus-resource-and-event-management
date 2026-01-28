import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { auditLog } from '../services/gitAudit';
import { createNotification } from './notifications';

const router = Router();
const prisma = new PrismaClient();

// Get my registered events
router.get('/my/registered', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const registrations = await prisma.eventRegistration.findMany({
            where: { userId: req.userId },
            include: {
                event: {
                    include: {
                        organizer: { select: { id: true, name: true, avatar: true } },
                        club: { select: { id: true, name: true } },
                        _count: { select: { registrations: true } },
                    }
                }
            },
            orderBy: { event: { date: 'asc' } }
        });

        const events = registrations.map(r => r.event);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch my events' });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const { status, clubId } = req.query;

        const events = await prisma.event.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(clubId && { clubId: clubId as string }),
            },
            include: {
                organizer: { select: { id: true, name: true, avatar: true } },
                club: { select: { id: true, name: true } },
                _count: { select: { registrations: true } },
            },
            orderBy: { date: 'asc' },
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: {
                organizer: { select: { id: true, name: true, avatar: true } },
                club: true,
                registrations: {
                    include: { user: { select: { id: true, name: true, avatar: true } } }
                },
                collaborators: true,
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// Check for booking conflicts (duplicated from resources.ts)
async function hasConflict(resourceId: string, startTime: Date, endTime: Date) {
    const conflicting = await prisma.resourceBooking.findFirst({
        where: {
            resourceId,
            status: { in: ['PENDING', 'APPROVED'] },
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        },
    });
    return conflicting !== null;
}

// Create event
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (req.userRole === 'PARTICIPANT') {
            return res.status(403).json({ error: 'Students are not allowed to create events' });
        }

        const { title, description, date, endDate, location, budget, clubId, isMultiDay, resourceId } = req.body;

        const start = new Date(date);
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000);

        // If resourceId is provided, check for conflicts
        let bookingData = undefined;
        if (resourceId) {
            const conflict = await hasConflict(resourceId, start, end);
            if (conflict) {
                return res.status(409).json({ error: 'Selected time slot conflicts with an existing booking' });
            }

            const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
            if (!resource) return res.status(404).json({ error: 'Resource not found' });

            bookingData = {
                create: {
                    resourceId,
                    userId: req.userId!,
                    title,
                    startTime: start,
                    endTime: end,
                    status: resource.requiresApproval ? 'PENDING' : 'APPROVED',
                }
            };
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: start,
                endDate: end,
                location: location || (resourceId ? 'Resource Booked' : ''),
                budget: parseFloat(budget) || 0,
                isMultiDay: isMultiDay || false,
                organizerId: req.userId!,
                clubId,
                status: 'DRAFT',
                ...(bookingData && { resourceBookings: bookingData }),
            },
            include: {
                organizer: { select: { id: true, name: true } },
                club: { select: { id: true, name: true } },
                resourceBookings: true
            },
        });

        // Audit log
        await auditLog('event_created', { eventId: event.id, title, userId: req.userId, resourceId });

        // Kafka
        const { publishEvent } = require('../services/producer');
        publishEvent(event).catch(console.error);

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Update event
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, date, endDate, location, budget } = req.body;

        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                location,
                budget: budget ? parseFloat(budget) : undefined,
            },
        });

        await auditLog('event_updated', { eventId: event.id, changes: req.body, userId: req.userId });

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// Delete event
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const event = await prisma.event.findUnique({ where: { id: req.params.id } });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.organizerId !== req.userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.event.delete({ where: { id: req.params.id } });
        await auditLog('event_deleted', { eventId: req.params.id, userId: req.userId });

        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// Submit event for approval
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: { status: 'PENDING' },
        });

        await auditLog('event_submitted', { eventId: event.id, userId: req.userId });

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit event' });
    }
});

// Approve event (admin only)
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED' },
            include: { organizer: true },
        });

        await auditLog('event_approved', { eventId: event.id, approvedBy: req.userId });

        // Send notification to organizer
        await createNotification(
            event.organizerId,
            'EVENT_APPROVED',
            'Event Approved',
            `Your event "${event.title}" has been approved!`,
            `/events/${event.id}`
        );

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve event' });
    }
});

// Reject event (admin only)
router.post('/:id/reject', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;

        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED' },
            include: { organizer: true },
        });

        await auditLog('event_rejected', { eventId: event.id, rejectedBy: req.userId, reason });

        // Send notification to organizer
        await createNotification(
            event.organizerId,
            'EVENT_REJECTED',
            'Event Rejected',
            `Your event "${event.title}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
            `/events/${event.id}`
        );

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject event' });
    }
});

// Register for event
router.post('/:id/register', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const registration = await prisma.eventRegistration.create({
            data: {
                eventId: req.params.id,
                userId: req.userId!,
            },
        });

        res.status(201).json(registration);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Already registered' });
        }
        res.status(500).json({ error: 'Failed to register' });
    }
});

// Unregister from event
router.delete('/:id/register', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.eventRegistration.delete({
            where: {
                eventId_userId: {
                    eventId: req.params.id,
                    userId: req.userId!,
                },
            },
        });

        res.json({ message: 'Unregistered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unregister' });
    }
});

export default router;
