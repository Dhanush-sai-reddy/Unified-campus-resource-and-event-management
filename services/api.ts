// services/api.ts — Real backend API client
// Used when VITE_USE_MOCKS !== 'true'

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// ── Token Management ────────────────────────────────
let authToken: string | null = localStorage.getItem('campus_jwt');

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('campus_jwt', token);
  } else {
    localStorage.removeItem('campus_jwt');
  }
};

export const getToken = () => authToken;

// ── HTTP Helper ─────────────────────────────────────
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Auth ────────────────────────────────────────────
export interface LoginResponse {
  user: ApiUser;
  token: string;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
  memberships?: any[];
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    name: string;
    department?: string;
    role?: string;
  }): Promise<LoginResponse> => {
    const data = await apiFetch<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    return data;
  },

  getMe: async (): Promise<ApiUser> => {
    return apiFetch<ApiUser>('/api/auth/me');
  },

  logout: () => {
    setToken(null);
  },
};

// ── Events ──────────────────────────────────────────
export const eventsApi = {
  getAll: (params?: { status?: string; clubId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/events${qs}`);
  },

  getById: (id: string) => apiFetch(`/api/events/${id}`),

  create: (payload: {
    title: string;
    description?: string;
    date: string;
    endDate?: string;
    location?: string;
    budget?: number;
    clubId?: string;
    isMultiDay?: boolean;
  }) =>
    apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Record<string, any>) =>
    apiFetch(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  submit: (id: string) =>
    apiFetch(`/api/events/${id}/submit`, { method: 'POST' }),

  approve: (id: string) =>
    apiFetch(`/api/events/${id}/approve`, { method: 'POST' }),

  reject: (id: string, reason?: string) =>
    apiFetch(`/api/events/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  register: (id: string) =>
    apiFetch(`/api/events/${id}/register`, { method: 'POST' }),

  unregister: (id: string) =>
    apiFetch(`/api/events/${id}/register`, { method: 'DELETE' }),
};

// ── Resources ───────────────────────────────────────
export const resourcesApi = {
  getAll: () => apiFetch('/api/resources'),

  getById: (id: string) => apiFetch(`/api/resources/${id}`),

  create: (payload: {
    name: string;
    type: string;
    description?: string;
    location?: string;
    capacity?: number;
    requiresApproval?: boolean;
  }) =>
    apiFetch('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Record<string, any>) =>
    apiFetch(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch(`/api/resources/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (
    resourceId: string,
    payload: {
      title: string;
      purpose?: string;
      startTime: string;
      endTime: string;
      eventId?: string;
    }
  ) =>
    apiFetch(`/api/resources/${resourceId}/book`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAllBookings: (params?: {
    status?: string;
    resourceId?: string;
    userId?: string;
    upcoming?: string;
  }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/resources/bookings/all${qs}`);
  },

  getMyBookings: () => apiFetch('/api/resources/bookings/my'),

  approveBooking: (bookingId: string, adminNotes?: string) =>
    apiFetch(`/api/resources/bookings/${bookingId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
    }),

  rejectBooking: (bookingId: string, adminNotes?: string) =>
    apiFetch(`/api/resources/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
    }),

  cancelBooking: (bookingId: string) =>
    apiFetch(`/api/resources/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),
};

// ── Clubs ───────────────────────────────────────────
export const clubsApi = {
  getAll: () => apiFetch('/api/clubs'),

  getById: (id: string) => apiFetch(`/api/clubs/${id}`),

  create: (payload: {
    name: string;
    description?: string;
    category?: string;
    logo?: string;
  }) =>
    apiFetch('/api/clubs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  join: (id: string) =>
    apiFetch(`/api/clubs/${id}/join`, { method: 'POST' }),

  leave: (id: string) =>
    apiFetch(`/api/clubs/${id}/leave`, { method: 'DELETE' }),
};

// ── Users ───────────────────────────────────────────
export const usersApi = {
  getAll: () => apiFetch('/api/users'),
  getById: (id: string) => apiFetch(`/api/users/${id}`),
  updateProfile: (payload: Record<string, any>) =>
    apiFetch('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// ── Notifications ───────────────────────────────────
export const notificationsApi = {
  getAll: () => apiFetch('/api/notifications'),
  markRead: (id: string) =>
    apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiFetch('/api/notifications/read-all', { method: 'POST' }),
};


