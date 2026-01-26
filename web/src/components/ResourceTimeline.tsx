import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin } from 'lucide-react';
import { Resource, ResourceType, Booking } from '../types';

interface ResourceTimelineProps {
    resources: Resource[];
    bookings: Booking[];
    onBookClick?: (booking: Booking) => void;
}

const HOUR_WIDTH = 120; // pixels per hour
const ROW_HEIGHT = 60;
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

function getResourceIcon(type: ResourceType) {
    const colors: Record<ResourceType, string> = {
        ROOM: 'bg-indigo-100 text-indigo-600',
        HALL: 'bg-blue-100 text-blue-600',
        LAB: 'bg-purple-100 text-purple-600',
        EQUIPMENT: 'bg-orange-100 text-orange-600',
        VEHICLE: 'bg-green-100 text-green-600',
        OTHER: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || colors.OTHER;
}

function getBookingColor(status: string) {
    switch (status) {
        case 'APPROVED': return 'bg-green-500';
        case 'PENDING': return 'bg-yellow-500';
        case 'REJECTED': return 'bg-red-400';
        default: return 'bg-gray-400';
    }
}

export default function ResourceTimeline({ resources, bookings, onBookClick }: ResourceTimelineProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Get bookings for the selected date
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
        return bookingDate === dateStr;
    });

    // Navigate dates
    const goToDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);

    // Scroll to current time on load
    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date();
            const currentHour = now.getHours() - 7; // Offset from 7 AM
            scrollRef.current.scrollLeft = Math.max(0, currentHour * HOUR_WIDTH - 100);
        }
    }, []);

    // Calculate booking position
    const getBookingStyle = (booking: Booking) => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);

        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;

        const left = (startHour - 7) * HOUR_WIDTH;
        const width = (endHour - startHour) * HOUR_WIDTH;

        return {
            left: `${left}px`,
            width: `${Math.max(width, 30)}px`,
        };
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-indigo-50">
                <div className="flex items-center gap-4">
                    <Calendar className="text-primary-600" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Resource Schedule</h2>
                        <p className="text-sm text-surface-500">Drag to scroll through the timeline</p>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => goToDate(-1)}
                        className="p-2 rounded-lg hover:bg-white/70 text-surface-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-surface-200 min-w-[180px] text-center">
                        <span className="font-semibold text-surface-900">
                            {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <button
                        onClick={() => goToDate(1)}
                        className="p-2 rounded-lg hover:bg-white/70 text-surface-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex">
                {/* Resource Labels (Fixed) */}
                <div className="flex-shrink-0 w-48 border-r border-surface-200 bg-surface-50">
                    {/* Time header spacer */}
                    <div className="h-10 border-b border-surface-200 px-4 flex items-center">
                        <span className="text-xs font-medium text-surface-500 uppercase">Resources</span>
                    </div>

                    {/* Resource rows */}
                    {resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="flex items-center gap-3 px-4 border-b border-surface-100"
                            style={{ height: ROW_HEIGHT }}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getResourceIcon(resource.type)}`}>
                                <span className="text-xs font-bold">{resource.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-surface-900 truncate">{resource.name}</p>
                                <p className="text-xs text-surface-500">{resource.type}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scrollable Timeline */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-x-auto cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {/* Time Headers */}
                    <div className="flex h-10 border-b border-surface-200 bg-surface-50 sticky top-0">
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="flex-shrink-0 border-r border-surface-100 flex items-center justify-center"
                                style={{ width: HOUR_WIDTH }}
                            >
                                <span className="text-xs font-medium text-surface-600">
                                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Resource Rows with Bookings */}
                    {resources.map((resource) => {
                        const resourceBookings = dayBookings.filter(b => b.resourceId === resource.id);

                        return (
                            <div
                                key={resource.id}
                                className="relative border-b border-surface-100"
                                style={{ height: ROW_HEIGHT, width: HOURS.length * HOUR_WIDTH }}
                            >
                                {/* Hour grid lines */}
                                <div className="absolute inset-0 flex">
                                    {HOURS.map((hour) => (
                                        <div
                                            key={hour}
                                            className="flex-shrink-0 border-r border-surface-100"
                                            style={{ width: HOUR_WIDTH }}
                                        />
                                    ))}
                                </div>

                                {/* Current time indicator */}
                                {dateStr === new Date().toISOString().split('T')[0] && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                        style={{
                                            left: `${(new Date().getHours() - 7 + new Date().getMinutes() / 60) * HOUR_WIDTH}px`
                                        }}
                                    />
                                )}

                                {/* Booking Blocks */}
                                {resourceBookings.map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`absolute top-2 bottom-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${getBookingColor(booking.status)} text-white flex items-center px-3 overflow-hidden`}
                                        style={getBookingStyle(booking)}
                                        onClick={() => onBookClick?.(booking)}
                                        onMouseEnter={() => setHoveredBooking(booking)}
                                        onMouseLeave={() => setHoveredBooking(null)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold truncate">{booking.title}</p>
                                            {booking.user && (
                                                <p className="text-[10px] opacity-90 truncate">{booking.user.name}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredBooking && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-surface-200 p-4 z-50 min-w-[280px]"
                >
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-surface-900">{hoveredBooking.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hoveredBooking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                hoveredBooking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            {hoveredBooking.status}
                        </span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-surface-600">
                            <Clock size={14} />
                            <span>
                                {formatTime(new Date(hoveredBooking.startTime))} - {formatTime(new Date(hoveredBooking.endTime))}
                            </span>
                        </div>
                        {hoveredBooking.user && (
                            <div className="flex items-center gap-2 text-surface-600">
                                <User size={14} />
                                <span>{hoveredBooking.user.name}</span>
                            </div>
                        )}
                        {hoveredBooking.resource && (
                            <div className="flex items-center gap-2 text-surface-600">
                                <MapPin size={14} />
                                <span>{hoveredBooking.resource.name}</span>
                            </div>
                        )}
                        {hoveredBooking.purpose && (
                            <p className="text-surface-500 text-xs mt-2 pt-2 border-t border-surface-100">
                                {hoveredBooking.purpose}
                            </p>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Legend */}
            <div className="px-6 py-3 border-t border-surface-100 bg-surface-50 flex items-center gap-6">
                <span className="text-xs text-surface-500">Status:</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-surface-600">Approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-surface-600">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="text-xs text-surface-600">Rejected</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-red-500"></div>
                    <span className="text-xs text-surface-600">Current Time</span>
                </div>
            </div>
        </div>
    );
}
