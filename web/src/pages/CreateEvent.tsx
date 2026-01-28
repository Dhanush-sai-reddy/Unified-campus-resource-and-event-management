import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Resource, Booking } from '../types';
import CalendarGrid, { CalendarEvent } from '../components/CalendarGrid';
import { ChevronLeft, Info, Clock, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const [resourceBookings, setResourceBookings] = useState<Booking[]>([]);

    const [viewDate] = useState(new Date());

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [draftEvent, setDraftEvent] = useState<{
        startHour: number;
        endHour: number;
        startDate: string;
        endDate: string;
    } | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await api.getResources();
                setResources(res);
                if (res.length > 0) {
                    setSelectedResourceId(res[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch resources", err);
            }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        if (!selectedResourceId) return;
        const fetchBookings = async () => {
            try {
                const bookings = await api.getBookings({ resourceId: selectedResourceId });
                setResourceBookings(bookings);
            } catch (err) {
                console.error("Failed to fetch bookings", err);
            }
        };
        fetchBookings();
    }, [selectedResourceId]);

    const handleDragComplete = (data: { startHour: number, endHour: number, day: number, startDate: string, endDate: string }) => {
        setDraftEvent({
            startHour: data.startHour,
            endHour: data.endHour,
            startDate: data.startDate,
            endDate: data.endDate
        });
        setEventTitle(''); // Reset title
        setShowModal(true);
    };

    const handleConfirmCreate = async () => {
        if (isSubmitting) return; // Prevent double submission
        if (!eventTitle.trim()) {
            alert("Please enter an event title.");
            return;
        }
        if (!selectedResourceId || !draftEvent) return;

        setIsSubmitting(true);
        try {
            // Parse as local time to avoid UTC shifts
            const start = new Date(`${draftEvent.startDate}T00:00:00`);
            start.setHours(draftEvent.startHour, 0, 0, 0);

            const end = new Date(`${draftEvent.endDate}T00:00:00`);
            end.setHours(draftEvent.endHour, 0, 0, 0);

            await api.createEvent({
                title: eventTitle,
                description: `Event at ${resources.find(r => r.id === selectedResourceId)?.name}`,
                date: start.toISOString(),
                endDate: end.toISOString(),
                location: resources.find(r => r.id === selectedResourceId)?.name || '',
                resourceId: selectedResourceId
            });

            navigate('/calendar');
        } catch (err) {
            console.error("Failed to create event", err);
            alert("Failed to create event. There might be a conflict.");
            setIsSubmitting(false);
        }
    };

    const selectedResource = resources.find(r => r.id === selectedResourceId);

    return (
        <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-surface-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-surface-900">Book Resource</h1>
                    <p className="text-surface-500 text-sm">Select a resource and drag on the calendar to book</p>
                </div>
            </div>

            {/* Resource Selector */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-surface-200">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {resources.map(res => (
                        <button
                            key={res.id}
                            onClick={() => setSelectedResourceId(res.id)}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all text-left min-w-[160px] ${selectedResourceId === res.id
                                ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500'
                                : 'bg-surface-50 border-surface-200 hover:bg-surface-100'
                                }`}
                        >
                            <p className={`font-semibold ${selectedResourceId === res.id ? 'text-primary-900' : 'text-surface-900'}`}>
                                {res.name}
                            </p>
                            <p className="text-xs text-surface-500 mt-1 capitalize">{res.type?.toLowerCase() || 'resource'}</p>
                        </button>
                    ))}
                </div>
                {selectedResource && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-surface-500 bg-surface-50 p-2 rounded-lg inline-flex">
                        <Info size={16} />
                        <span>Capacity: {selectedResource.capacity || 'N/A'} • {selectedResource.location || 'No location info'}</span>
                    </div>
                )}
            </div>

            {/* Calendar Grid for Selection */}
            {selectedResourceId && (
                <div className="flex-1 min-h-[500px]">
                    <h3 className="text-lg font-semibold text-surface-900 mb-3">Availability for {selectedResource?.name}</h3>

                    <CalendarGrid
                        viewMode="events"
                        disableQuickAdd={true}
                        currentDate={viewDate}
                        events={resourceBookings.map(b => ({
                            id: b.id,
                            title: b.title,
                            // Map booking start/end to Grid format
                            date: b.startTime,
                            endDate: b.endTime,
                            day: 0,
                            endHour: 0,
                            color: 'bg-slate-500',
                            location: b.resource?.name || '',
                            isMultiDay: false,
                            status: b.status as any,
                            budget: 0,
                            organizerId: b.userId,
                            participants: 0,
                            organizerName: b.user?.name || '',
                            clubName: '',
                            resourceId: b.resourceId
                        })) as any}
                        bookings={[]}
                        resources={[]}
                        onEventCreate={async (data) => {
                            handleDragComplete(data as any);
                        }}
                    />
                </div>
            )}

            {/* Creation Modal */}
            <AnimatePresence>
                {showModal && draftEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-100"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                                <h3 className="text-lg font-bold text-surface-900">New Event Details</h3>
                                <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        placeholder="e.g. Team Meeting"
                                        className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                                    />
                                </div>

                                <div className="bg-surface-50 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-surface-600">
                                        <CalendarIcon size={16} className="text-primary-500" />
                                        <span className="font-medium text-surface-900">
                                            {new Date(draftEvent.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-surface-600">
                                        <Clock size={16} className="text-primary-500" />
                                        <span className="font-medium text-surface-900">
                                            {draftEvent.startHour}:00 - {draftEvent.endHour}:00
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-surface-600">
                                        <Info size={16} className="text-primary-500" />
                                        <span>{selectedResource?.name}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmCreate}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-70 flex justify-center"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Booking'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
