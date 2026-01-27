import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Booking, Resource } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon, Server, Users, MoreHorizontal } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    startHour: number;
    endHour: number;
    day: number; // 0-6 for week view
    color: string;
    location?: string;
    resourceId?: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
];

export default function Calendar() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'events' | 'resources'>('events');

    // Data state
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [dbEvents, setDbEvents] = useState<Event[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [eventBookings, setEventBookings] = useState<Booking[]>([]); // For details modal

    const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
    const [resizingEvent, setResizingEvent] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);

    // Drag to Create State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ day: number, hour: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ day: number, hour: number } | null>(null);

    // Quick Add Popover State
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: '',
        endDate: '',
        startHour: 9,
        endHour: 10,
    });

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const calendarRef = useRef<HTMLDivElement>(null);
    const quickAddRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedEvents, fetchedBookings, fetchedResources] = await Promise.all([
                    api.getEvents(),
                    api.getBookings({ upcoming: false }), // Fetch all for calendar
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

    // Get week dates
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

    // Update events when week changes or data loads
    useEffect(() => {
        const startOfWeek = weekDates[0];
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(weekDates[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        let mapped: CalendarEvent[] = [];

        if (viewMode === 'events') {
            if (dbEvents.length === 0) return;

            const currentWeekEvents = dbEvents.filter(e => {
                const d = new Date(e.date);
                return d >= startOfWeek && d <= endOfWeek;
            });

            mapped = currentWeekEvents.map(e => {
                const d = new Date(e.date);
                // Simple hash for color
                const colorIdx = e.id.charCodeAt(0) % COLORS.length;

                return {
                    id: e.id,
                    title: e.title,
                    startHour: d.getHours(),
                    endHour: d.getHours() + 2, // Default duration if not specified or calculate from endDate
                    day: d.getDay(),
                    color: COLORS[colorIdx],
                    location: e.location
                };
            });
        } else {
            // Resource View
            if (bookings.length === 0) return;

            const currentWeekBookings = bookings.filter(b => {
                const d = new Date(b.startTime);
                return d >= startOfWeek && d <= endOfWeek && b.status === 'APPROVED';
            });

            mapped = currentWeekBookings.map(b => {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);

                return {
                    id: b.id,
                    title: `${b.resource?.name || 'Resource'}: ${b.title}`,
                    startHour: start.getHours(),
                    endHour: end.getHours() || 24,
                    day: start.getDay(),
                    color: 'bg-slate-600',
                    location: b.resource?.name,
                    resourceId: b.resourceId
                };
            });
        }

        setEvents(mapped);
    }, [dbEvents, bookings, currentDate, viewMode]);

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    // Coordinate Helpers
    const getGridCoordinates = (e: React.MouseEvent) => {
        if (!calendarRef.current) return null;
        const rect = calendarRef.current.getBoundingClientRect();
        const gridTop = rect.top + 48; // Header height
        const cellHeight = (rect.height - 48) / HOURS.length;
        const cellWidth = (rect.width - 60) / 7; // 60px for time column

        const relativeY = e.clientY - gridTop;
        const relativeX = e.clientX - rect.left - 60;

        // Clamp values
        const hour = Math.max(8, Math.min(21, Math.floor(relativeY / cellHeight) + 8));
        const day = Math.max(0, Math.min(6, Math.floor(relativeX / cellWidth)));

        // Exact fraction for smoother dragging if needed, keeping integers for now
        return { day, hour };
    };

    // Handle mouse events for dragging/resizing/selecting
    const handleMouseDown = (e: React.MouseEvent, eventId?: string, edge?: 'top' | 'bottom') => {
        // Prevent selection if clicking header or popover
        if ((e.target as HTMLElement).closest('.grid-header') || (e.target as HTMLElement).closest('.quick-add-popover')) return;

        // Close popover if clicking elsewhere
        if (showQuickAdd) {
            setShowQuickAdd(false);
        }

        if (eventId) {
            e.stopPropagation();
            if (edge) {
                setResizingEvent({ id: eventId, edge });
            } else {
                setDraggingEvent(eventId);
            }
        } else {
            // Start Selection
            const coords = getGridCoordinates(e);
            if (coords) {
                setIsSelecting(true);
                setSelectionStart(coords);
                setSelectionEnd(coords);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getGridCoordinates(e);
        if (!coords) return;

        if (resizingEvent) {
            setEvents(events.map(ev => {
                if (ev.id !== resizingEvent.id) return ev;
                if (resizingEvent.edge === 'top') {
                    const newStart = Math.min(coords.hour, ev.endHour - 1);
                    return { ...ev, startHour: newStart };
                } else {
                    const newEnd = Math.max(coords.hour + 1, ev.startHour + 1);
                    return { ...ev, endHour: newEnd };
                }
            }));
        } else if (draggingEvent) {
            setEvents(events.map(ev => {
                if (ev.id !== draggingEvent) return ev;
                const duration = ev.endHour - ev.startHour;
                const newStart = Math.max(8, Math.min(22 - duration, coords.hour));
                return { ...ev, day: coords.day, startHour: newStart, endHour: newStart + duration };
            }));
        } else if (isSelecting && selectionStart) {
            // Update selection end
            // Restrict to same day for simplicity
            setSelectionEnd({ day: selectionStart.day, hour: coords.hour });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isSelecting && selectionStart && selectionEnd) {
            // Finalize Selection -> OPEN QUICK ADD POPOVER
            const startH = Math.min(selectionStart.hour, selectionEnd.hour);
            const endH = Math.max(selectionStart.hour, selectionEnd.hour) + 1;
            const dayIdx = selectionStart.day;

            const selectedDate = weekDates[dayIdx];
            const dateStr = selectedDate.toISOString().split('T')[0];

            setNewEvent({
                title: '',
                startDate: dateStr,
                endDate: dateStr,
                startHour: startH,
                endHour: endH,
            });

            // Calculate Position
            if (calendarRef.current) {
                // Position to the right of the selection if possible, otherwise left
                // Simple logic: we need the absolute coordinates relative to the calendar container

                // We generated selection based on percentages, but for the popover we need px relative to container
                const rect = calendarRef.current.getBoundingClientRect();
                const cellWidth = (rect.width - 60) / 7;

                // Left offset = 60px time col + (dayIndex * cellWidth) + cellWidth (to be on right) + padding
                let left = 60 + (dayIdx + 1) * cellWidth + 20;

                // If close to right edge (Fri/Sat), show on left side instead
                if (dayIdx >= 5) {
                    // Left offset = 60px + (dayIndex * cellWidth) - PopoverWidth - padding
                    // Assuming popover is around 320px
                    left = 60 + (dayIdx * cellWidth) - 340;
                }

                // Top offset = (startHour - 8) * 60px + HeaderHeight (48px)
                // Center it vertically on the selection start
                const top = (startH - 8) * 60 + 48;

                setPopoverPosition({ top, left });
                setShowQuickAdd(true);
            }
        }

        setDraggingEvent(null);
        setResizingEvent(null);
        setIsSelecting(false);
        // Do NOT clear selectionStart/End immediately if we want to show the blue box while popover is open
        // But for now, let's clear it to keep it clean, or keep it to show context?
        // Let's keep the helper box visible by NOT clearing if showQuickAdd is true... 
        // actually easier to clear and rely on the popover context.
        // We'll clear for now.
        // setSelectionStart(null);
        // setSelectionEnd(null);
    };

    const handleQuickCreate = async () => {
        if (!newEvent.title) return;

        try {
            const start = new Date(newEvent.startDate);
            start.setHours(newEvent.startHour);

            const end = new Date(newEvent.endDate);
            end.setHours(newEvent.endHour);

            // Check if multi-day
            const isMultiDay = newEvent.startDate !== newEvent.endDate;

            await api.createEvent({
                title: newEvent.title,
                description: '',
                date: start.toISOString(),
                endDate: end.toISOString(),
                location: '', // Default empty for quick add
                budget: 0,
                isMultiDay: isMultiDay as any
            });

            // Refresh events
            const [fetchedEvents, fetchedBookings] = await Promise.all([
                api.getEvents(),
                api.getBookings({ upcoming: false })
            ]);
            setDbEvents(fetchedEvents);
            setBookings(fetchedBookings);

            setShowQuickAdd(false);
            setSelectionStart(null);
            setSelectionEnd(null);
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Failed to create event");
        }
    };

    const handleMoreOptions = () => {
        // Navigate to full create page with state
        const start = new Date(newEvent.startDate);
        start.setHours(newEvent.startHour);

        const end = new Date(newEvent.endDate);
        end.setHours(newEvent.endHour);

        navigate('/create-event', {
            state: {
                title: newEvent.title,
                date: start.toISOString(),
                endDate: end.toISOString()
            }
        });
    };

    const handleDeleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
        setSelectedEvent(null);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Helper to get capacity bar for details modal
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Event Calendar</h1>
                    <p className="text-surface-500 mt-1">Plan and manage your campus events</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
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

            {/* Calendar Grid */}
            <div
                ref={calendarRef}
                className="glass-card rounded-2xl overflow-hidden select-none relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={(e) => {
                    // Only stop selection if mouse leaves, but do nothing on mouse up
                    handleMouseUp(e);
                }}
                onMouseDown={(e) => handleMouseDown(e)}
            >
                {/* Days header */}
                <div className="grid grid-cols-8 border-b border-surface-200 bg-surface-50 grid-header">
                    <div className="w-[60px]"></div>
                    {weekDates.map((date, i) => (
                        <div key={i} className="py-3 text-center border-l border-surface-200">
                            <p className="text-xs text-surface-500 uppercase">{DAYS[i]}</p>
                            <p className={`text-lg font-semibold ${isToday(date) ? 'text-white bg-primary-600 w-8 h-8 rounded-full mx-auto flex items-center justify-center' : 'text-surface-900'}`}>
                                {date.getDate()}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Time grid */}
                <div className="relative" style={{ height: `${HOURS.length * 60}px` }}>
                    {/* Hour rows */}
                    {HOURS.map((hour, i) => (
                        <div key={hour} className="absolute left-0 right-0 flex border-b border-surface-100" style={{ top: `${i * 60}px`, height: '60px' }}>
                            <div className="w-[60px] pr-2 pt-1 text-right">
                                <span className="text-xs text-surface-400">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</span>
                            </div>
                            {Array.from({ length: 7 }).map((_, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className="flex-1 border-l border-surface-100 hover:bg-primary-50/50 transition-colors"
                                />
                            ))}
                        </div>
                    ))}

                    {/* Drag Selection Overlay */}
                    {(isSelecting || (showQuickAdd && selectionStart && selectionEnd)) && selectionStart && selectionEnd && (
                        <div
                            className="absolute bg-primary-500/20 border-2 border-primary-500 rounded-lg pointer-events-none z-0"
                            style={{
                                top: `${(Math.min(selectionStart.hour, selectionEnd.hour) - 8) * 60}px`,
                                height: `${(Math.abs(selectionEnd.hour - selectionStart.hour) + 1) * 60}px`,
                                left: `${60 + (selectionStart.day * ((100 - 4.5) / 7))}%`,
                                width: `${(100 - 4.5) / 7 - 0.5}%`
                            }}
                        />
                    )}

                    {/* Events */}
                    {events.map((event) => {
                        const top = (event.startHour - 8) * 60;
                        const height = (event.endHour - event.startHour) * 60;
                        const left = 60 + (event.day * ((100 - 4.5) / 7));
                        const width = (100 - 4.5) / 7 - 0.5;

                        return (
                            <motion.div
                                key={event.id}
                                layoutId={event.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    if (viewMode === 'events') {
                                        const relatedBookings = bookings.filter(b => b.eventId === event.id);
                                        setEventBookings(relatedBookings);
                                    } else {
                                        setEventBookings([]);
                                    }
                                }}
                                className={`absolute rounded-lg ${event.color} text-white text-sm p-2 cursor-move overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${draggingEvent === event.id || resizingEvent?.id === event.id ? 'opacity-80 z-20' : 'z-10'
                                    }`}
                                style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    left: `${left}%`,
                                    width: `${width}%`,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, event.id)}
                            >
                                {/* Top resize handle */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20"
                                    onMouseDown={(e) => handleMouseDown(e, event.id, 'top')}
                                />

                                <p className="font-medium truncate">{event.title}</p>
                                <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                                    <Clock size={10} />
                                    {event.startHour > 12 ? event.startHour - 12 : event.startHour}
                                    {event.startHour >= 12 ? 'PM' : 'AM'} -
                                    {event.endHour > 12 ? event.endHour - 12 : event.endHour}
                                    {event.endHour >= 12 ? 'PM' : 'AM'}
                                </p>
                                {event.location && height >= 80 && (
                                    <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                                        <MapPin size={10} />
                                        {event.location}
                                    </p>
                                )}

                                {/* Bottom resize handle */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20"
                                    onMouseDown={(e) => handleMouseDown(e, event.id, 'bottom')}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* QUICK ADD POPOVER */}
            <AnimatePresence>
                {showQuickAdd && popoverPosition && (
                    <motion.div
                        ref={quickAddRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-50 bg-white rounded-xl shadow-2xl border border-surface-200 w-[320px] quick-add-popover"
                        style={{
                            top: popoverPosition.top,
                            left: popoverPosition.left
                        }}
                    >
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-surface-900">Quick Add Event</h3>
                                <button onClick={() => {
                                    setShowQuickAdd(false);
                                    setSelectionStart(null);
                                    setSelectionEnd(null);
                                }} className="text-surface-400 hover:text-surface-700">
                                    <X size={16} />
                                </button>
                            </div>

                            <input
                                autoFocus
                                type="text"
                                placeholder="Add title"
                                className="w-full text-lg font-medium border-0 border-b-2 border-surface-200 focus:border-primary-500 focus:ring-0 px-0 py-2 mb-4 bg-transparent placeholder-surface-400"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickCreate();
                                }}
                            />

                            <div className="flex items-center gap-2 text-sm text-surface-600 mb-4 bg-surface-50 p-2 rounded-lg">
                                <Clock size={14} className="text-primary-500" />
                                <span>
                                    {newEvent.startHour > 12 ? newEvent.startHour - 12 : newEvent.startHour}:00 -
                                    {newEvent.endHour > 12 ? newEvent.endHour - 12 : newEvent.endHour}:00
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleQuickCreate}
                                    className="flex-1 bg-primary-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleMoreOptions}
                                    className="px-3 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 transition-colors"
                                    title="More Options"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Event Details Popup */}
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

                            {/* Resource Info for Resource View */}
                            {viewMode === 'resources' && selectedEvent.resourceId && (
                                <div className="mt-4 pt-4 border-t border-surface-100">
                                    <h4 className="text-xs font-semibold text-surface-500 uppercase mb-2 flex items-center gap-1">
                                        <Server size={12} /> Resource Details
                                    </h4>
                                    <div className="bg-surface-50 p-2 rounded-lg border border-surface-200">
                                        <p className="font-medium text-surface-900">{selectedEvent.location}</p>
                                        {/* Capacity Bar */}
                                        {getResourceCapacityBar(selectedEvent.resourceId)}
                                    </div>
                                </div>
                            )}

                            {/* Resource Bookings / Sub-events for Events View */}
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
                                                {/* Capacity Bar Integration here as well */}
                                                {b.resourceId && getResourceCapacityBar(b.resourceId)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                                className="w-full mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
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
