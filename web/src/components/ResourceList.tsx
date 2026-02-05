import { useState, useEffect } from 'react';
import { Resource, ResourceType, User } from '../types';
import { api } from '../services/api';
import { Monitor, Square, MapPin, Search, Filter, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResourceListProps {
  currentUser: User;
}

const ResourceList: React.FC<ResourceListProps> = ({ currentUser }) => {
  const [resources, setResources] = useState<Resource[]>([]);
   
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eventName, setEventName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchData = async () => {
    setLoading(true);
     
    await new Promise(resolve => setTimeout(resolve, 800));
    const [resData] = await Promise.all([api.getResources(), api.getBookings()]);
    setResources(resData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookClick = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
    setError(null);
     
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setStartTime(now.toISOString().slice(0, 16));

    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setEndTime(oneHourLater.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    try {
      await api.createBooking({
        resourceId: selectedResource.id,
        userId: currentUser.id,
        userName: currentUser.name,
        eventName,
        startTime,
        endTime,
      });
      setIsModalOpen(false);
      setEventName('');
      setStartTime('');
      setEndTime('');
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to book resource");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900">Available Resources</h2>
          <p className="text-surface-500 mt-1">Book rooms and equipment for your events.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <button className="p-2 rounded-xl border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin"></div>
          </div>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
        >
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              variants={item}
              className="group glass-card rounded-2xl p-6 flex flex-col h-full hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${resource.type === ResourceType.ROOM ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                  {resource.type === ResourceType.ROOM ? <Square size={24} /> : <Monitor size={24} />}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${resource.isAvailable
                  ? 'bg-green-50 text-green-700 border border-green-200/50'
                  : 'bg-surface-100 text-surface-600 border border-surface-200'
                  }`}>
                  {resource.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-surface-900 mb-1">{resource.name}</h3>
                <div className="flex items-center text-surface-500 text-sm">
                  <MapPin size={14} className="mr-1" />
                  <span>Main Building &bull; Cap: {resource.capacity || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-surface-100">
                <div className="flex items-center mb-4">
                  <div className="flex -space-x-2 overflow-hidden">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-surface-200" />
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-surface-500">+12 bookings this week</span>
                </div>

                <button
                  onClick={() => handleBookClick(resource)}
                  disabled={!resource.isAvailable}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all shadow-sm focus:ring-4 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed
                    bg-surface-900 text-white hover:bg-surface-800 disabled:bg-surface-200 disabled:text-surface-400"
                >
                  {resource.isAvailable ? 'Book Now' : 'Unavailable'}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-100"
            >
              <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                <h3 className="text-lg font-bold text-surface-900">
                  Book {selectedResource.name}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors p-1 rounded-lg hover:bg-surface-100">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                    placeholder="What's this booking for?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">Start Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-2">End Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                      <input
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 focus:outline-none focus:ring-4 focus:ring-surface-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 shadow-lg shadow-primary-500/30 transition-all"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceList;
