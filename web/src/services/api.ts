
import { Event, Booking, Notification, UserRole } from '../types';
import { MOCK_RESOURCES, INITIAL_EVENTS, INITIAL_BOOKINGS } from '../constants';
import {
    MOCK_NOTIFICATIONS,
    MOCK_CHAT_HISTORY,
    MOCK_DASHBOARD_STATS,
    MOCK_EVENT_TRENDS,
    MOCK_RESOURCE_UTILIZATION,
    MOCK_CLUB_ACTIVITY,
    MOCK_CLUBS,
    MOCK_BUDGET_SUMMARY,
    MOCK_CURRENT_USER
} from './mockData';

// --- Local State ---
let events: Event[] = [...INITIAL_EVENTS];
let bookings: Booking[] = [...INITIAL_BOOKINGS];
let resources = [...MOCK_RESOURCES];
let notifications = [...MOCK_NOTIFICATIONS];
let clubs = [...MOCK_CLUBS];

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 600));

// --- Pure Frontend "Data Service" ---
export const api = {
    getCurrentUser: async () => {
        await simulateDelay();
        return MOCK_CURRENT_USER;
    },

    getEvents: async (params?: string | { status?: string; organizerId?: string }): Promise<Event[]> => {
        await simulateDelay();
        let filtered = events;
        if (typeof params === 'object') {
            if (params.status) filtered = filtered.filter(e => e.status === params.status);
            if (params.organizerId) filtered = filtered.filter(e => e.organizerId === params.organizerId);
        }
        return filtered;
    },

    getMyEvents: async (): Promise<Event[]> => {
        await simulateDelay();
        return events.filter(e => e.organizerId === MOCK_CURRENT_USER.id);
    },

    getResources: async (): Promise<any[]> => {
        await simulateDelay();
        return resources;
    },

    createResource: async (data: any) => {
        await simulateDelay();
        const newResource = { ...data, id: `mock-r-${Date.now()}` };
        resources.push(newResource);
        return newResource;
    },

    updateResource: async (id: string, data: any) => {
        await simulateDelay();
        resources = resources.map(r => r.id === id ? { ...r, ...data } : r);
        return { ...data, id };
    },

    deleteResource: async (id: string) => {
        await simulateDelay();
        resources = resources.filter(r => r.id !== id);
        return { success: true };
    },

    getBookings: async (_params?: any): Promise<Booking[]> => {
        await simulateDelay();
        return bookings;
    },

    login: async (email: string, _password: string) => {
        await simulateDelay();
        console.log('[MockData] Auto-Login Admin:', email);
        return {
            user: { ...MOCK_CURRENT_USER, email, role: UserRole.ADMIN }, // Force Admin Role
            token: 'mock-token-auto-admin'
        };
    },

    getAvailability: async (_resourceId: string, _start: string, _end: string) => {
        await simulateDelay();
        return []; // Always available for demo
    },

    createEvent: async (data: Partial<Event>) => {
        await simulateDelay();
        const newEvent = {
            ...data,
            id: `mock-e-${Date.now()}`,
            status: 'PENDING',
            organizerId: MOCK_CURRENT_USER.id,
            organizerName: MOCK_CURRENT_USER.name
        } as Event;
        events.push(newEvent);
        return newEvent;
    },

    updateEvent: async (id: string, data: Partial<Event>) => {
        await simulateDelay();
        events = events.map(e => e.id === id ? { ...e, ...data } : e);
        return { ...data, id };
    },

    deleteEvent: async (id: string) => {
        await simulateDelay();
        events = events.filter(e => e.id !== id);
        return { success: true };
    },

    approveEvent: async (id: string) => {
        await simulateDelay();
        events = events.map(e => e.id === id ? { ...e, status: 'APPROVED' } : e);
        return { success: true };
    },

    rejectEvent: async (id: string, _reason?: string) => {
        await simulateDelay();
        events = events.map(e => e.id === id ? { ...e, status: 'REJECTED' } : e);
        return { success: true };
    },

    createBooking: async (resourceId: string, data: Partial<Booking>) => {
        await simulateDelay();
        const newBooking = {
            ...data,
            id: `mock-b-${Date.now()}`,
            resourceId,
            status: 'PENDING',
            userId: MOCK_CURRENT_USER.id,
            userName: MOCK_CURRENT_USER.name
        } as Booking;
        bookings.push(newBooking);
        return newBooking;
    },

    updateBooking: async (id: string, data: Partial<Booking>) => {
        await simulateDelay();
        bookings = bookings.map(b => b.id === id ? { ...b, ...data } : b);
        return { ...data, id };
    },

    deleteBooking: async (id: string) => {
        await simulateDelay();
        bookings = bookings.filter(b => b.id !== id);
        return { success: true };
    },

    getNotifications: async (): Promise<Notification[]> => {
        await simulateDelay();
        return notifications;
    },

    markNotificationRead: async (id: string) => {
        await simulateDelay();
        notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return { success: true };
    },

    getChatHistory: async (_roomId: string): Promise<any[]> => {
        await simulateDelay();
        return MOCK_CHAT_HISTORY;
    },

    getDashboardStats: async () => {
        await simulateDelay();
        // Recalculate stats based on local state
        return {
            ...MOCK_DASHBOARD_STATS,
            totalEvents: events.length,
            totalBookings: bookings.length
        };
    },

    getEventTrends: async () => {
        await simulateDelay();
        return MOCK_EVENT_TRENDS;
    },

    getResourceUtilization: async () => {
        await simulateDelay();
        return MOCK_RESOURCE_UTILIZATION;
    },

    getClubActivity: async () => {
        await simulateDelay();
        return MOCK_CLUB_ACTIVITY;
    },

    getClubs: async () => {
        await simulateDelay();
        return clubs;
    },

    joinClub: async (id: string) => {
        await simulateDelay();
        clubs = clubs.map(c => c.id === id ? { ...c, joined: true, members: c.members + 1 } : c);
        return { success: true };
    },

    leaveClub: async (id: string) => {
        await simulateDelay();
        clubs = clubs.map(c => c.id === id ? { ...c, joined: false, members: Math.max(0, c.members - 1) } : c);
        return { success: true };
    },

    getBudgetSummary: async () => {
        await simulateDelay();
        return MOCK_BUDGET_SUMMARY;
    },

    exportData: async (type: 'events' | 'users' | 'bookings' | 'clubs') => {
        await simulateDelay();
        console.log(`[MockData] Exporting ${type}...`);
        alert(`Exporting ${type} data (Mock)...`);
    }
};
