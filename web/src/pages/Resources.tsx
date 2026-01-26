import { useState, useEffect } from 'react';
import { Resource, ResourceType, Booking } from '../types';
import { getResources, createBooking, getBookings } from '../services/mockService';
import { Monitor, Square, Search, X, Users, Grid, List, Filter, ChevronLeft, ChevronRight, CalendarDays, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ResourceTimeline from '../components/ResourceTimeline';

type ViewMode = 'grid' | 'list' | 'timeline';
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

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Mini Calendar Component
function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (date: Date) => void }) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Add padding for days before first day
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days in month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date: Date) => {
        return date.toDateString() === today.toDateString();
    };

    const isPast = (date: Date) => {
        return date < today;
    };

    const navigateMonth = (direction: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    return (
        <div className="bg-surface-50 rounded-xl p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-600 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="font-medium text-surface-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                    onClick={() => navigateMonth(1)}
                    className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-600 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-surface-500 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => (
                    <div key={i} className="aspect-square">
                        {date ? (
                            <button
                                onClick={() => !isPast(date) && onSelect(date)}
                                disabled={isPast(date)}
                                className={`w-full h-full rounded-lg text-sm font-medium transition-all ${isSelected(date)
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                    : isToday(date)
                                        ? 'bg-primary-100 text-primary-700'
                                        : isPast(date)
                                            ? 'text-surface-300 cursor-not-allowed'
                                            : 'text-surface-700 hover:bg-surface-200'
                                    }`}
                            >
                                {date.getDate()}
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Time Slot Selector
function TimeSlotSelector({ label, value, onChange }: { label: string; value: string; onChange: (time: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">{label}</label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
                {TIME_SLOTS.map(time => (
                    <button
                        key={time}
                        type="button"
                        onClick={() => onChange(time)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${value === time
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                            }`}
                    >
                        {time}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function Resources() {
    const { user } = useAuth();

    if (user?.role === 'PARTICIPANT') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-surface-100 p-4 rounded-full mb-4">
                    <Lock size={48} className="text-surface-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 mb-2">Access Restricted</h2>
                <p className="text-surface-500 max-w-md">
                    Resource booking is restricted to Organizers and Administrators.
                    Please contact an administrator if you need access.
                </p>
            </div>
        );
    }

    const [resources, setResources] = useState<Resource[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Booking form state
    const [eventName, setEventName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resData, bookingsData] = await Promise.all([
                getResources(),
                getBookings()
            ]);
            setResources(resData);
            setBookings(bookingsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
        setLoading(false);
    };

    // Reset end date when start date changes if not multi-day
    useEffect(() => {
        if (!isMultiDay) {
            setEndDate(new Date(selectedDate));
        }
    }, [selectedDate, isMultiDay]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleBookClick = (resource: Resource) => {
        setSelectedResource(resource);
        setIsModalOpen(true);
        setError(null);
        setSelectedDate(new Date());
        setEndDate(new Date());
        setIsMultiDay(false);
        setStartTime('09:00');
        setEndTime('10:00');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResource || !user) return;

        // Reset error
        setError(null);

        // Validate dates and times
        const startDateStr = selectedDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const startDateTime = new Date(`${startDateStr}T${startTime}:00`);
        const endDateTime = new Date(`${endDateStr}T${endTime}:00`);

        if (endDateTime <= startDateTime) {
            setError('End time must be after start time');
            return;
        }

        try {
            await createBooking({
                resourceId: selectedResource.id,
                userId: user.id,
                userName: user.name,
                eventName,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
            });
            setIsModalOpen(false);
            setEventName('');
            fetchData();
        } catch (err: any) {
            setError(err.message || "Failed to book resource");
        }
    };

    // Filter resources
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

    // Stats
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

    return (
        <div className="space-y-8">
            {/* Header with Stats */}
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

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
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
                            <CalendarDays size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub-category chips */}
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

            {/* Resources View */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin"></div>
                </div>
            ) : viewMode === 'timeline' ? (
                <ResourceTimeline
                    resources={filteredResources}
                    bookings={bookings}
                    onBookClick={(_) => {
                        // Handle booking click if needed
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
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resource.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                            }`}>
                                            {resource.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-surface-900 mb-1">{resource.name}</h3>
                                    {resource.capacity && (
                                        <p className="text-sm text-surface-500 flex items-center gap-1 mb-4">
                                            <Users size={14} /> Capacity: {resource.capacity}
                                        </p>
                                    )}
                                    {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                        <button
                                            onClick={() => handleBookClick(resource)}
                                            disabled={!resource.isAvailable}
                                            className="w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-surface-900 text-white hover:bg-surface-800"
                                        >
                                            {resource.isAvailable ? (user?.role === 'ADMIN' ? 'Book Now' : 'Request') : 'Unavailable'}
                                        </button>
                                    )}
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
                                    {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                        <button
                                            onClick={() => handleBookClick(resource)}
                                            disabled={!resource.isAvailable}
                                            className="px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700"
                                        >
                                            {user?.role === 'ADMIN' ? 'Book' : 'Request'}
                                        </button>
                                    )}
                                </>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {filteredResources.length === 0 && !loading && viewMode !== 'timeline' && (
                <div className="text-center py-16">
                    <Filter className="mx-auto text-surface-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-surface-900">No resources found</h3>
                    <p className="text-surface-500 mt-1">Try adjusting your filters</p>
                </div>
            )}

            {/* Booking Modal with Calendar */}
            <AnimatePresence>
                {isModalOpen && selectedResource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-surface-900">
                                        {user?.role === 'ADMIN' ? 'Book Resource' : 'Request Resource'}
                                    </h3>
                                    <p className="text-sm text-surface-500">{selectedResource.name}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Calendar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-surface-700">
                                                {isMultiDay ? 'Start Date' : 'Select Date'}
                                            </label>
                                            <label className="flex items-center gap-2 text-xs text-primary-600 cursor-pointer select-none bg-primary-50 px-2 py-1 rounded-lg border border-primary-100">
                                                <input
                                                    type="checkbox"
                                                    checked={isMultiDay}
                                                    onChange={(e) => setIsMultiDay(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500"
                                                />
                                                Multi-day Event
                                            </label>
                                        </div>

                                        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />

                                        {isMultiDay && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-surface-700 mb-2">End Date</label>
                                                <MiniCalendar selectedDate={endDate} onSelect={setEndDate} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Event details and time */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-surface-700 mb-2">Event Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={eventName}
                                                onChange={(e) => setEventName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                                placeholder="What's this booking for?"
                                            />
                                        </div>

                                        <div className="p-4 bg-surface-50 rounded-xl space-y-3 border border-surface-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-surface-500">From</span>
                                                <span className="font-medium text-surface-900">
                                                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {startTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-surface-500">To</span>
                                                <span className="font-medium text-surface-900">
                                                    {(isMultiDay ? endDate : selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {endTime}
                                                </span>
                                            </div>
                                        </div>

                                        <TimeSlotSelector label="Start Time (Day 1)" value={startTime} onChange={setStartTime} />
                                        <TimeSlotSelector label={`End Time (${isMultiDay ? 'Last Day' : 'Day 1'})`} value={endTime} onChange={setEndTime} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-surface-100">
                                    {selectedResource?.requiresApproval && user?.role !== 'ADMIN' && (
                                        <p className="text-xs text-surface-500 flex-1">
                                            ⏳ This resource requires admin approval
                                        </p>
                                    )}
                                    <div className="flex gap-3 ml-auto">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/25"
                                        >
                                            {user?.role === 'ADMIN' ? 'Book Resource' : 'Request Resource'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
