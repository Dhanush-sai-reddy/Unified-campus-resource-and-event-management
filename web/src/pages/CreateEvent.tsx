import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Resource, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import CalendarGrid from '../components/CalendarGrid';
import { ChevronLeft, Info, Calendar as CalendarIcon, Clock, Trash2, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DraftBooking {
    id: string;
    resourceId: string;
    resourceName: string;
    startHour: number;
    endHour: number;
    startDate: string;
    endDate: string;
}

export default function CreateEvent() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const [resourceBookings, setResourceBookings] = useState<Booking[]>([]);

    const [viewDate, setViewDate] = useState(new Date());

    const handlePrevWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(newDate.getDate() - 7);
        setViewDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(newDate.getDate() + 7);
        setViewDate(newDate);
    };


    const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);


    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventClub, setEventClub] = useState('');
    const [eventBudget, setEventBudget] = useState(0);
    const [eventParticipants, setEventParticipants] = useState(0);
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
        if (user && user.role === 'PARTICIPANT') {
            navigate('/calendar');
        }
    }, [user, navigate]);

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
        const resource = resources.find(r => r.id === selectedResourceId);
        if (!resource || !selectedResourceId) return;

        const newDraft: DraftBooking = {
            id: `draft-${Date.now()}-${Math.random()}`,
            resourceId: selectedResourceId,
            resourceName: resource.name,
            startHour: data.startHour,
            endHour: data.endHour,
            startDate: data.startDate,
            endDate: data.endDate
        };

        setDraftBookings(prev => [...prev, newDraft]);
    };

    const removeDraft = (id: string) => {
        setDraftBookings(prev => prev.filter(b => b.id !== id));
    };

    const handleConfirmCreate = async () => {
        if (isSubmitting) return;
        if (!eventTitle.trim()) {
            alert("Please enter an event title in the sidebar.");
            return;
        }
        if (draftBookings.length === 0) {
            alert("No slots selected. Please drag on the calendar to select slots.");
            return;
        }

        setIsSubmitting(true);
        try {

            const primary = draftBookings[0];
            const start = new Date(`${primary.startDate}T00:00:00`);
            start.setHours(primary.startHour, 0, 0, 0);

            const end = new Date(`${primary.endDate}T00:00:00`);
            end.setHours(primary.endHour, 0, 0, 0);

            const newEvent = await api.createEvent({
                title: eventTitle,
                description: eventDescription || `Event dealing with ${draftBookings.length} resources`,
                date: start.toISOString(),
                endDate: end.toISOString(),
                location: primary.resourceName,
                resourceId: primary.resourceId,
                budget: eventBudget,
                participants: eventParticipants,
                clubName: eventClub
            });

            const additionalDrafts = draftBookings.slice(1);

            await Promise.all(additionalDrafts.map(draft => {
                const [year, month, day] = draft.startDate.split('-').map(Number);

                const bStart = new Date(year, month - 1, day);
                bStart.setHours(draft.startHour, 0, 0, 0);

                const bEnd = new Date(year, month - 1, day);
                bEnd.setHours(draft.endHour, 0, 0, 0);

                return api.createBooking(draft.resourceId, {
                    title: eventTitle,
                    eventId: newEvent.id,
                    startTime: bStart.toISOString(),
                    endTime: bEnd.toISOString(),
                    purpose: eventDescription
                });
            }));

            navigate('/calendar');
        } catch (err: any) {
            console.error("Failed to create event", err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to create event.";
            alert(errorMessage);
            setIsSubmitting(false);
        }
    };

    const selectedResource = resources.find(r => r.id === selectedResourceId);


    const displayEvents = [
        ...resourceBookings.map(b => ({
            id: b.id,
            title: b.title,
            date: b.startTime,
            endDate: b.endTime,
            day: 0,
            endHour: 0,
            color: 'bg-slate-500',
            location: b.resource?.name || '',
            resourceId: b.resourceId
        })),
        ...draftBookings
            .filter(d => d.resourceId === selectedResourceId)
            .map(d => ({
                id: d.id,
                title: 'NEW',
                date: (() => {
                    const date = new Date(`${d.startDate}T00:00:00`);
                    date.setHours(d.startHour, 0, 0, 0);
                    return date.toISOString();
                })(),
                endDate: (() => {
                    const date = new Date(`${d.endDate}T00:00:00`);
                    date.setHours(d.endHour, 0, 0, 0);
                    return date.toISOString();
                })(),
                day: 0,
                endHour: 0,
                color: 'bg-primary-500',
                location: d.resourceName,
                resourceId: d.resourceId
            }))
    ];

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 max-w-[98vw] mx-auto relative overflow-hidden">

            <div className="flex items-center gap-4 flex-shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-surface-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Book Resource</h1>
                    <p className="text-surface-500 text-sm">Select one or more slots across different resources</p>
                </div>
            </div>


            <div className="flex-1 flex gap-6 overflow-hidden">


                <div className="flex-1 flex flex-col gap-4 overflow-hidden">

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

                                    {draftBookings.filter(d => d.resourceId === res.id).length > 0 && (
                                        <span className="mt-1 inline-block px-2 py-0.5 bg-primary-600 text-white text-[10px] rounded-full">
                                            {draftBookings.filter(d => d.resourceId === res.id).length} selected
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>


                    {selectedResourceId ? (
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-surface-900">Availability for {selectedResource?.name}</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrevWeek} className="p-1 hover:bg-surface-100 rounded-lg transition-colors text-surface-600">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-sm font-medium text-surface-700 min-w-[100px] text-center">
                                        {viewDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </span>
                                    <button onClick={handleNextWeek} className="p-1 hover:bg-surface-100 rounded-lg transition-colors text-surface-600">
                                        <ChevronLeft size={20} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <CalendarGrid
                                    key={selectedResourceId}
                                    viewMode="events"
                                    disableQuickAdd={true}
                                    currentDate={viewDate}
                                    events={displayEvents as any}
                                    bookings={[]}
                                    resources={[]}
                                    onEventCreate={async (data) => handleDragComplete(data as any)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-surface-400">
                            Select a resource to view availability
                        </div>
                    )}
                </div>


                <div className="w-96 flex-shrink-0 bg-white rounded-2xl shadow-lg border border-surface-200 flex flex-col overflow-hidden h-[95%] self-center">
                    <div className="p-5 border-b border-surface-100 bg-surface-50/50">
                        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                            <FileText size={20} className="text-primary-600" />
                            Event Details
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">


                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Event Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Project Sync"
                                value={eventTitle}
                                onChange={e => setEventTitle(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Organizing Club</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Robotics Club"
                                    value={eventClub}
                                    onChange={e => setEventClub(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Budget (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={eventBudget}
                                    onChange={e => setEventBudget(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1.5">Participants</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={eventParticipants}
                                    onChange={e => setEventParticipants(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description (Optional)</label>
                            <textarea
                                placeholder="Add details..."
                                rows={3}
                                value={eventDescription}
                                onChange={e => setEventDescription(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none transition-all"
                            />
                        </div>


                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-surface-700">Selected Slots</label>
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                                    {draftBookings.length}
                                </span>
                            </div>

                            {draftBookings.length === 0 ? (
                                <div className="p-8 text-center bg-surface-50 rounded-xl border border-dashed border-surface-200 text-surface-500 text-sm">
                                    Drag on the calendar to select time slots.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {draftBookings.map(draft => (
                                            <motion.div
                                                key={draft.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="bg-surface-50 p-3 rounded-xl border border-surface-100 group hover:border-surface-300 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm text-surface-900">{draft.resourceName}</span>
                                                    <button onClick={() => removeDraft(draft.id)} className="text-surface-400 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-surface-600">
                                                    <CalendarIcon size={12} />
                                                    <span>{new Date(draft.startDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-surface-600">
                                                    <Clock size={12} />
                                                    <span>{draft.startHour}:00 - {draft.endHour}:00</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-5 border-t border-surface-100 bg-surface-50">
                        <button
                            onClick={handleConfirmCreate}
                            disabled={isSubmitting || draftBookings.length === 0 || !eventTitle.trim()}
                            className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Confirm & Book
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
