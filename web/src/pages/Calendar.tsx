import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Event, Booking, Resource, EventStatus } from '../types';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon, Server, Users, MessageCircle } from 'lucide-react';
import CalendarGrid, { CalendarEvent } from '../components/CalendarGrid';
import { useAuth } from '../context/AuthContext';

export default function Calendar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<'events' | 'resources'>(
        (searchParams.get('view') as 'events' | 'resources') || 'events'
    );

    const [dbEvents, setDbEvents] = useState<Event[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [eventBookings, setEventBookings] = useState<Booking[]>([]);

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
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
        fetchData();
    }, []);

    const getWeekDates = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const handleDeleteEvent = (id: string) => {
        const updated = dbEvents.filter(e => e.id !== id);
        setDbEvents(updated);
        api.deleteEvent(id).then(() => {
            setDbEvents(prev => prev.filter(e => e.id !== id));
        });
        setSelectedEvent(null);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <div className="space-y-6 relative">
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

                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex items-center bg-white border border-surface-200 rounded-xl overflow-hidden">
                        <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-surface-50 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-surface-700 min-w-[200px] text-center">
                            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                        </span>
                        <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-surface-50 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <CalendarGrid
                readOnly={user?.role === 'PARTICIPANT'}
                viewMode={viewMode}
                currentDate={currentDate}
                events={dbEvents}
                bookings={bookings}
                resources={resources}
                onEventCreate={async (data) => {
                    const isMultiDay = data.startDate !== data.endDate;
                    const start = new Date(data.startDate);
                    start.setHours(data.startHour);
                    const end = new Date(data.endDate);
                    end.setHours(data.endHour);

                    await api.createEvent({
                        title: data.title,
                        description: '',
                        date: start.toISOString(),
                        endDate: end.toISOString(),
                        location: '',
                        budget: 0,
                        isMultiDay: isMultiDay as any,
                        resourceId: data.resourceId
                    });

                    const [fetchedEvents, fetchedBookings] = await Promise.all([
                        api.getEvents('APPROVED,PENDING'),
                        api.getBookings({ upcoming: false })
                    ]);
                    setDbEvents(fetchedEvents);
                    setBookings(fetchedBookings);
                }}
                onEventClick={(event) => {
                    setSelectedEvent(event);
                    if (viewMode === 'events') {
                        const relatedBookings = bookings.filter(b => b.eventId === event.originalEvent?.id);
                        setEventBookings(relatedBookings);
                    } else {
                        setEventBookings([]);
                    }
                }}
                onEventUpdate={async (event) => {
                    try {
                        if (viewMode === 'events') {
                            if (!event.originalEvent) return;

                            const dayDate = weekDates[event.day];
                            const start = new Date(dayDate);
                            start.setHours(event.startHour, 0, 0, 0);

                            const end = new Date(dayDate);
                            end.setHours(event.endHour, 0, 0, 0);

                            await api.updateEvent(event.originalEvent.id, {
                                date: start.toISOString(),
                                endDate: end.toISOString()
                            });

                            const [fetchedEvents] = await Promise.all([api.getEvents('APPROVED,PENDING')]);
                            setDbEvents(fetchedEvents);
                        } else {
                            const resource = resources[event.day];
                            if (!resource) return;

                            const start = new Date(currentDate);
                            start.setHours(event.startHour, 0, 0, 0);

                            const end = new Date(currentDate);
                            end.setHours(event.endHour, 0, 0, 0);

                            await api.updateBooking(event.id, {
                                startTime: start.toISOString(),
                                endTime: end.toISOString(),
                                resourceId: resource.id
                            });

                            const [fetchedBookings] = await Promise.all([api.getBookings({ upcoming: false })]);
                            setBookings(fetchedBookings);
                        }
                    } catch (err) {
                        console.error("Failed to update event", err);
                    }
                }}
            />

            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedEvent(null)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className={`${selectedEvent.color} p-4 text-white`}>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                                <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-white/20 rounded">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">

                            <div className="flex items-center gap-2 text-sm text-surface-600">
                                <Clock size={16} />
                                <span>
                                    {selectedEvent.startHour > 12 ? selectedEvent.startHour - 12 : selectedEvent.startHour}:00
                                    {selectedEvent.startHour >= 12 ? ' PM' : ' AM'} -
                                    {selectedEvent.endHour > 12 ? selectedEvent.endHour - 12 : selectedEvent.endHour}:00
                                    {selectedEvent.endHour >= 12 ? ' PM' : ' AM'}
                                </span>
                            </div>
                            {selectedEvent.location && (
                                <div className="flex items-center gap-2 text-sm text-surface-600">
                                    <MapPin size={16} />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}

                            {viewMode === 'resources' && selectedEvent.resourceId && (
                                <div className="mt-4 pt-4 border-t border-surface-100">
                                    <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2 flex items-center gap-1">
                                        <Server size={12} /> Resource Details
                                    </h4>

                                    <div className="bg-surface-50 p-2 rounded-lg border border-surface-200">
                                        <p className="font-medium text-surface-900">{selectedEvent.location}</p>
                                        {getResourceCapacityBar(selectedEvent.resourceId)}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'events' && eventBookings.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-surface-100">
                                    <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2">Resource Allocations</h4>
                                    <div className="space-y-2">
                                        {eventBookings.map(b => (
                                            <div key={b.id} className="text-xs bg-surface-50 p-2 rounded-lg border border-surface-200">
                                                <div className="flex justify-between font-medium text-surface-900">
                                                    <span>{b.resource?.name}</span>
                                                    <span>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="text-surface-500 mt-0.5">{b.purpose}</div>
                                                {b.resourceId && getResourceCapacityBar(b.resourceId)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    const eventId = selectedEvent.originalEvent?.id;
                                    if (eventId) {
                                        navigate(`/chat?event=${eventId}&name=${encodeURIComponent(selectedEvent.title)}`);
                                    }
                                }}
                                className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16} />
                                Join Event Chat
                            </button>

                            {user?.role === 'ADMIN' && selectedEvent.originalEvent?.status === EventStatus.PENDING && (
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                if (!selectedEvent.originalEvent) return;
                                                await api.approveEvent(selectedEvent.originalEvent.id);
                                                const [fetchedEvents] = await Promise.all([api.getEvents('APPROVED,PENDING')]);
                                                setDbEvents(fetchedEvents);
                                                setSelectedEvent(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to approve event');
                                            }
                                        }}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
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
                                                const [fetchedEvents] = await Promise.all([api.getEvents('APPROVED,PENDING')]);
                                                setDbEvents(fetchedEvents);
                                                setSelectedEvent(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to reject event');
                                            }
                                        }}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                                className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                            >
                                Delete Event
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
