import { API_BASE_URL } from '../config';
import { Event, Booking, Notification } from '../types';
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

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const RealApi = {
    getCurrentUser: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch current user');
        return response.json();
    },

    getEvents: async (params?: string | { status?: string; organizerId?: string }): Promise<Event[]> => {
        let query = '';
        if (typeof params === 'string') {
            query = params ? `?status=${params}` : '';
        } else if (params) {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.organizerId) queryParams.append('organizerId', params.organizerId);
            query = `?${queryParams.toString()}`;
        }

        const response = await fetch(`${API_BASE_URL}/events${query}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
    },

    getMyEvents: async (): Promise<Event[]> => {
        const response = await fetch(`${API_BASE_URL}/events/my/registered`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch my events');
        return response.json();
    },

    getResources: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/resources?available=true`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch resources');
        return response.json();
    },

    createResource: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create resource');
        return response.json();
    },

    updateResource: async (id: string, data: any) => {
        const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update resource');
        return response.json();
    },

    deleteResource: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete resource');
        return response.json();
    },

    getBookings: async (params?: {
        status?: string;
        resourceId?: string;
        upcoming?: boolean;
        date?: string;
    }): Promise<Booking[]> => {
        const query = new URLSearchParams(params as any).toString();
        const response = await fetch(`${API_BASE_URL}/resources/bookings/all?${query}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return response.json();
    },

    getAvailability: async (resourceId: string, start: string, end: string) => {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/availability?start=${start}&end=${end}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch availability');
        return response.json();
    },

    createEvent: async (data: Partial<Event>) => {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create event');
        return response.json();
    },

    updateEvent: async (id: string, data: Partial<Event>) => {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update event');
        return response.json();
    },

    deleteEvent: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete event');
        return response.json();
    },

    approveEvent: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/events/${id}/approve`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to approve event');
        return response.json();
    },

    rejectEvent: async (id: string, reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/events/${id}/reject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error('Failed to reject event');
        return response.json();
    },

    createBooking: async (resourceId: string, data: Partial<Booking>) => {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/book`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create booking');
        }
        return response.json();
    },

    updateBooking: async (id: string, data: Partial<Booking>) => {
        const response = await fetch(`${API_BASE_URL}/resources/bookings/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update booking');
        return response.json();
    },

    deleteBooking: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/resources/bookings/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete booking');
        return response.json();
    },

    getNotifications: async (): Promise<Notification[]> => {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
    },

    markNotificationRead: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return response.json();
    },

    getChatHistory: async (roomId: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/chat/${roomId}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch chat history');
        return response.json();
    },

    getDashboardStats: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return response.json();
    },

    getEventTrends: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/events/trends`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch event trends');
        return response.json();
    },

    getResourceUtilization: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/resources/utilization`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch resource utilization');
        return response.json();
    },

    getClubActivity: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/clubs/activity`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch club activity');
        return response.json();
    },

    getClubs: async () => {
        const response = await fetch(`${API_BASE_URL}/clubs`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch clubs');
        return response.json();
    },

    joinClub: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/clubs/${id}/join`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to join club');
        return response.json();
    },

    leaveClub: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/clubs/${id}/leave`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to leave club');
        return response.json();
    },

    getBudgetSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/budget`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch budget summary');
        return response.json();
    },

    exportData: async (type: 'events' | 'users' | 'bookings' | 'clubs') => {
        const response = await fetch(`${API_BASE_URL}/analytics/export/${type}`, { headers: getHeaders() });
        if (!response.ok) throw new Error(`Failed to export ${type}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};

const MockApi = {
    getCurrentUser: async () => {
        // console.log('[MOCK] getCurrentUser');
        return MOCK_CURRENT_USER;
    },

    getEvents: async (_params?: string | { status?: string; organizerId?: string }): Promise<Event[]> => {
        // console.log('[MOCK] getEvents', params);
        return INITIAL_EVENTS;
    },

    getMyEvents: async (): Promise<Event[]> => {
        // console.log('[MOCK] getMyEvents');
        return INITIAL_EVENTS.filter(e => e.organizerId === MOCK_CURRENT_USER.id);
    },

    getResources: async (): Promise<any[]> => {
        // console.log('[MOCK] getResources');
        return MOCK_RESOURCES;
    },

    createResource: async (data: any) => {
        console.log('[MOCK] createResource', data);
        return { ...data, id: `mock-r-${Date.now()}` };
    },

    updateResource: async (id: string, data: any) => {
        console.log('[MOCK] updateResource', id, data);
        return { ...data, id };
    },

    deleteResource: async (id: string) => {
        console.log('[MOCK] deleteResource', id);
        return { success: true };
    },

    getBookings: async (_params?: any): Promise<Booking[]> => {
        // console.log('[MOCK] getBookings', params);
        return INITIAL_BOOKINGS;
    },

    getAvailability: async (_resourceId: string, _start: string, _end: string) => {
        // console.log('[MOCK] getAvailability', resourceId);
        return []; // Always available in mock
    },

    createEvent: async (data: Partial<Event>) => {
        console.log('[MOCK] createEvent', data);
        return { ...data, id: `mock-e-${Date.now()}`, status: 'PENDING' };
    },

    updateEvent: async (id: string, data: Partial<Event>) => {
        console.log('[MOCK] updateEvent', id, data);
        return { ...data, id };
    },

    deleteEvent: async (id: string) => {
        console.log('[MOCK] deleteEvent', id);
        return { success: true };
    },

    approveEvent: async (id: string) => {
        console.log('[MOCK] approveEvent', id);
        return { success: true };
    },

    rejectEvent: async (id: string, reason?: string) => {
        console.log('[MOCK] rejectEvent', id, reason);
        return { success: true };
    },

    createBooking: async (resourceId: string, data: Partial<Booking>) => {
        console.log('[MOCK] createBooking', resourceId, data);
        return { ...data, id: `mock-b-${Date.now()}`, resourceId, status: 'PENDING' };
    },

    updateBooking: async (id: string, data: Partial<Booking>) => {
        console.log('[MOCK] updateBooking', id, data);
        return { ...data, id };
    },

    deleteBooking: async (id: string) => {
        console.log('[MOCK] deleteBooking', id);
        return { success: true };
    },

    getNotifications: async (): Promise<Notification[]> => {
        // console.log('[MOCK] getNotifications');
        return MOCK_NOTIFICATIONS;
    },

    markNotificationRead: async (id: string) => {
        console.log('[MOCK] markNotificationRead', id);
        return { success: true };
    },

    getChatHistory: async (_roomId: string): Promise<any[]> => {
        // console.log('[MOCK] getChatHistory', roomId);
        return MOCK_CHAT_HISTORY;
    },

    getDashboardStats: async () => {
        // console.log('[MOCK] getDashboardStats');
        return MOCK_DASHBOARD_STATS;
    },

    getEventTrends: async () => {
        // console.log('[MOCK] getEventTrends');
        return MOCK_EVENT_TRENDS;
    },

    getResourceUtilization: async () => {
        // console.log('[MOCK] getResourceUtilization');
        return MOCK_RESOURCE_UTILIZATION;
    },

    getClubActivity: async () => {
        // console.log('[MOCK] getClubActivity');
        return MOCK_CLUB_ACTIVITY;
    },

    getClubs: async () => {
        // console.log('[MOCK] getClubs');
        return MOCK_CLUBS;
    },

    joinClub: async (id: string) => {
        console.log('[MOCK] joinClub', id);
        return { success: true };
    },

    leaveClub: async (id: string) => {
        console.log('[MOCK] leaveClub', id);
        return { success: true };
    },

    getBudgetSummary: async () => {
        // console.log('[MOCK] getBudgetSummary');
        return MOCK_BUDGET_SUMMARY;
    },

    exportData: async (type: 'events' | 'users' | 'bookings' | 'clubs') => {
        console.log('[MOCK] exportData', type);
        alert(`[MOCK] Exporting ${type} data...`);
    }
};

export const api = import.meta.env.VITE_USE_MOCKS === 'true' ? MockApi : RealApi;
