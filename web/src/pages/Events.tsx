import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Plus, Search, Grid, List, ChevronRight } from 'lucide-react';
import { Event, EventStatus } from '../types';
import { getEvents } from '../services/mockService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const statusColors: Record<EventStatus, string> = {
    [EventStatus.DRAFT]: 'bg-surface-100 text-surface-600',
    [EventStatus.PENDING]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [EventStatus.APPROVED]: 'bg-green-50 text-green-700 border-green-200',
    [EventStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
    [EventStatus.COMPLETED]: 'bg-blue-50 text-blue-700 border-blue-200',
};

function EventCard({ event }: { event: Event }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="glass-card rounded-2xl overflow-hidden group"
        >
            {/* Event image/gradient */}
            <div className="h-32 bg-gradient-to-br from-primary-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[event.status]}`}>
                        {event.status}
                    </span>
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

                <Link
                    to={`/events/${event.id}`}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-100 text-surface-700 font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                    View Details
                    <ChevronRight size={16} />
                </Link>
            </div>
        </motion.div>
    );
}

export default function Events() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getEvents();
            setEvents(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.clubName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const canCreateEvent = user?.role === UserRole.ADMIN || user?.role === UserRole.ORGANIZER;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Events</h1>
                    <p className="text-surface-500 mt-1">Discover and manage campus events</p>
                </div>
                {canCreateEvent && (
                    <Link
                        to="/events/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                    >
                        <Plus size={18} />
                        Create Event
                    </Link>
                )}
            </div>

            {/* Filters */}
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

            {/* Events grid */}
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
                        <EventCard key={event.id} event={event} />
                    ))}
                </motion.div>
            )}
        </div>
    );
}
