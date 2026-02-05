import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Building, Calendar, Edit2, Camera, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Event } from '../types';

export default function Profile() {
    const { user } = useAuth();
    const [recentEvents, setRecentEvents] = useState<Event[]>([]);
    const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const [registered, organized] = await Promise.all([
                    api.getMyEvents(),
                    user?.role !== 'PARTICIPANT' ? api.getEvents({ organizerId: user?.id }) : Promise.resolve([])
                ]);
                setRecentEvents(registered);
                setOrganizedEvents(organized);
            } catch (error) {
                console.error(error);
            }
        };
        fetchEvents();
    }, [user]);

    const allActivity = [
        ...recentEvents.map(e => ({ type: 'Registered for', event: e, date: e.date })),
        ...organizedEvents.map(e => ({ type: 'Created', event: e, date: e.date }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stats = [
        { label: 'Events Attended', value: recentEvents.length, icon: <Calendar size={18} /> },
        { label: 'Events Organized', value: organizedEvents.length, icon: <Star size={18} /> },
         
         
    ];

    if (!user) return null;

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden"
            >
                { }
                <div className="h-32 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <div className="px-8 pb-8 relative">
                    <div className="absolute -top-16 left-8">
                        <div className="relative">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
                            />
                            <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg text-surface-600 hover:text-primary-600 transition-colors">
                                <Camera size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold text-surface-900">{user.name}</h1>
                            <div className="flex items-center gap-4 mt-2 text-surface-500">
                                <span className="flex items-center gap-1">
                                    <Mail size={14} />
                                    {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Building size={14} />
                                    {user.department}
                                </span>
                            </div>
                            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium capitalize">
                                {user.role.toLowerCase()}
                            </span>
                        </div>

                        <Link
                            to="/profile/edit"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors"
                        >
                            <Edit2 size={16} />
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </motion.div>

            <div className={`grid grid-cols-2 gap-4`}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card rounded-xl p-5 text-center"
                    >
                        <div className="w-10 h-10 mx-auto rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                            {stat.icon}
                        </div>
                        <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                        <p className="text-sm text-surface-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                { }

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-4 flex items-center gap-2">
                        <Calendar className="text-primary-600" size={20} />
                        Recent Activity
                    </h2>
                    <div className="space-y-1">
                        {allActivity.length > 0 ? allActivity.map((activity, i) => (
                            <div key={`${activity.event.id}-${i}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                                <div className={`w-2 h-2 rounded-full ${activity.type === 'Created' ? 'bg-purple-500' : 'bg-primary-500'}`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-surface-900">{activity.type} {activity.event.title}</p>
                                    <p className="text-xs text-surface-500">
                                        {new Date(activity.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-surface-500 text-sm">No recent activity.</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
