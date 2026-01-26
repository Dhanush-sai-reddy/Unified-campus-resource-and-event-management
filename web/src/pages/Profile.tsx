import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Building, Calendar, Users, Edit2, Camera, Trophy, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { user } = useAuth();

    const memberships = [
        { name: 'Coding Club', role: 'Member', since: 'Aug 2024' },
        { name: 'AI Society', role: 'Core Team', since: 'Jan 2025' },
        { name: 'Tech Committee', role: 'Lead', since: 'Jun 2025' },
    ];

    const stats = [
        { label: 'Events Attended', value: 12, icon: <Calendar size={18} /> },
        { label: 'Events Organized', value: 3, icon: <Star size={18} /> },
        { label: 'Club Memberships', value: 3, icon: <Users size={18} /> },
        { label: 'Achievements', value: 5, icon: <Trophy size={18} /> },
    ];

    const recentActivity = [
        { action: 'Attended AI Workshop', date: 'Jan 20, 2026' },
        { action: 'Joined AI Society', date: 'Jan 15, 2026' },
        { action: 'Booked Auditorium A', date: 'Jan 10, 2026' },
        { action: 'Registered for HackOverflow', date: 'Jan 5, 2026' },
    ];

    if (!user) return null;

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden"
            >
                {/* Cover */}
                <div className="h-32 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <div className="px-8 pb-8 relative">
                    {/* Avatar */}
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

                    {/* Info */}
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Club Memberships */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-4 flex items-center gap-2">
                        <Users className="text-primary-600" size={20} />
                        Club Memberships
                    </h2>
                    <div className="space-y-4">
                        {memberships.map((club) => (
                            <div key={club.name} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                        {club.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-surface-900">{club.name}</p>
                                        <p className="text-sm text-surface-500">{club.role} • Since {club.since}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${club.role === 'Lead'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : club.role === 'Core Team'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-surface-200 text-surface-600'
                                    }`}>
                                    {club.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Activity */}
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
                        {recentActivity.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-surface-900">{item.action}</p>
                                    <p className="text-xs text-surface-500">{item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
