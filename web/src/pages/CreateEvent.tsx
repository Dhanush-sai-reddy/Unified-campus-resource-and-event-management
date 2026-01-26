import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, FileText, DollarSign, Users, ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        endDate: '',
        location: '',
        budget: '',
        expectedParticipants: '',
        isMultiDay: false,
        collaboratingClubs: [] as string[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        navigate('/events');
    };

    const clubs = [
        { id: 'c1', name: 'Coding Club' },
        { id: 'c2', name: 'AI Society' },
        { id: 'c3', name: 'Cultural Club' },
        { id: 'c4', name: 'Sports Committee' },
        { id: 'c5', name: 'Entrepreneurship Cell' },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back button */}
            <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-2 text-surface-500 hover:text-surface-700 mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Events
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-display font-bold text-surface-900">Create New Event</h1>
                <p className="text-surface-500 mt-1">Fill in the details to create and submit your event for approval</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${step >= s
                                ? 'bg-primary-600 text-white'
                                : 'bg-surface-100 text-surface-500'
                                }`}
                        >
                            {s}
                        </div>
                        {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-surface-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Form */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-2xl p-8"
            >
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                            <FileText className="text-primary-600" size={20} />
                            Basic Information
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Event Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., HackOverflow 2026"
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Describe your event..."
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isMultiDay"
                                name="isMultiDay"
                                checked={formData.isMultiDay}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="isMultiDay" className="text-sm text-surface-700">This is a multi-day event</label>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                            <Calendar className="text-primary-600" size={20} />
                            Date & Location
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            {formData.isMultiDay && (
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-2">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Auditorium A, Main Building"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                            <DollarSign className="text-primary-600" size={20} />
                            Budget & Collaboration
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">Estimated Budget (₹)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        placeholder="5000"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">Expected Participants</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                                    <input
                                        type="number"
                                        name="expectedParticipants"
                                        value={formData.expectedParticipants}
                                        onChange={handleChange}
                                        placeholder="100"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">Collaborating Clubs (Optional)</label>
                            <div className="flex flex-wrap gap-2">
                                {clubs.map((club) => (
                                    <button
                                        key={club.id}
                                        type="button"
                                        onClick={() => {
                                            const newClubs = formData.collaboratingClubs.includes(club.id)
                                                ? formData.collaboratingClubs.filter(c => c !== club.id)
                                                : [...formData.collaboratingClubs, club.id];
                                            setFormData({ ...formData, collaboratingClubs: newClubs });
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formData.collaboratingClubs.includes(club.id)
                                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                            : 'bg-surface-100 text-surface-600 border-2 border-transparent hover:bg-surface-200'
                                            }`}
                                    >
                                        {club.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-surface-100">
                    <button
                        type="button"
                        onClick={() => step > 1 ? setStep(step - 1) : navigate('/events')}
                        className="flex items-center gap-2 px-5 py-2.5 text-surface-600 bg-surface-100 rounded-xl font-medium hover:bg-surface-200 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        {step > 1 ? 'Back' : 'Cancel'}
                    </button>

                    <div className="flex gap-3">
                        {step === 3 && (
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 text-surface-700 bg-surface-100 rounded-xl font-medium hover:bg-surface-200 transition-colors"
                            >
                                <Save size={18} />
                                Save as Draft
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : step < 3 ? (
                                <>
                                    Continue
                                    <ArrowRight size={18} />
                                </>
                            ) : (
                                <>
                                    Submit for Approval
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
