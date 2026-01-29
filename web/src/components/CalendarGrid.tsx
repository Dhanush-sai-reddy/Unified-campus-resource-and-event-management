import { useState, useRef, useEffect } from 'react';
import { Event, Booking, Resource } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Server } from 'lucide-react';

export interface CalendarEvent {
    id: string;
    title: string;
    startHour: number;
    endHour: number;
    day: number;
    color: string;
    location?: string;
    resourceId?: string;
    originalEvent?: Event;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const CALENDAR_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
];

interface CalendarGridProps {
    viewMode: 'events' | 'resources';
    currentDate: Date;
    events: Event[];
    bookings: Booking[];
    resources: Resource[];
    onEventCreate: (data: { title: string, startDate: string, endDate: string, startHour: number, endHour: number, resourceId?: string }) => Promise<void>;
    onDeleteEvent?: (id: string) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onEventUpdate?: (event: CalendarEvent) => Promise<void>;
    disableQuickAdd?: boolean;
    readOnly?: boolean;
}

export default function CalendarGrid({ viewMode, currentDate, events: dbEvents, bookings, resources, onEventCreate, onEventClick, onEventUpdate, disableQuickAdd, readOnly }: CalendarGridProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);


    const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
    const [resizingEvent, setResizingEvent] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);

    const [dragStartSnapshot, setDragStartSnapshot] = useState<CalendarEvent | null>(null);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ day: number, hour: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ day: number, hour: number } | null>(null);


    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number } | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: '',
        endDate: '',
        startHour: 9,
        endHour: 10,
        resourceId: ''
    });

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const quickAddRef = useRef<HTMLDivElement>(null);


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


    useEffect(() => {
        const startOfWeek = weekDates[0];
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(weekDates[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        let mapped: CalendarEvent[] = [];

        if (viewMode === 'events') {
            if (dbEvents.length === 0) return;

            dbEvents.forEach(e => {
                const startDate = new Date(e.date);
                const endDate = e.endDate ? new Date(e.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                const colorIdx = e.id.charCodeAt(0) % CALENDAR_COLORS.length;
                const color = CALENDAR_COLORS[colorIdx];

                if (endDate < startOfWeek || startDate > endOfWeek) {
                    console.log(`[DEBUG] Skipping event ${e.title}: Range ${startDate.toISOString()}-${endDate.toISOString()} outside week ${startOfWeek.toISOString()}-${endOfWeek.toISOString()}`);
                    return;
                }

                console.log(`[DEBUG] Processing event ${e.title} for week ${startOfWeek.toISOString()}`);

                for (let i = 0; i < 7; i++) {
                    const currentDayDate = new Date(weekDates[i]);
                    currentDayDate.setHours(0, 0, 0, 0);
                    const nextDayDate = new Date(currentDayDate);
                    nextDayDate.setDate(nextDayDate.getDate() + 1);

                    if (startDate < nextDayDate && endDate > currentDayDate) {
                        console.log(`[DEBUG] Event ${e.title} overlaps day ${i} (${currentDayDate.toISOString()})`);
                        let startH = 8;
                        let endH = 22;

                        if (startDate >= currentDayDate && startDate < nextDayDate) startH = startDate.getHours();
                        if (endDate > currentDayDate && endDate <= nextDayDate) {
                            endH = endDate.getHours();
                            if (endDate.getMinutes() > 0) endH++;
                        }

                        startH = Math.max(8, startH);
                        endH = Math.min(22, endH);

                        if (endH > startH) {
                            mapped.push({
                                id: `${e.id}_${i}`,
                                title: e.title,
                                startHour: startH,
                                endHour: endH,
                                day: i,
                                color: color,
                                location: e.location,
                                originalEvent: e,
                                resourceId: e.resourceId
                            });
                        }
                    }
                }
            });
        } else {
            if (resources.length > 0) {
                bookings.forEach(b => {
                    const bookingStart = new Date(b.startTime);
                    const bookingEnd = new Date(b.endTime);

                    const startOfDay = new Date(currentDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(currentDate);
                    endOfDay.setHours(23, 59, 59, 999);

                    if (bookingEnd < startOfDay || bookingStart > endOfDay) return;

                    const resourceIndex = resources.findIndex(r => r.id === b.resourceId);
                    if (resourceIndex >= 0) {
                        let startH = 8;
                        let endH = 22;

                        if (bookingStart >= startOfDay) startH = bookingStart.getHours();
                        if (bookingEnd <= endOfDay) {
                            endH = bookingEnd.getHours();
                            if (bookingEnd.getMinutes() > 0) endH++;
                        } else {
                            endH = 22;
                        }

                        startH = Math.max(8, startH);
                        endH = Math.min(22, endH);

                        if (endH > startH) {
                            mapped.push({
                                id: b.id,
                                title: b.title,
                                startHour: startH,
                                endHour: endH,
                                day: resourceIndex,
                                color: 'bg-slate-500',
                                location: b.resource?.name,
                                resourceId: b.resourceId
                            });
                        }
                    }
                });
            }
        }
        setEvents(mapped);
    }, [dbEvents, bookings, currentDate, viewMode, resources, weekDates]);


    const getGridCoordinates = (e: React.MouseEvent) => {
        if (!calendarRef.current) return null;
        const rect = calendarRef.current.getBoundingClientRect();
        const HEADER_HEIGHT = 50;
        const CELL_HEIGHT = 60;



        const gridTop = rect.top + HEADER_HEIGHT;
        const cellHeight = CELL_HEIGHT;
        const visibleCols = viewMode === 'resources' ? resources.length : 7;
        const cellWidth = (rect.width - 60) / visibleCols;

        const relativeY = e.clientY - gridTop;
        const relativeX = e.clientX - rect.left - 60;

        const hour = Math.max(8, Math.min(21, Math.floor(relativeY / cellHeight) + 8));
        const day = Math.max(0, Math.min((viewMode === 'resources' ? Math.max(0, resources.length - 1) : 6), Math.floor(relativeX / cellWidth)));

        return { day, hour };
    };

    const handleMouseDown = (e: React.MouseEvent, eventId?: string, edge?: 'top' | 'bottom') => {
        if (readOnly) return;
        if ((e.target as HTMLElement).closest('.grid-header') || (e.target as HTMLElement).closest('.quick-add-popover')) return;
        if (showQuickAdd) setShowQuickAdd(false);

        if (eventId) {
            e.stopPropagation();
            if (edge) setResizingEvent({ id: eventId, edge });
            else setDraggingEvent(eventId);


            const ev = events.find(e => e.id === eventId);
            if (ev) setDragStartSnapshot(ev);
        } else {
            const coords = getGridCoordinates(e);
            if (coords) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let targetDate = new Date();
                if (viewMode === 'events') {
                    targetDate = weekDates[coords.day];
                } else {
                    targetDate = currentDate;
                }

                // Create a comparison date (midnight)
                const checkDate = new Date(targetDate);
                checkDate.setHours(0, 0, 0, 0);

                if (checkDate < today) {
                    return; // Prevent selecting past days
                }

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
            setEvents(prev => prev.map(ev => {
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
            setEvents(prev => prev.map(ev => {
                if (ev.id !== draggingEvent) return ev;
                const duration = ev.endHour - ev.startHour;
                const newStart = Math.max(8, Math.min(22 - duration, coords.hour));
                return { ...ev, day: coords.day, startHour: newStart, endHour: newStart + duration };
            }));
        } else if (isSelecting && selectionStart) {
            setSelectionEnd({ day: coords.day, hour: coords.hour });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isSelecting && selectionStart && selectionEnd) {
            let startD = selectionStart.day;
            let endD = selectionEnd.day;
            let startH = selectionStart.hour;
            let endH = selectionEnd.hour;

            if (endD < startD) { [startD, endD] = [endD, startD]; }
            if (startD === endD && endH < startH) { [startH, endH] = [endH, startH]; }

            const dbEndH = endH + 1;

            let startDateStr = '';
            let endDateStr = '';
            let rId = undefined;

            const toLocalDateString = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            if (viewMode === 'events') {
                const startDateObj = weekDates[startD];
                const endDateObj = weekDates[endD];
                startDateStr = toLocalDateString(startDateObj);
                endDateStr = toLocalDateString(endDateObj);
            } else {
                startDateStr = toLocalDateString(currentDate);
                endDateStr = toLocalDateString(currentDate);
                const resource = resources[startD];
                if (resource) rId = resource.id;
            }

            const eventData = {
                title: '',
                startDate: startDateStr,
                endDate: endDateStr,
                startHour: startH,
                endHour: dbEndH,
                resourceId: rId || ''
            };

            setNewEvent(eventData);

            if (calendarRef.current) {
                const rect = calendarRef.current.getBoundingClientRect();
                const visibleCols = viewMode === 'resources' ? resources.length : 7;
                const cellWidth = (rect.width - 60) / visibleCols;
                const HEADER_HEIGHT = 50;

                let left = 60 + (endD + 1) * cellWidth + 20;
                if (left + 280 > rect.width) {
                    left = 60 + (endD * cellWidth) - 290;
                }
                const top = (dbEndH - 8) * 60 + HEADER_HEIGHT - 60;


                if (disableQuickAdd) {
                    onEventCreate(eventData);
                } else {
                    setPopoverPosition({ top, left });
                    setShowQuickAdd(true);
                }
            }
        }


        if ((draggingEvent || resizingEvent) && onEventUpdate) {
            const eventId = draggingEvent || resizingEvent?.id;
            const updatedEvent = events.find(e => e.id === eventId);

            if (updatedEvent && dragStartSnapshot) {
                const s = dragStartSnapshot;
                const u = updatedEvent;
                const hasChanged = u.startHour !== s.startHour || u.endHour !== s.endHour || u.day !== s.day;

                if (hasChanged) {
                    onEventUpdate(updatedEvent);
                }
            }
        }

        setDraggingEvent(null);
        setResizingEvent(null);
        setDragStartSnapshot(null);
        setIsSelecting(false);
    };

    const handleQuickCreateSubmit = async () => {
        if (!newEvent.title) return;
        await onEventCreate(newEvent);
        setShowQuickAdd(false);
    };


    const renderSelectionOverlay = () => {
        if (!isSelecting || !selectionStart || !selectionEnd) return null;

        const startD = Math.min(selectionStart.day, selectionEnd.day);
        const endD = Math.max(selectionStart.day, selectionEnd.day);
        const startH = Math.min(selectionStart.hour, selectionEnd.hour);
        const endH = Math.max(selectionStart.hour, selectionEnd.hour);

        const colCount = viewMode === 'resources' ? resources.length : 7;
        const overlays = [];

        for (let d = startD; d <= endD; d++) {
            const top = (startH - 8) * 60;
            const height = (endH - startH + 1) * 60;
            const left = `calc(60px + ${d} * ((100% - 60px) / ${colCount}))`;
            const width = `calc((100% - 60px) / ${colCount})`;

            overlays.push(
                <div
                    key={d}
                    className="absolute bg-primary-500/20 border-2 border-primary-500 rounded-md pointer-events-none z-10"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: left,
                        width: `calc(${width} - 4px)`,
                        marginLeft: '2px'
                    }}
                />
            );
        }

        return <>{overlays}</>;
    };

    return (
        <div
            ref={calendarRef}
            className="glass-card rounded-2xl overflow-hidden select-none relative bg-white shadow-sm ring-1 ring-black/5"
            style={{ minHeight: '600px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
        >

            <div className="flex border-b border-surface-200 bg-surface-50 grid-header h-[50px]">
                <div className="w-[60px] flex-shrink-0 border-r border-surface-200"></div>
                {viewMode === 'events' ? weekDates.map((date, i) => (
                    <div key={i} className="flex-1 text-center py-2 border-r border-surface-200 last:border-0 relative">
                        <span className="text-xs font-semibold text-surface-600 uppercase block">{DAYS[i]}</span>
                        <span className={`text-sm font-bold ${date.toDateString() === new Date().toDateString() ? 'text-primary-600' : 'text-surface-900'}`}>{date.getDate()}</span>
                    </div>
                )) : resources.map((res) => (
                    <div key={res.id} className="flex-1 text-center py-3 border-r border-surface-200 last:border-0 flex items-center justify-center gap-2">
                        <Server size={14} className="text-surface-400" />
                        <span className="text-sm font-semibold text-surface-700 truncate px-2">{res.name}</span>
                    </div>
                ))}
            </div>


            <div className="relative" style={{ height: `${HOURS.length * 60}px` }}>
                {HOURS.map((hour, i) => (
                    <div key={hour} className="absolute left-0 right-0 flex border-b border-surface-100" style={{ top: `${i * 60}px`, height: '60px' }}>
                        <div className="w-[60px] pr-2 pt-1 text-right flex-shrink-0 border-r border-surface-100 bg-surface-50/50">
                            <span className="text-xs text-surface-400">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</span>
                        </div>
                        {Array.from({ length: viewMode === 'resources' ? resources.length : 7 }).map((_, idx) => (
                            <div key={idx} className="flex-1 border-r border-surface-100 last:border-0 hover:bg-primary-50/30 transition-colors" />
                        ))}
                    </div>
                ))}


                {renderSelectionOverlay()}


                {events.map((event) => {
                    const top = (event.startHour - 8) * 60;
                    const height = (event.endHour - event.startHour) * 60;
                    const colCount = viewMode === 'resources' ? resources.length : 7;

                    const left = `calc(60px + ${event.day} * ((100% - 60px) / ${colCount}))`;

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`absolute rounded-md ${event.color} text-white p-1 text-xs overflow-hidden shadow-sm cursor-pointer z-20 hover:z-30 border border-white/20`}
                            style={{ top, height, left, width: `calc((100% - 60px) / ${colCount} - 4px)`, marginLeft: '2px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                if (onEventClick) onEventClick(event);
                            }}
                        >
                            <p className="font-semibold truncate">{event.title}</p>
                            <p className="opacity-80 text-[10px]">{event.startHour}:00 - {event.endHour}:00</p>
                        </motion.div>
                    );
                })}


                <AnimatePresence>
                    {showQuickAdd && popoverPosition && (
                        <motion.div
                            ref={quickAddRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute z-50 bg-white rounded-xl shadow-xl border border-surface-200 w-[280px] p-4 font-sans"
                            style={{ top: popoverPosition.top, left: popoverPosition.left }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-surface-900 mb-3 text-sm">
                                {viewMode === 'resources' ? 'Book Resource' : 'Quick Add Event'}
                            </h3>
                            <input
                                autoFocus
                                className="w-full mb-3 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="Event Title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateSubmit()}
                            />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowQuickAdd(false)} className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-lg">Cancel</button>
                                <button onClick={handleQuickCreateSubmit} className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm">
                                    {viewMode === 'resources' ? 'Book' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
