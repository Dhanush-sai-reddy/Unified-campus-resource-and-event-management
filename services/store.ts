import { useState, useEffect, useCallback } from 'react';
import { User, Club, Resource, Event, Booking, ChatMessage, UserRole, EventStatus } from '../types';
import { MOCK_USERS, MOCK_CLUBS, MOCK_RESOURCES, MOCK_EVENTS, MOCK_BOOKINGS } from '../constants';

// A simple hook to simulate backend interaction
export function useStore() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Simulate login persistence
  useEffect(() => {
    const storedUser = localStorage.getItem('uni_nexus_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, role: UserRole) => {
    // Mock login logic - just find by role or create dummy
    let found = users.find(u => u.role === role);
    if (!found) {
        found = users[0]; // fallback
    }
    setUser(found);
    localStorage.setItem('uni_nexus_user', JSON.stringify(found));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('uni_nexus_user');
  };

  const addEvent = (event: Event) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEventStatus = (id: string, status: EventStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    
    // Automatically create a channel/welcome message when approved
    if (status === EventStatus.APPROVED) {
        const event = events.find(e => e.id === id);
        if (event) {
            const sysMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                senderId: 'system',
                senderName: 'UniNexus Bot',
                content: `🚀 Event "${event.title}" has been approved! This secure channel is now active for team coordination.`,
                timestamp: new Date().toISOString(),
                channelId: id // Use event ID as channel ID
            };
            setMessages(prev => [...prev, sysMsg]);
        }
    }
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => [...prev, booking]);
  };

  const addResource = (res: Resource) => {
    setResources(prev => [...prev, res]);
  };

  const removeResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const sendMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  return {
    user,
    users,
    clubs,
    resources,
    events,
    bookings,
    messages,
    login,
    logout,
    addEvent,
    updateEventStatus,
    addBooking,
    addResource,
    removeResource,
    sendMessage
  };
}
