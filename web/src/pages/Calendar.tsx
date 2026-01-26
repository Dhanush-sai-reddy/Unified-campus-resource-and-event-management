import { useState, useRef, useEffect } from 'react';
import { Event } from '../types';
import { getMyEvents } from '../services/mockService';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    startHour: number;
    endHour: number;
    day: number; // 0-6 for week view
    color: string;
    location?: string;
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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [dbEvents, setDbEvents] = useState<Event[]>([]);

    const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
    const [resizingEvent, setResizingEvent] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', day: 0, startHour: 9, endHour: 10, location: '' });
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const calendarRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        getMyEvents().then(data => {
            setDbEvents(data);
        });
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
        if (dbEvents.length === 0) return;

        const startOfWeek = weekDates[0];
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(weekDates[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        const currentWeekEvents = dbEvents.filter(e => {
            const d = new Date(e.date);
            return d >= startOfWeek && d <= endOfWeek;
        });

        const mapped: CalendarEvent[] = currentWeekEvents.map(e => {
            const d = new Date(e.date);
            return {
                id: e.id,
                title: e.title,
                startHour: d.getHours(),
                endHour: d.getHours() + 2, // Default duration if not specified
                day: d.getDay(),
                color: 'bg-indigo-500',
                location: e.location
            };
        });

        setEvents(mapped);
    }, [dbEvents, currentDate]);

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    // Handle mouse events for dragging/resizing
    const handleMouseDown = (e: React.MouseEvent, eventId: string, edge?: 'top' | 'bottom') => {
        e.stopPropagation();
        if (edge) {
            setResizingEvent({ id: eventId, edge });
        } else {
            setDraggingEvent(eventId);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!calendarRef.current) return;

        const rect = calendarRef.current.getBoundingClientRect();
        const gridTop = rect.top + 48; // Header height
        const cellHeight = (rect.height - 48) / HOURS.length;
        const cellWidth = (rect.width - 60) / 7; // 60px for time column

        const relativeY = e.clientY - gridTop;
        const relativeX = e.clientX - rect.left - 60;

        const hour = Math.max(8, Math.min(21, Math.floor(relativeY / cellHeight) + 8));
        const day = Math.max(0, Math.min(6, Math.floor(relativeX / cellWidth)));

        if (resizingEvent) {
            setEvents(events.map(ev => {
                if (ev.id !== resizingEvent.id) return ev;
                if (resizingEvent.edge === 'top') {
                    const newStart = Math.min(hour, ev.endHour - 1);
                    return { ...ev, startHour: newStart };
                } else {
                    const newEnd = Math.max(hour + 1, ev.startHour + 1);
                    return { ...ev, endHour: newEnd };
                }
            }));
        } else if (draggingEvent) {
            setEvents(events.map(ev => {
                if (ev.id !== draggingEvent) return ev;
                const duration = ev.endHour - ev.startHour;
                const newStart = Math.max(8, Math.min(22 - duration, hour));
                return { ...ev, day, startHour: newStart, endHour: newStart + duration };
            }));
        }
    };

    const handleMouseUp = () => {
        setDraggingEvent(null);
        setResizingEvent(null);
    };

    // Create new event
    const handleCellClick = (day: number, hour: number) => {
        setNewEvent({ title: '', day, startHour: hour, endHour: hour + 1, location: '' });
        setIsModalOpen(true);
    };

    const handleCreateEvent = () => {
        if (!newEvent.title) return;
        const event: CalendarEvent = {
            id: Date.now().toString(),
            title: newEvent.title,
            day: newEvent.day,
            startHour: newEvent.startHour,
            endHour: newEvent.endHour,
            location: newEvent.location,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        setEvents([...events, event]);
        setIsModalOpen(false);
        setNewEvent({ title: '', day: 0, startHour: 9, endHour: 10, location: '' });
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Event Calendar</h1>
                    <p className="text-surface-500 mt-1">Plan and manage your campus events</p>
                </div>
                <div className="flex items-center gap-3">
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
                className="glass-card rounded-2xl overflow-hidden select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Days header */}
                <div className="grid grid-cols-8 border-b border-surface-200 bg-surface-50">
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
                                    onClick={() => handleCellClick(dayIndex, hour)}
                                    className="flex-1 border-l border-surface-100 hover:bg-primary-50/50 transition-colors cursor-pointer"
                                />
                            ))}
                        </div>
                    ))}

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
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
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

            {/* Tip */}
            <div className="flex items-center gap-2 text-sm text-surface-500 bg-surface-50 rounded-xl p-4">
                <CalendarIcon size={16} className="text-primary-500" />
                <span><strong>Tip:</strong> Click on any time slot to create an event. Drag events to move them, or drag the top/bottom edges to resize.</span>
            </div>

            {/* Create Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                    >
                        <h3 className="text-lg font-bold text-surface-900 mb-4">Create Event</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g., Team Meeting"
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                    placeholder="e.g., Room 101"
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Start Time</label>
                                    <select
                                        value={newEvent.startHour}
                                        onChange={(e) => setNewEvent({ ...newEvent, startHour: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    >
                                        {HOURS.map(h => (
                                            <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">End Time</label>
                                    <select
                                        value={newEvent.endHour}
                                        onChange={(e) => setNewEvent({ ...newEvent, endHour: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    >
                                        {HOURS.filter(h => h > newEvent.startHour).map(h => (
                                            <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/25 transition-colors"
                            >
                                Create Event
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

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
