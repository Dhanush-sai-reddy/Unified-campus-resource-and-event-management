import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Event, Booking, Resource, EventStatus } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, X, Calendar as CalendarIcon, Server, Users, MessageCircle, MoreVertical } from 'lucide-react';
import ResourceCalendar from '../components/ResourceCalendar';
import { useAuth } from '../context/AuthContext';
import type { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';

interface SelectedEventInfo {
    id: string;
    title: string;
    start: Date;
    end: Date;
    color: string;
    location?: string;
    resourceId?: string;
    originalEvent?: Event;
    originalBooking?: Booking;
}

export default function Calendar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate] = useState(new Date());
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<'events' | 'resources'>(
        (searchParams.get('view') as 'events' | 'resources') || 'events'
    );

    const [dbEvents, setDbEvents] = useState<Event[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [eventBookings, setEventBookings] = useState<Booking[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<SelectedEventInfo | null>(null);

    // New Event Creation Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalData, setCreateModalData] = useState<{ start: Date; end: Date } | null>(null);
    const [newEventTitle, setNewEventTitle] = useState('');

    const fetchData = async () => {
        try {
            const [fetchedEvents, fetchedBookings, fetchedResources] = await Promise.all([
                api.getEvents('APPROVED,PENDING'),
                api.getBookings({ upcoming: false }),
                api.getResources()
            ]);
            setDbEvents(fetchedEvents);
            setBookings(fetchedBookings);
            setResources(fetchedResources);
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const CALENDAR_COLORS = [
        '#039be5', '#7986cb', '#33b679', '#f4511e', '#e67c73', '#0b8043',
    ];

    const calendarEvents: EventInput[] = viewMode === 'events'
        ? dbEvents.map((event, i) => ({
            id: event.id,
            title: event.title,
            start: event.date,
            end: event.endDate || event.date,
            backgroundColor: CALENDAR_COLORS[i % CALENDAR_COLORS.length],
            borderColor: CALENDAR_COLORS[i % CALENDAR_COLORS.length],
            textColor: '#ffffff',
            extendedProps: { originalEvent: event },
        }))
        : bookings.map((booking, i) => {
            const resource = resources.find(r => r.id === booking.resourceId);
            return {
                id: booking.id,
                title: `${booking.title} — ${resource?.name || 'Unknown'}`,
                start: booking.startTime,
                end: booking.endTime,
                backgroundColor: CALENDAR_COLORS[i % CALENDAR_COLORS.length],
                borderColor: CALENDAR_COLORS[i % CALENDAR_COLORS.length],
                textColor: '#ffffff',
                extendedProps: { originalBooking: booking, resourceId: booking.resourceId },
            };
        });

    const handleSlotSelect = (info: DateSelectArg) => {
        setCreateModalData({ start: info.start, end: info.end });
        setNewEventTitle('');
        setIsCreateModalOpen(true);
    };

    const handleCreateEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createModalData || !newEventTitle.trim()) return;

        try {
            if (viewMode === 'events') {
                await api.createEvent({
                    title: newEventTitle,
                    description: '',
                    date: createModalData.start.toISOString(),
                    endDate: createModalData.end.toISOString(),
                    location: '',
                    budget: 0,
                });
            } else {
                // In resources view, we can't easily create a booking without selecting a resource first.
                // Assuming for now it just redirects to the general create booking flow or alerts.
                alert("Please switch to 'Events' view to create a general event, or go to the Resources page to book a specific resource.");
            }
            setIsCreateModalOpen(false);
            setCreateModalData(null);
            await fetchData();
        } catch (err) {
            console.error("Failed to create event", err);
            alert('Failed to create event');
        }
    };

    const handleEventClick = (info: EventClickArg) => {
        const props = info.event.extendedProps;
        const event = props.originalEvent as Event | undefined;
        const booking = props.originalBooking as Booking | undefined;

        setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start!,
            end: info.event.end || info.event.start!,
            color: info.event.backgroundColor || '#3b82f6',
            location: event?.location || booking?.resource?.name,
            resourceId: props.resourceId || event?.resourceId,
            originalEvent: event,
            originalBooking: booking,
        });

        if (viewMode === 'events' && event) {
            const relatedBookings = bookings.filter(b => b.eventId === event.id);
            setEventBookings(relatedBookings);
        } else {
            setEventBookings([]);
        }
    };

    const handleEventDrop = async (info: EventDropArg) => {
        try {
            if (viewMode === 'events') {
                const event = info.event.extendedProps.originalEvent as Event;
                if (!event) return;
                await api.updateEvent(event.id, {
                    date: info.event.start!.toISOString(),
                    endDate: (info.event.end || info.event.start!).toISOString(),
                });
            } else {
                const booking = info.event.extendedProps.originalBooking as Booking;
                if (!booking) return;
                await api.updateBooking(booking.id, {
                    startTime: info.event.start!.toISOString(),
                    endTime: (info.event.end || info.event.start!).toISOString(),
                });
            }
        } catch (err) {
            console.error("Failed to update event", err);
            info.revert();
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.deleteEvent(id);
            setDbEvents(prev => prev.filter(e => e.id !== id));
            setSelectedEvent(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete event');
        }
    };

    const getResourceCapacityBar = (resourceId: string) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource || !resource.capacity) return null;
        const percentage = Math.min((resource.capacity / 500) * 100, 100);

        return (
            <div className="mt-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-surface-500 uppercase tracking-wider text-[10px]">Capacity</span>
                    <span className="font-bold text-surface-700">{resource.capacity}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 relative h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Event Calendar</h1>
                    <p className="text-surface-500 mt-1">Plan and manage your campus events</p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role !== 'PARTICIPANT' && (
                        <button
                            onClick={() => navigate('/events/new')}
                            className="px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <CalendarIcon size={18} />
                            Create
                        </button>
                    )}
                    <div className="flex bg-surface-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('events')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'events' ? 'bg-white shadow text-primary-600' : 'text-surface-600 hover:text-surface-900'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Users size={16} />
                                Events
                            </span>
                        </button>
                        <button
                            onClick={() => setViewMode('resources')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'resources' ? 'bg-white shadow text-primary-600' : 'text-surface-600 hover:text-surface-900'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Server size={16} />
                                Resources
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-0 overflow-hidden h-[75vh]">
                <ResourceCalendar
                    events={calendarEvents}
                    initialDate={currentDate}
                    onSlotSelect={user?.role !== 'PARTICIPANT' ? handleSlotSelect : undefined}
                    onEventClick={handleEventClick}
                    onEventDrop={handleEventDrop}
                    onEventResize={async (info) => {
                        try {
                            if (viewMode === 'events') {
                                const event = info.event.extendedProps.originalEvent as Event;
                                if (!event) return;
                                await api.updateEvent(event.id, {
                                    date: info.event.start!.toISOString(),
                                    endDate: (info.event.end || info.event.start!).toISOString(),
                                });
                            } else {
                                const booking = info.event.extendedProps.originalBooking as Booking;
                                if (!booking) return;
                                await api.updateBooking(booking.id, {
                                    startTime: info.event.start!.toISOString(),
                                    endTime: (info.event.end || info.event.start!).toISOString(),
                                });
                            }
                        } catch (err) {
                            console.error("Failed to resize event", err);
                            info.revert();
                        }
                    }}
                    readOnly={user?.role === 'PARTICIPANT'}
                />
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isCreateModalOpen && createModalData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                                <h3 className="font-bold text-surface-900">Create Event</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-surface-200 rounded text-surface-500">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateEventSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 uppercase mb-1.5 ml-1">Event Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Add title"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-100">
                                    <Clock size={16} className="text-primary-500" />
                                    <span>
                                        {createModalData.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        {' - '}
                                        {createModalData.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 rounded-xl transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newEventTitle.trim()}
                                        className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-transparent" onClick={() => setSelectedEvent(null)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-surface-200"
                    >
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <button onClick={() => setSelectedEvent(null)} className="p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-sm transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 text-white relative overflow-hidden" style={{ backgroundColor: selectedEvent.color }}>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/30 pointer-events-none" />
                            <h3 className="text-xl font-bold relative z-10 pr-8 leading-tight">{selectedEvent.title}</h3>
                            <div className="flex items-center gap-2 mt-2 relative z-10 text-white/90 text-sm font-medium">
                                <Clock size={14} />
                                <span>
                                    {selectedEvent.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} -{' '}
                                    {selectedEvent.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {selectedEvent.location && (
                                <div className="flex items-center gap-3 text-surface-600">
                                    <div className="p-2 bg-surface-50 rounded-lg text-surface-500">
                                        <MapPin size={18} />
                                    </div>
                                    <span className="font-medium text-surface-900">{selectedEvent.location}</span>
                                </div>
                            )}

                            {viewMode === 'resources' && selectedEvent.resourceId && (
                                <div className="mt-4 pt-4 border-t border-surface-100">
                                    <h4 className="text-xs font-semibold text-surface-500 uppercase mb-3 flex items-center gap-1.5">
                                        <Server size={12} /> Resource Details
                                    </h4>
                                    <div className="bg-surface-50 p-3 rounded-xl border border-surface-200">
                                        <p className="font-medium text-surface-900 mb-1">{selectedEvent.location}</p>
                                        {getResourceCapacityBar(selectedEvent.resourceId)}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'events' && eventBookings.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-surface-100">
                                    <h4 className="text-xs font-semibold text-surface-500 uppercase mb-3 text-primary-600 font-bold tracking-wide">Allocated Resources</h4>
                                    <div className="space-y-2">
                                        {eventBookings.map(b => (
                                            <div key={b.id} className="text-sm bg-white p-3 rounded-xl border border-surface-200 shadow-sm flex items-start gap-3">
                                                <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600 mt-0.5">
                                                    <Server size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between font-bold text-surface-900">
                                                        <span>{b.resource?.name}</span>
                                                    </div>
                                                    <div className="text-surface-500 text-xs mt-1 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(b.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        const eventId = selectedEvent.originalEvent?.id;
                                        if (eventId) {
                                            navigate(`/chat?event=${eventId}&name=${encodeURIComponent(selectedEvent.title)}`);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    Chat
                                </button>
                                {selectedEvent.originalEvent && (
                                    <button
                                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                        title="Delete Event"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            {user?.role === 'ADMIN' && selectedEvent.originalEvent?.status === EventStatus.PENDING && (
                                <div className="flex gap-2 mt-2 pt-4 border-t border-surface-100">
                                    <button
                                        onClick={async () => {
                                            try {
                                                if (!selectedEvent.originalEvent) return;
                                                await api.approveEvent(selectedEvent.originalEvent.id);
                                                await fetchData();
                                                setSelectedEvent(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to approve event');
                                            }
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const reason = prompt('Reason for rejection (optional):');
                                            if (reason === null) return;
                                            try {
                                                if (!selectedEvent.originalEvent) return;
                                                await api.rejectEvent(selectedEvent.originalEvent.id, reason);
                                                await fetchData();
                                                setSelectedEvent(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to reject event');
                                            }
                                        }}
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
