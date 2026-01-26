import { User, Event, Resource, Booking, EventStatus } from '../types';
import { API_BASE_URL } from '../config';

// Helper for API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }
  return response.json();
};

// Helper for file downloads
const downloadFile = async (url: string, filename: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
  });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// --- AUTH & USERS (Node.js API) ---

export const getUsers = async (): Promise<User[]> => {
  return await apiCall(`${API_BASE_URL}/users`);
};

export const getCurrentUser = async (): Promise<User> => {
  return await apiCall(`${API_BASE_URL}/auth/me`);
};

// --- EVENTS (Node.js API) ---

export const getEvents = async (): Promise<Event[]> => {
  return await apiCall(`${API_BASE_URL}/events`);
};

export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  return await apiCall(`${API_BASE_URL}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const updateEventStatus = async (eventId: string, status: EventStatus): Promise<Event> => {
  const action = status === EventStatus.APPROVED ? 'approve'
    : status === EventStatus.REJECTED ? 'reject'
      : status === EventStatus.PENDING ? 'submit'
        : 'update';

  if (action === 'update') {
    return await apiCall(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  return await apiCall(`${API_BASE_URL}/events/${eventId}/${action}`, {
    method: 'POST',
    body: JSON.stringify(status === EventStatus.REJECTED ? { reason: 'Admin rejected' } : {})
  });
};

// --- RESOURCES (Node.js API) ---

export const getResources = async (): Promise<Resource[]> => {
  return await apiCall(`${API_BASE_URL}/resources`);
};

export const getResource = async (id: string): Promise<Resource> => {
  return await apiCall(`${API_BASE_URL}/resources/${id}`);
};

export const createResource = async (resourceData: Partial<Resource>): Promise<Resource> => {
  return await apiCall(`${API_BASE_URL}/resources`, {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });
};

export const updateResource = async (id: string, resourceData: Partial<Resource>): Promise<Resource> => {
  return await apiCall(`${API_BASE_URL}/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(resourceData),
  });
};

export const deleteResource = async (id: string): Promise<void> => {
  await apiCall(`${API_BASE_URL}/resources/${id}`, { method: 'DELETE' });
};

export const getResourceAvailability = async (id: string, start: string, end: string) => {
  return await apiCall(`${API_BASE_URL}/resources/${id}/availability?start=${start}&end=${end}`);
};

// --- BOOKINGS (Node.js API) ---

export const createBooking = async (bookingData: any): Promise<Booking> => {
  const resourceId = bookingData.resourceId;
  return await apiCall(`${API_BASE_URL}/resources/${resourceId}/book`, {
    method: 'POST',
    body: JSON.stringify({
      title: bookingData.eventName,
      purpose: bookingData.purpose || '',
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      eventId: bookingData.eventId,
    }),
  });
};

export const getBookings = async (resourceId?: string): Promise<Booking[]> => {
  const query = resourceId ? `?resourceId=${resourceId}` : '';
  return await apiCall(`${API_BASE_URL}/resources/bookings/all${query}`);
};

export const getMyBookings = async (): Promise<Booking[]> => {
  return await apiCall(`${API_BASE_URL}/resources/bookings/my`);
};

export const approveBooking = async (bookingId: string, notes?: string): Promise<Booking> => {
  return await apiCall(`${API_BASE_URL}/resources/bookings/${bookingId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: notes }),
  });
};

export const rejectBooking = async (bookingId: string, notes?: string): Promise<Booking> => {
  return await apiCall(`${API_BASE_URL}/resources/bookings/${bookingId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: notes }),
  });
};

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  return await apiCall(`${API_BASE_URL}/resources/bookings/${bookingId}/cancel`, {
    method: 'POST',
  });
};

// --- CLUBS (Node.js API) ---

export const getClubs = async () => {
  return await apiCall(`${API_BASE_URL}/clubs`);
};

// --- NOTIFICATIONS (Node.js API) ---

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (unreadOnly = false): Promise<Notification[]> => {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return await apiCall(`${API_BASE_URL}/notifications${query}`);
};

export const getNotificationCount = async (): Promise<{ unreadCount: number }> => {
  return await apiCall(`${API_BASE_URL}/notifications/count`);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiCall(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiCall(`${API_BASE_URL}/notifications/read-all`, { method: 'PUT' });
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiCall(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
};

export const clearAllNotifications = async (): Promise<void> => {
  await apiCall(`${API_BASE_URL}/notifications`, { method: 'DELETE' });
};

export const sendAnnouncement = async (title: string, message: string, targetRole?: string): Promise<void> => {
  await apiCall(`${API_BASE_URL}/notifications/announce`, {
    method: 'POST',
    body: JSON.stringify({ title, message, targetRole }),
  });
};

// --- ANALYTICS (Node.js API) ---

export interface DashboardStats {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  pendingEvents: number;
  totalResources: number;
  pendingBookings: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return await apiCall(`${API_BASE_URL}/analytics/dashboard`);
};

export const getEventTrends = async (months = 6) => {
  return await apiCall(`${API_BASE_URL}/analytics/events/trends?months=${months}`);
};

export const getClubActivity = async () => {
  return await apiCall(`${API_BASE_URL}/analytics/clubs/activity`);
};

export const getResourceUtilization = async () => {
  return await apiCall(`${API_BASE_URL}/analytics/resources/utilization`);
};

export const getBudgetSummary = async () => {
  return await apiCall(`${API_BASE_URL}/analytics/budget`);
};

// CSV Exports
export const exportEventsCSV = async () => {
  await downloadFile(`${API_BASE_URL}/analytics/export/events`, 'events_export.csv');
};

export const exportUsersCSV = async () => {
  await downloadFile(`${API_BASE_URL}/analytics/export/users`, 'users_export.csv');
};

export const exportBookingsCSV = async () => {
  await downloadFile(`${API_BASE_URL}/analytics/export/bookings`, 'bookings_export.csv');
};

export const exportClubsCSV = async () => {
  await downloadFile(`${API_BASE_URL}/analytics/export/clubs`, 'clubs_export.csv');
};

