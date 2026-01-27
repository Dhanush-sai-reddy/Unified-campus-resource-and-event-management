import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Vibrant color palette for drag selection
const COLORS = [
    { bg: 'bg-violet-500', light: 'bg-violet-500/20', border: 'border-violet-500' },
    { bg: 'bg-blue-500', light: 'bg-blue-500/20', border: 'border-blue-500' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-500/20', border: 'border-emerald-500' },
    { bg: 'bg-amber-500', light: 'bg-amber-500/20', border: 'border-amber-500' },
    { bg: 'bg-rose-500', light: 'bg-rose-500/20', border: 'border-rose-500' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-500/20', border: 'border-cyan-500' },
];

export default function CreateEvent() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    // Drag selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ day: number; hour: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ day: number; hour: number } | null>(null);

    // Popover state
    const [showPopover, setShowPopover] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const [eventData, setEventData] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(false);

    const calendarRef = useRef<HTMLDivElement>(null);

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

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

    // Get grid coordinates from mouse position
    const getGridCoordinates = (e: React.MouseEvent) => {
        if (!calendarRef.current) return null;
        const rect = calendarRef.current.getBoundingClientRect();
        const gridTop = rect.top + 48;
        const cellHeight = (rect.height - 48) / HOURS.length;
        const cellWidth = (rect.width - 60) / 7;

        const relativeY = e.clientY - gridTop;
        const relativeX = e.clientX - rect.left - 60;

        const hour = Math.max(8, Math.min(21, Math.floor(relativeY / cellHeight) + 8));
        const day = Math.max(0, Math.min(6, Math.floor(relativeX / cellWidth)));

        return { day, hour };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.grid-header') || (e.target as HTMLElement).closest('.event-popover')) return;

        if (showPopover) {
            setShowPopover(false);
            setSelectionStart(null);
            setSelectionEnd(null);
            return;
        }

        const coords = getGridCoordinates(e);
        if (coords) {
            // Pick a random color for this selection
            setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
            setIsSelecting(true);
            setSelectionStart(coords);
            setSelectionEnd(coords);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || !selectionStart) return;
        const coords = getGridCoordinates(e);
        if (coords) {
            // Keep same day for simplicity
            setSelectionEnd({ day: selectionStart.day, hour: coords.hour });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isSelecting && selectionStart && selectionEnd) {
            const startH = Math.min(selectionStart.hour, selectionEnd.hour);
            const endH = Math.max(selectionStart.hour, selectionEnd.hour) + 1;

            // Calculate popover position
            if (calendarRef.current) {
                const rect = calendarRef.current.getBoundingClientRect();
                const cellWidth = (rect.width - 60) / 7;

                let left = 60 + (selectionStart.day + 1) * cellWidth + 10;
                if (selectionStart.day >= 5) {
                    left = 60 + selectionStart.day * cellWidth - 310;
                }

                const top = (startH - 8) * 60 + 60;

                setPopoverPosition({ top, left });
                setShowPopover(true);
                setEventData({ title: '', description: '' });
            }
        }

        setIsSelecting(false);
    };

    const handleCreate = async () => {
        if (!eventData.title.trim() || !selectionStart || !selectionEnd) return;

        setLoading(true);
        try {
            const startH = Math.min(selectionStart.hour, selectionEnd.hour);
            const endH = Math.max(selectionStart.hour, selectionEnd.hour) + 1;

            const startDate = new Date(weekDates[selectionStart.day]);
            startDate.setHours(startH, 0, 0, 0);

            const endDate = new Date(weekDates[selectionStart.day]);
            endDate.setHours(endH, 0, 0, 0);

            await api.createEvent({
                title: eventData.title,
                description: eventData.description,
                date: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: '',
                budget: 0,
            });

            navigate('/events');
        } catch (error) {
            console.error('Failed to create event', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const getSelectionStyle = () => {
        if (!selectionStart || !selectionEnd) return {};

        const startH = Math.min(selectionStart.hour, selectionEnd.hour);
        const endH = Math.max(selectionStart.hour, selectionEnd.hour);

        return {
            top: `${(startH - 8) * 60}px`,
            height: `${(endH - startH + 1) * 60}px`,
            left: `${60 + (selectionStart.day * ((100 - 4.5) / 7))}%`,
            width: `${(100 - 4.5) / 7 - 0.5}%`,
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/30">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/events')}
                                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"
                            >
                                <ArrowLeft size={20} className="text-surface-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-surface-900">Create Event</h1>
                                <p className="text-sm text-surface-500">Drag on the calendar to select time</p>
                            </div>
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
                                <span className="px-4 py-2 text-sm font-medium text-surface-700 min-w-[180px] text-center">
                                    {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                                </span>
                                <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-surface-50 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div
                    ref={calendarRef}
                    className="bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden select-none relative"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
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
                                        className="flex-1 border-l border-surface-100 hover:bg-primary-50/30 transition-colors cursor-crosshair"
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Drag selection overlay - COLOR SPRAY */}
                        {(isSelecting || showPopover) && selectionStart && selectionEnd && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`absolute ${selectedColor.light} border-2 ${selectedColor.border} rounded-xl pointer-events-none z-10`}
                                style={getSelectionStyle()}
                            >
                                <div className={`absolute inset-x-0 top-0 h-1 ${selectedColor.bg} rounded-t-lg`} />
                                <div className="p-2 text-xs font-medium text-surface-700">
                                    {Math.min(selectionStart.hour, selectionEnd.hour) > 12 ? Math.min(selectionStart.hour, selectionEnd.hour) - 12 : Math.min(selectionStart.hour, selectionEnd.hour)}:00
                                    {' - '}
                                    {(Math.max(selectionStart.hour, selectionEnd.hour) + 1) > 12 ? (Math.max(selectionStart.hour, selectionEnd.hour) + 1) - 12 : (Math.max(selectionStart.hour, selectionEnd.hour) + 1)}:00
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Simple Event Popover */}
                    <AnimatePresence>
                        {showPopover && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute z-50 w-[300px] event-popover"
                                style={{ top: popoverPosition.top, left: popoverPosition.left }}
                            >
                                <div className="bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden">
                                    {/* Color bar top */}
                                    <div className={`h-2 ${selectedColor.bg}`} />

                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                                {weekDates[selectionStart?.day || 0]?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setShowPopover(false);
                                                    setSelectionStart(null);
                                                    setSelectionEnd(null);
                                                }}
                                                className="p-1 rounded-lg hover:bg-surface-100 transition-colors"
                                            >
                                                <X size={16} className="text-surface-400" />
                                            </button>
                                        </div>

                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Event name"
                                            value={eventData.title}
                                            onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                            className="w-full text-lg font-semibold text-surface-900 placeholder:text-surface-300 border-0 border-b-2 border-surface-200 focus:border-primary-500 outline-none pb-2 mb-3 bg-transparent"
                                        />

                                        <textarea
                                            placeholder="Add description (optional)"
                                            value={eventData.description}
                                            onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                            rows={2}
                                            className="w-full text-sm text-surface-600 placeholder:text-surface-400 border border-surface-200 rounded-xl p-3 outline-none focus:border-primary-400 resize-none mb-4"
                                        />

                                        <button
                                            onClick={handleCreate}
                                            disabled={!eventData.title.trim() || loading}
                                            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${selectedColor.bg} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                            ) : (
                                                'Create Event'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hint */}
                <div className="mt-4 text-center text-sm text-surface-500">
                    Click and drag on the calendar to select a time slot
                </div>
            </div>
        </div>
    );
}
