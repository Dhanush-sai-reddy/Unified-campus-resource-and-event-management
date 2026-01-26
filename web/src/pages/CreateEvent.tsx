import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, FileText, DollarSign, Users, ArrowLeft, ArrowRight, Save, Send, Building2, Check, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Resource } from '../types';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState<Resource[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        endDate: '',
        location: '',
        resourceId: '',
        budget: '',
        expectedParticipants: '',
        isMultiDay: false,
        collaboratingClubs: [] as string[],
    });

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await api.getResources();
                setResources(data);
            } catch (error) {
                console.error("Failed to load resources");
            }
        };
        fetchResources();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleResourceSelect = (resource: Resource) => {
        const isSelected = formData.resourceId === resource.id;
        setFormData({
            ...formData,
            resourceId: isSelected ? '' : resource.id,
            location: isSelected ? '' : resource.name,
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const event = await api.createEvent({
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date).toISOString(),
                endDate: formData.isMultiDay && formData.endDate ? new Date(formData.endDate).toISOString() : new Date(formData.date).toISOString(),
                location: formData.location,
                budget: parseFloat(formData.budget) || 0,
                // @ts-ignore
                isMultiDay: formData.isMultiDay,
            });

            if (formData.resourceId) {
                const startTime = new Date(formData.date);
                const endTime = formData.isMultiDay && formData.endDate
                    ? new Date(formData.endDate)
                    : new Date(new Date(formData.date).setHours(new Date(formData.date).getHours() + 2));

                await api.createBooking(formData.resourceId, {
                    title: `Event: ${event.title}`,
                    purpose: "Event Reservation",
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    eventId: event.id
                });
            }

            setLoading(false);
            navigate('/events');
        } catch (error) {
            console.error(error);
            alert("Failed to create event. Please try again.");
            setLoading(false);
        }
    };

    const clubs = [
        { id: 'c1', name: 'Coding Club' },
        { id: 'c2', name: 'AI Society' },
        { id: 'c3', name: 'Cultural Club' },
        { id: 'c4', name: 'Sports Committee' },
        { id: 'c5', name: 'Entrepreneurship Cell' },
    ];

    const steps = [
        { id: 1, title: 'Details', icon: FileText },
        { id: 2, title: 'Logistics', icon: Calendar },
        { id: 3, title: 'Scope', icon: Users },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/events')}
                className="group flex items-center gap-2 text-surface-500 hover:text-surface-900 mb-8 transition-colors"
                disabled={loading}
            >
                <div className="p-2 rounded-full bg-white border border-surface-200 group-hover:bg-surface-50 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                <span className="font-medium">Back to Events</span>
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side - Progress & Info */}
                <div className="lg:w-1/3">
                    <div className="glass-card p-6 sticky top-8">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles size={24} />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-surface-900 leading-tight">Create Exquisite Experience</h1>
                            <p className="text-surface-500 mt-2 text-sm leading-relaxed">
                                Craft your event details carefully. A great event starts with a great plan.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {steps.map((s, idx) => (
                                <div key={s.id} className="relative">
                                    {idx !== steps.length - 1 && (
                                        <div className={`absolute left-5 top-10 bottom-0 w-0.5 ml-px h-8 ${step > s.id ? 'bg-primary-500' : 'bg-surface-200'}`} />
                                    )}
                                    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${step === s.id ? 'bg-primary-50 border border-primary-100' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${step >= s.id
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/20'
                                            : 'bg-white border-surface-200 text-surface-400'
                                            }`}>
                                            <s.icon size={18} />
                                        </div>
                                        <div>
                                            <p className={`font-semibold text-sm ${step >= s.id ? 'text-surface-900' : 'text-surface-400'}`}>
                                                {s.title}
                                            </p>
                                            {step === s.id && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-xs text-primary-600 font-medium"
                                                >
                                                    In Progress
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-2/3">
                    <div className="glass-card p-8 min-h-[500px] flex flex-col relative overflow-hidden">
                        {/* Decorative background blobs */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 relative z-10"
                            >
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-surface-900">Event Essentials</h2>
                                            <p className="text-sm text-surface-500">Let's start with the core details of your event.</p>
                                        </div>

                                        <div className="group">
                                            <label className="block text-sm font-semibold text-surface-700 mb-2 ml-1">Event Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="e.g. HackOverflow 2026"
                                                className="w-full px-5 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-medium placeholder:text-surface-400"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-surface-700 mb-2 ml-1">Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                placeholder="What is this event about? Share the excitement..."
                                                className="w-full px-5 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none resize-none placeholder:text-surface-400"
                                            />
                                        </div>

                                        <label className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200 cursor-pointer hover:border-primary-200 transition-colors">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="isMultiDay"
                                                    checked={formData.isMultiDay}
                                                    onChange={handleChange}
                                                    className="peer sr-only"
                                                />
                                                <div className="w-11 h-6 bg-surface-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-surface-900 block">Multi-day Event</span>
                                                <span className="text-sm text-surface-500">This event spans across multiple days</span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-surface-900">Time & Venue</h2>
                                            <p className="text-sm text-surface-500">When and where will the magic happen?</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-surface-700 ml-1">Start Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
                                                    <input
                                                        type="datetime-local"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleChange}
                                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            {formData.isMultiDay && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700 ml-1">End Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
                                                        <input
                                                            type="datetime-local"
                                                            name="endDate"
                                                            value={formData.endDate}
                                                            onChange={handleChange}
                                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-semibold text-surface-700 ml-1">Choose a Venue</label>
                                                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">Recommended</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                                                {resources.map(resource => (
                                                    <div
                                                        key={resource.id}
                                                        onClick={() => handleResourceSelect(resource)}
                                                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${formData.resourceId === resource.id
                                                                ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                                                                : 'border-surface-100 hover:border-surface-300 hover:bg-surface-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className={`p-2 rounded-xl ${formData.resourceId === resource.id ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500 group-hover:bg-white'}`}>
                                                                <Building2 size={18} />
                                                            </div>
                                                            {formData.resourceId === resource.id && (
                                                                <div className="bg-primary-500 text-white p-1 rounded-full">
                                                                    <Check size={12} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="font-semibold text-surface-900 text-sm">{resource.name}</p>
                                                        <p className="text-xs text-surface-500 mt-1 line-clamp-1">{resource.description || resource.type}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative pt-2">
                                                <div className="absolute inset-x-0 w-full top-1/2 h-px bg-surface-200" />
                                                <span className="relative z-10 bg-white px-2 text-xs font-medium text-surface-400 left-1/2 -translate-x-1/2 uppercase tracking-wide">Or specify manually</span>
                                            </div>

                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    placeholder="Enter custom location..."
                                                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border focus:ring-4 focus:ring-primary-500/10 transition-all outline-none ${!formData.resourceId && formData.location
                                                            ? 'bg-white border-primary-500 ring-4 ring-primary-500/10'
                                                            : 'bg-surface-50 border-transparent focus:bg-white focus:border-primary-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-surface-900">Final Touches</h2>
                                            <p className="text-sm text-surface-500">Define the scope and resources needed.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-surface-700 ml-1">Est. Budget</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
                                                    <input
                                                        type="number"
                                                        name="budget"
                                                        value={formData.budget}
                                                        onChange={handleChange}
                                                        placeholder="5000"
                                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-surface-700 ml-1">Headcount</label>
                                                <div className="relative">
                                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
                                                    <input
                                                        type="number"
                                                        name="expectedParticipants"
                                                        value={formData.expectedParticipants}
                                                        onChange={handleChange}
                                                        placeholder="100"
                                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-surface-700 ml-1">Collaborating Clubs</label>
                                            <div className="flex flex-wrap gap-2">
                                                {clubs.map((club) => {
                                                    const isSelected = formData.collaboratingClubs.includes(club.id);
                                                    return (
                                                        <button
                                                            key={club.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const newClubs = isSelected
                                                                    ? formData.collaboratingClubs.filter(c => c !== club.id)
                                                                    : [...formData.collaboratingClubs, club.id];
                                                                setFormData({ ...formData, collaboratingClubs: newClubs });
                                                            }}
                                                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${isSelected
                                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/25'
                                                                    : 'bg-surface-50 text-surface-600 border-surface-200 hover:bg-white hover:border-surface-300'
                                                                }`}
                                                        >
                                                            {club.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-surface-100 z-20">
                            <button
                                type="button"
                                onClick={() => setStep(s => Math.max(1, s - 1))}
                                disabled={step === 1 || loading}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${step === 1
                                        ? 'opacity-0 pointer-events-none'
                                        : 'text-surface-600 hover:bg-surface-100'
                                    }`}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>

                            <div className="flex items-center gap-3">
                                {step === 3 && (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="hidden sm:flex items-center gap-2 px-6 py-3 text-surface-700 font-semibold hover:bg-surface-100 rounded-xl transition-colors"
                                    >
                                        <Save size={18} />
                                        Save Draft
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : step < 3 ? (
                                        <>
                                            Next Step
                                            <ArrowRight size={18} />
                                        </>
                                    ) : (
                                        <>
                                            Publish Event
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
