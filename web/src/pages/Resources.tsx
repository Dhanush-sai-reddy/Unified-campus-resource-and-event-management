import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Resource, ResourceType, Booking, Event, UserRole } from '../types';
import { api } from '../services/api';
import { Monitor, Square, Search, X, Users, Grid, List, Filter, Calendar, Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ResourceTimeline from '../components/ResourceTimeline';
import ResourceCalendar from '../components/ResourceCalendar';
import type { EventInput, DateSelectArg } from '@fullcalendar/core';

type ViewMode = 'grid' | 'list' | 'timeline' | 'calendar';
type CategoryFilter = 'all' | 'rooms' | 'equipment' | 'labs' | 'vehicles';

const ROOM_CATEGORIES = [
    { key: 'auditorium', label: 'Auditoriums', pattern: /auditorium/i },
    { key: 'lecture', label: 'Lecture Halls', pattern: /lecture/i },
    { key: 'conference', label: 'Conference Rooms', pattern: /conference|board/i },
    { key: 'lab', label: 'Labs', pattern: /lab/i },
    { key: 'seminar', label: 'Seminar Halls', pattern: /seminar/i },
    { key: 'outdoor', label: 'Open Spaces', pattern: /open|lawn|ground|theatre/i },
];

const EQUIPMENT_CATEGORIES = [
    { key: 'av', label: 'Audio/Visual', pattern: /projector|screen|pa system|mic/i },
    { key: 'recording', label: 'Recording', pattern: /camera|tripod|light|green/i },
    { key: 'computing', label: 'Computing', pattern: /laptop|ipad|vr/i },
    { key: 'event', label: 'Event Setup', pattern: /stage|backdrop|desk|banner/i },
];

export default function Resources() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === UserRole.PARTICIPANT) {
            navigate('/events');
        }
    }, [user, navigate]);

    const [resources, setResources] = useState<Resource[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [_events, setEvents] = useState<Event[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newResource, setNewResource] = useState<Partial<Resource>>({
        name: '',
        type: ResourceType.ROOM,
        capacity: 0,
        isAvailable: true,
        requiresApproval: true,
        location: '',
        description: ''
    });
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Booking Creation Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingModalData, setBookingModalData] = useState<{ start: Date; end: Date } | null>(null);
    const [newBookingTitle, setNewBookingTitle] = useState('');
    const [newBookingPurpose, setNewBookingPurpose] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resData, bookingsData, eventsData] = await Promise.all([
                api.getResources(),
                api.getBookings(),
                api.getEvents()
            ]);
            setResources(resData);
            setBookings(bookingsData);
            setEvents(eventsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.role !== 'ADMIN') return;

        try {
            await api.createResource(newResource);
            setIsAddModalOpen(false);
            setNewResource({
                name: '',
                type: ResourceType.ROOM,
                capacity: 0,
                isAvailable: true,
                requiresApproval: true,
                location: '',
                description: ''
            });
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to create resource");
        }
    };

    const handleDeleteResource = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || user.role !== 'ADMIN') return;

        if (window.confirm('Are you sure you want to delete this resource?')) {
            try {
                await api.deleteResource(id);
                fetchData();
            } catch (err: any) {
                console.error(err);
                alert(err.message || "Failed to delete resource");
            }
        }
    };

    const handleSlotSelect = (info: DateSelectArg) => {
        if (!selectedResource) return;
        setBookingModalData({ start: info.start, end: info.end });
        setNewBookingTitle('');
        setNewBookingPurpose('');
        setIsBookingModalOpen(true);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResource || !bookingModalData || !newBookingTitle.trim()) return;

        try {
            await api.createBooking(selectedResource.id, {
                title: newBookingTitle,
                purpose: newBookingPurpose || newBookingTitle,
                startTime: bookingModalData.start.toISOString(),
                endTime: bookingModalData.end.toISOString(),
            });
            setIsBookingModalOpen(false);
            setBookingModalData(null);
            await fetchData();
        } catch (err: any) {
            console.error("Failed to book:", err);
            alert(err.message || "Failed to book resource. Please try again.");
        }
    };

    const filteredResources = resources.filter(resource => {
        const matchesCategory =
            categoryFilter === 'all' ||
            (categoryFilter === 'rooms' && (resource.type === ResourceType.ROOM || resource.type === ResourceType.HALL)) ||
            (categoryFilter === 'equipment' && resource.type === ResourceType.EQUIPMENT) ||
            (categoryFilter === 'labs' && resource.type === ResourceType.LAB) ||
            (categoryFilter === 'vehicles' && resource.type === ResourceType.VEHICLE);

        const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSubCategory = !selectedCategory ||
            [...ROOM_CATEGORIES, ...EQUIPMENT_CATEGORIES].find(c => c.key === selectedCategory)?.pattern.test(resource.name);

        return matchesCategory && matchesSearch && matchesSubCategory;
    });

    const totalRooms = resources.filter(r => r.type === ResourceType.ROOM || r.type === ResourceType.HALL).length;
    const totalEquipment = resources.filter(r => r.type === ResourceType.EQUIPMENT).length;
    const totalLabs = resources.filter(r => r.type === ResourceType.LAB).length;
    const availableCount = resources.filter(r => r.isAvailable).length;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    // Build FullCalendar events for the selected resource
    // Use slightly different colors for resources to distinguish from events
    const RESOURCE_COLORS = ['#ea4335', '#FBBC04', '#34A853', '#4285F4', '#9334E6'];

    const calendarEvents: EventInput[] = selectedResource
        ? bookings
            .filter(b => b.resourceId === selectedResource.id)
            .map((b, i) => ({
                id: b.id,
                title: b.title,
                start: b.startTime,
                end: b.endTime,
                backgroundColor: RESOURCE_COLORS[i % RESOURCE_COLORS.length],
                borderColor: RESOURCE_COLORS[i % RESOURCE_COLORS.length],
                textColor: '#ffffff',
            }))
        : [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Square size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900">{totalRooms}</p>
                            <p className="text-xs text-surface-500">Rooms</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600"><Monitor size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900">{totalEquipment}</p>
                            <p className="text-xs text-surface-500">Equipment</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50 text-green-600"><Users size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900">{availableCount}</p>
                            <p className="text-xs text-surface-500">Available</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Monitor size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900">{totalLabs}</p>
                            <p className="text-xs text-surface-500">Labs</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white shadow-lg shadow-primary-500/25 flex items-center gap-2 hover:bg-primary-700 transition-all"
                    >
                        <Plus size={16} />
                        Add Resource
                    </button>
                    {['all', 'rooms', 'labs', 'equipment', 'vehicles'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat as CategoryFilter); setSelectedCategory(null); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${categoryFilter === cat
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                                }`}
                        >
                            {cat === 'all' ? 'All Resources' : cat === 'rooms' ? 'Rooms & Halls' : cat === 'labs' ? 'Labs' : cat === 'vehicles' ? 'Vehicles' : 'Equipment'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex rounded-xl border border-surface-200 bg-white overflow-hidden">
                        <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50'}`}>
                            <Grid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50'}`}>
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('timeline')} className={`p-2.5 ${viewMode === 'timeline' ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50'}`} title="Timeline View">
                            <Calendar size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {categoryFilter !== 'all' && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selectedCategory ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                            }`}
                    >
                        All {categoryFilter === 'rooms' ? 'Rooms' : 'Equipment'}
                    </button>
                    {(categoryFilter === 'rooms' ? ROOM_CATEGORIES : EQUIPMENT_CATEGORIES).map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.key ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin"></div>
                </div>
            ) : viewMode === 'timeline' ? (
                <ResourceTimeline
                    resources={filteredResources}
                    bookings={bookings}
                    onBookClick={(_) => {
                    }}
                />
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                        : 'space-y-3'
                    }
                >
                    {filteredResources.map((resource) => (
                        <motion.div
                            key={resource.id}
                            variants={item}
                            className={`glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : 'p-5'
                                }`}
                        >
                            {viewMode === 'grid' ? (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${resource.type === ResourceType.ROOM || resource.type === ResourceType.HALL ? 'bg-indigo-50 text-indigo-600' : resource.type === ResourceType.LAB ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {resource.type === ResourceType.ROOM || resource.type === ResourceType.HALL ? <Square size={24} /> : <Monitor size={24} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resource.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                }`}>
                                                {resource.isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={(e) => handleDeleteResource(resource.id, e)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Resource"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-surface-900 mb-1">{resource.name}</h3>
                                    {resource.capacity && (
                                        <p className="text-sm text-surface-500 flex items-center gap-1 mb-4">
                                            <Users size={14} /> Capacity: {resource.capacity}
                                        </p>
                                    )}
                                    <div className="flex gap-2 w-full">
                                        {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                            <button
                                                onClick={() => setSelectedResource(resource)}
                                                disabled={!resource.isAvailable}
                                                className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-surface-900 text-white hover:bg-surface-800"
                                            >
                                                {resource.isAvailable ? (user?.role === 'ADMIN' ? 'Book' : 'Request') : 'Unavailable'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedResource(resource)}
                                            className="px-3 py-2.5 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors"
                                            title="View Schedule"
                                        >
                                            <Calendar size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`p-2.5 rounded-xl ${resource.type === ResourceType.ROOM || resource.type === ResourceType.HALL ? 'bg-indigo-50 text-indigo-600' : resource.type === ResourceType.LAB ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {resource.type === ResourceType.ROOM || resource.type === ResourceType.HALL ? <Square size={20} /> : <Monitor size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-surface-900">{resource.name}</h3>
                                        {resource.capacity && <p className="text-sm text-surface-500">Capacity: {resource.capacity}</p>}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resource.isAvailable ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                        }`}>
                                        {resource.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                    {user?.role === 'ADMIN' && (
                                        <button
                                            onClick={(e) => handleDeleteResource(resource.id, e)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Resource"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedResource(resource)}
                                            className="p-2 text-surface-600 hover:bg-surface-50 rounded-lg transition-colors border border-surface-200"
                                            title="View Schedule"
                                        >
                                            <Calendar size={18} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedResource(resource)}
                                            disabled={!resource.isAvailable}
                                            className="px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700"
                                        >
                                            {user?.role === 'ADMIN' ? 'Book' : 'Request'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {
                filteredResources.length === 0 && !loading && viewMode !== 'timeline' && (
                    <div className="text-center py-16">
                        <Filter className="mx-auto text-surface-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-surface-900">No resources found</h3>
                        <p className="text-surface-500 mt-1 mb-4">Get started by adding your first resource</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white shadow-lg shadow-primary-500/25 inline-flex items-center gap-2 hover:bg-primary-700 transition-all"
                        >
                            <Plus size={16} />
                            Add Resource
                        </button>
                    </div>
                )
            }

            {/* Resource Calendar Modal — FullCalendar */}
            <AnimatePresence>
                {selectedResource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedResource(null)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-white">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600 border border-surface-200">
                                            <Users size={12} />
                                            Capacity: {selectedResource.capacity}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600 border border-surface-200">
                                            <MapPin size={12} />
                                            {selectedResource.location}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-surface-900">
                                        Availability for {selectedResource.name}
                                    </h3>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                        <p className="text-xs text-surface-400 mr-2">
                                            Click & drag to book
                                        </p>
                                    )}
                                    <button
                                        onClick={() => setSelectedResource(null)}
                                        className="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-50"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden p-6 bg-surface-50/30">
                                <ResourceCalendar
                                    events={calendarEvents}
                                    initialDate={new Date()}
                                    onSlotSelect={(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') ? handleSlotSelect : undefined}
                                    readOnly={user?.role === 'PARTICIPANT'}
                                    height="100%"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Booking Modal (Inside Resource Calendar) */}
            <AnimatePresence>
                {isBookingModalOpen && bookingModalData && selectedResource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBookingModalOpen(false)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                                <h3 className="font-bold text-surface-900">Book {selectedResource.name}</h3>
                                <button onClick={() => setIsBookingModalOpen(false)} className="p-1 hover:bg-surface-200 rounded text-surface-500">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 uppercase mb-1.5 ml-1">Event Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Add title"
                                        value={newBookingTitle}
                                        onChange={(e) => setNewBookingTitle(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 uppercase mb-1.5 ml-1">Purpose / Description</label>
                                    <textarea
                                        placeholder="Optional description"
                                        value={newBookingPurpose}
                                        onChange={(e) => setNewBookingPurpose(e.target.value)}
                                        className="w-full px-4 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400 resize-none"
                                        rows={2}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-100">
                                    <Clock size={16} className="text-primary-500" />
                                    <span>
                                        {bookingModalData.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        {' - '}
                                        {bookingModalData.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 rounded-xl transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newBookingTitle.trim()}
                                        className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Book
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-surface-900">Add New Resource</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddResource} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newResource.name}
                                        onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 mb-1">Type</label>
                                        <select
                                            value={newResource.type}
                                            onChange={e => setNewResource({ ...newResource, type: e.target.value as ResourceType })}
                                            className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        >
                                            {Object.values(ResourceType).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 mb-1">Capacity</label>
                                        <input
                                            type="number"
                                            value={newResource.capacity}
                                            onChange={e => setNewResource({ ...newResource, capacity: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newResource.location || ''}
                                        onChange={e => setNewResource({ ...newResource, location: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                                    <textarea
                                        value={newResource.description || ''}
                                        onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-surface-700">
                                        <input
                                            type="checkbox"
                                            checked={newResource.isAvailable}
                                            onChange={e => setNewResource({ ...newResource, isAvailable: e.target.checked })}
                                            className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Available
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-surface-700">
                                        <input
                                            type="checkbox"
                                            checked={newResource.requiresApproval}
                                            onChange={e => setNewResource({ ...newResource, requiresApproval: e.target.checked })}
                                            className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        Requires Approval
                                    </label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/25"
                                    >
                                        Create Resource
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
