import { API_BASE_URL } from '../config';
import { Event, Booking } from '../types';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const api = {
    // Events
    getEvents: async (): Promise<Event[]> => {
        const response = await fetch(`${API_BASE_URL}/events`, {
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

    // Resources & Bookings
    getBookings: async (params?: {
        status?: string;
        resourceId?: string;
        upcoming?: boolean;
        date?: string; // Optional filtering on client side if needed, but backend supports other filters
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

    // Chat
    getChatHistory: async (roomId: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/chat/${roomId}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch chat history');
        return response.json();
    },

    // Analytics
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

    getBudgetSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/budget`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch budget summary');
        return response.json();
    },

    // Exports
    exportData: async (type: 'events' | 'users' | 'bookings' | 'clubs') => {
        const response = await fetch(`${API_BASE_URL}/analytics/export/${type}`, { headers: getHeaders() });
        if (!response.ok) throw new Error(`Failed to export ${type}`);

        // Handle file download
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
