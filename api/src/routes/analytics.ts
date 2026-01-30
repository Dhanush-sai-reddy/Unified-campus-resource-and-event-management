import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Dashboard summary stats
router.get('/dashboard', authenticateToken, requireRole('ADMIN', 'ORGANIZER'), async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            totalClubs,
            totalEvents,
            pendingEvents,
            totalResources,
            pendingBookings,
            totalBookings,
            totalRegistrations,
            recentEvents,
            recentBookings
        ] = await Promise.all([
            prisma.user.count(),
            prisma.club.count(),
            prisma.event.count(),
            prisma.event.count({ where: { status: 'PENDING' } }),
            prisma.resource.count(),
            prisma.resourceBooking.count({ where: { status: 'PENDING' } }),
            prisma.resourceBooking.count(),
            prisma.eventRegistration.count(),
            prisma.event.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, status: true, createdAt: true }
            }),
            prisma.resourceBooking.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, status: true, createdAt: true, resource: { select: { name: true } } }
            })
        ]);

        const participationRate = totalUsers > 0 ? Math.round((totalRegistrations / totalUsers) * 100) : 0;

        const recentActivity = [
            ...recentEvents.map(e => ({
                id: e.id,
                title: e.title,
                time: e.createdAt,
                status: e.status,
                type: 'event'
            })),
            ...recentBookings.map(b => ({
                id: b.id,
                title: `${b.title} (${b.resource.name})`,
                time: b.createdAt,
                status: b.status,
                type: 'booking'
            }))
        ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5);

        res.json({
            totalUsers,
            totalClubs,
            totalEvents,
            pendingEvents,
            totalResources,
            pendingBookings,
            totalBookings,
            participationRate,
            recentActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Event participation trends
router.get('/events/trends', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { months = 6 } = req.query;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - Number(months));

        const events = await prisma.event.findMany({
            where: {
                createdAt: { gte: monthsAgo },
            },
            include: {
                _count: { select: { registrations: true } },
                club: { select: { name: true } },
            },
            orderBy: { date: 'asc' },
        });

        // Group by month
        const trends = events.reduce((acc: any, event) => {
            const month = event.date.toISOString().slice(0, 7);
            if (!acc[month]) {
                acc[month] = { events: 0, registrations: 0 };
            }
            acc[month].events++;
            acc[month].registrations += event._count.registrations;
            return acc;
        }, {});

        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch event trends' });
    }
});

// Club activity metrics
router.get('/clubs/activity', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const clubs = await prisma.club.findMany({
            include: {
                _count: {
                    select: {
                        members: true,
                        events: true,
                    },
                },
                events: {
                    include: {
                        _count: { select: { registrations: true } },
                    },
                },
            },
        });

        const activity = clubs.map(club => ({
            id: club.id,
            name: club.name,
            category: club.category,
            memberCount: club._count.members,
            eventCount: club._count.events,
            totalParticipants: club.events.reduce((sum, e) => sum + e._count.registrations, 0),
        }));

        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch club activity' });
    }
});

// Resource utilization
router.get('/resources/utilization', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const resources = await prisma.resource.findMany({
            include: {
                _count: {
                    select: { bookings: true },
                },
                bookings: {
                    where: { status: 'APPROVED' },
                    select: { startTime: true, endTime: true },
                },
            },
        });

        const utilization = resources.map(resource => {
            const totalHours = resource.bookings.reduce((sum, b) => {
                return sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
            }, 0);

            return {
                id: resource.id,
                name: resource.name,
                type: resource.type,
                totalBookings: resource._count.bookings,
                totalHoursBooked: Math.round(totalHours * 10) / 10,
            };
        });

        res.json(utilization);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resource utilization' });
    }
});

// Budget summary
router.get('/budget', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: { status: { in: ['APPROVED', 'COMPLETED'] } },
            include: {
                club: { select: { name: true } },
            },
        });

        const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
        const byClub = events.reduce((acc: any, event) => {
            const clubName = event.club?.name || 'Independent';
            if (!acc[clubName]) acc[clubName] = 0;
            acc[clubName] += event.budget;
            return acc;
        }, {});

        res.json({
            totalBudget,
            byClub,
            eventCount: events.length,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch budget summary' });
    }
});

// CSV Export - Events
router.get('/export/events', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            include: {
                organizer: { select: { name: true, email: true } },
                club: { select: { name: true } },
                _count: { select: { registrations: true } },
            },
            orderBy: { date: 'desc' },
        });

        // Generate CSV
        const headers = ['Title', 'Date', 'End Date', 'Location', 'Status', 'Budget', 'Organizer', 'Club', 'Registrations'];
        const rows = events.map(e => [
            `"${e.title}"`,
            e.date.toISOString().split('T')[0],
            e.endDate ? e.endDate.toISOString().split('T')[0] : '',
            `"${e.location || ''}"`,
            e.status,
            e.budget,
            `"${e.organizer.name}"`,
            `"${e.club?.name || 'N/A'}"`,
            e._count.registrations,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=events_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export events' });
    }
});

// CSV Export - Users
router.get('/export/users', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        memberships: true,
                        registrations: true,
                        organizedEvents: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const headers = ['Name', 'Email', 'Role', 'Department', 'Year', 'Clubs Joined', 'Events Registered', 'Events Organized', 'Joined'];
        const rows = users.map(u => [
            `"${u.name}"`,
            u.email,
            u.role,
            `"${u.department || ''}"`,
            u.year || '',
            u._count.memberships,
            u._count.registrations,
            u._count.organizedEvents,
            u.createdAt.toISOString().split('T')[0],
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export users' });
    }
});

// CSV Export - Resource Bookings
router.get('/export/bookings', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await prisma.resourceBooking.findMany({
            include: {
                resource: { select: { name: true, type: true } },
                user: { select: { name: true, email: true } },
                event: { select: { title: true } },
            },
            orderBy: { startTime: 'desc' },
        });

        const headers = ['Resource', 'Type', 'Title', 'Purpose', 'Start', 'End', 'Status', 'Booked By', 'Email', 'Event'];
        const rows = bookings.map(b => [
            `"${b.resource.name}"`,
            b.resource.type,
            `"${b.title}"`,
            `"${b.purpose || ''}"`,
            b.startTime.toISOString(),
            b.endTime.toISOString(),
            b.status,
            `"${b.user.name}"`,
            b.user.email,
            `"${b.event?.title || 'N/A'}"`,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=bookings_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export bookings' });
    }
});

// CSV Export - Clubs
router.get('/export/clubs', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const clubs = await prisma.club.findMany({
            include: {
                _count: {
                    select: {
                        members: true,
                        events: true,
                    },
                },
            },
        });

        const headers = ['Name', 'Description', 'Category', 'Members', 'Events', 'Created'];
        const rows = clubs.map(c => [
            `"${c.name}"`,
            `"${c.description || ''}"`,
            `"${c.category || ''}"`,
            c._count.members,
            c._count.events,
            c.createdAt.toISOString().split('T')[0],
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=clubs_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export clubs' });
    }
});

export default router;
