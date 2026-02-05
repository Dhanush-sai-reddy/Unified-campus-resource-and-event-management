import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Search, Grid, List, ChevronRight, X, MessageCircle } from 'lucide-react';
import { Event, EventStatus, Booking, UserRole } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors: Record<EventStatus, string> = {
    [EventStatus.DRAFT]: 'bg-surface-100 text-surface-600',
    [EventStatus.PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [EventStatus.APPROVED]: 'bg-green-50 text-green-700 border-green-200',
    [EventStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
    [EventStatus.COMPLETED]: 'bg-blue-50 text-blue-700 border-blue-200',
};

function EventCard({ event, onViewDetails }: { event: Event, onViewDetails: (event: Event) => void }) {
    const { user } = useAuth();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="glass-card rounded-2xl overflow-hidden group"
        >
            <div className="h-32 bg-gradient-to-br from-primary-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-4 left-4">
                    {user?.role !== UserRole.PARTICIPANT && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[event.status]}`}>
                            {event.status}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-bold text-lg text-surface-900 group-hover:text-primary-600 transition-colors">
                            {event.title}
                        </h3>
                        <p className="text-sm text-primary-600 font-medium">{event.clubName}</p>
                    </div>
                </div>

                <p className="text-sm text-surface-500 line-clamp-2 mb-4">{event.description}</p>

                <div className="space-y-2 text-sm text-surface-600">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-surface-400" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-surface-400" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-surface-400" />
                        <span>{event.participants} participants</span>
                    </div>
                </div>

                <button
                    onClick={() => onViewDetails(event)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-100 text-surface-700 font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                    View Details
                    <ChevronRight size={16} />
                </button>
            </div>
        </motion.div>
    );
}

export default function Events() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [statusFilter, setStatusFilter] = useState<string>(user?.role === UserRole.PARTICIPANT ? EventStatus.APPROVED : 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [eventBookings, setEventBookings] = useState<Booking[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);

    const handleViewDetails = async (event: Event) => {
        setSelectedEvent(event);
        setLoadingResources(true);
        try {
            const allBookings = await api.getBookings();
            const relevant = allBookings.filter(b => (b as any).eventName === event.title || b.title === event.title || b.eventId === event.id);
            setEventBookings(relevant);
        } catch (e) {
            console.error(e);
            setEventBookings([]);
        }
        setLoadingResources(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let statusArg = statusFilter === 'all' ? 'ALL' : statusFilter;
                if (user?.role === UserRole.PARTICIPANT) {
                    statusArg = EventStatus.APPROVED;
                }
                const data = await api.getEvents(statusArg);
                setEvents(data);
            } catch (err) {
                console.error("Failed to fetch events", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [statusFilter, user]);

    const filteredEvents = events.filter(event => {
        if (user?.role === UserRole.PARTICIPANT) {
            if (event.status !== EventStatus.APPROVED) return false;
        }

        const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.clubName.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesStatus || !matchesSearch) return false;

        if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.PARTICIPANT) {
            const isPrivate = [EventStatus.DRAFT, EventStatus.PENDING, EventStatus.REJECTED].includes(event.status);
            if (isPrivate && event.organizerId !== user?.id) return false;
        }

        return true;
    });

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Events</h1>
                    <p className="text-surface-500 mt-1">Discover and manage campus events</p>
                </div>
                {user?.role !== UserRole.PARTICIPANT && (
                    <button
                        onClick={() => navigate('/events/new')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <Calendar size={18} />
                        Create Event
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {user?.role !== UserRole.PARTICIPANT && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value={EventStatus.APPROVED}>Approved</option>
                            <option value={EventStatus.PENDING}>Pending</option>
                            <option value={EventStatus.DRAFT}>Draft</option>
                            <option value={EventStatus.COMPLETED}>Completed</option>
                        </select>
                    )}

                    <div className="flex rounded-xl border border-surface-200 bg-white overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin"></div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                    <Calendar className="mx-auto text-surface-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-surface-900">No events found</h3>
                    <p className="text-surface-500 mt-1">Try adjusting your filters or create a new event</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }
                >
                    {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
                    ))}
                </motion.div>
            )}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-100"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                                <h3 className="text-lg font-bold text-surface-900">
                                    {selectedEvent.title}
                                </h3>
                                <button onClick={() => setSelectedEvent(null)} className="text-surface-400 hover:text-surface-600 transition-colors p-1 rounded-lg hover:bg-surface-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-surface-700 mb-2">About Event</h4>
                                    <p className="text-surface-600 leading-relaxed text-sm">{selectedEvent.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-surface-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                                            <Calendar size={14} />
                                            <span>Date & Time</span>
                                        </div>
                                        <p className="font-medium text-surface-900 text-sm">
                                            {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-surface-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                                            <MapPin size={14} />
                                            <span>Location/Resource</span>
                                        </div>
                                        <p className="font-medium text-surface-900 text-sm">{selectedEvent.location}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                                        <Grid size={16} className="text-primary-600" />
                                        Allocated Resources
                                    </h4>

                                    {loadingResources ? (
                                        <div className="text-center py-4 text-sm text-surface-500">Loading resources...</div>
                                    ) : eventBookings.length > 0 ? (
                                        <div className="space-y-2">
                                            {eventBookings.map(booking => (
                                                <div key={booking.id} className="flex items-center justify-between p-3 border border-surface-200 rounded-xl bg-surface-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg border border-surface-100 text-surface-500">
                                                            <Calendar size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-surface-900 text-sm">{booking.title}</p>
                                                            <p className="text-xs text-primary-600 font-medium mb-0.5">at {booking.resource?.name || booking.resourceId}</p>
                                                            <p className="text-xs text-surface-500">
                                                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                        Reserved
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-surface-50 rounded-xl border border-dashed border-surface-200">
                                            <p className="text-sm text-surface-500">No specific resources allocated via system yet.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    {user?.role === UserRole.ADMIN && selectedEvent.status === EventStatus.PENDING && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.approveEvent(selectedEvent.id);
                                                        setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, status: EventStatus.APPROVED } : e));
                                                        setSelectedEvent(null);
                                                        alert('Event approved successfully');
                                                    } catch (err) {
                                                        alert('Failed to approve event');
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const reason = prompt('Reason for rejection (optional):');
                                                    if (reason === null) return;
                                                    try {
                                                        await api.rejectEvent(selectedEvent.id, reason);
                                                        setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, status: EventStatus.REJECTED } : e));
                                                        setSelectedEvent(null);
                                                        alert('Event rejected');
                                                    } catch (err) {
                                                        alert('Failed to reject event');
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => {
                                            const eventSlug = selectedEvent.id;
                                            const eventName = encodeURIComponent(selectedEvent.title);
                                            navigate(`/chat?event=${eventSlug}&name=${eventName}`);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <MessageCircle size={16} />
                                        Join Event Chat
                                    </button>
                                    {(user?.role === UserRole.ADMIN || user?.id === selectedEvent.organizerId) && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this event?')) {
                                                    try {
                                                        await api.deleteEvent(selectedEvent.id);
                                                        setEvents(events.filter(e => e.id !== selectedEvent.id));
                                                        setSelectedEvent(null);
                                                    } catch (err) {
                                                        alert('Failed to delete event');
                                                    }
                                                }
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="px-4 py-2 text-sm font-medium text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
