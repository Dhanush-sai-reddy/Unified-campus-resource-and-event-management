import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { motion } from 'framer-motion';
import { Calendar, Users, Building2, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, change, changeType = 'neutral', icon, color }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-surface-500">{title}</p>
                    <p className="text-3xl font-bold text-surface-900 mt-1">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 font-medium ${changeType === 'positive' ? 'text-green-600' :
                            changeType === 'negative' ? 'text-red-600' : 'text-surface-500'
                            }`}>
                            {change}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

interface QuickActionProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    to: string;
    color: string;
}

function QuickAction({ title, description, icon, to, color }: QuickActionProps) {
    return (
        <Link to={to} className="block">
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer group"
            >
                <div className={`p-3 rounded-xl ${color}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-surface-900">{title}</p>
                    <p className="text-sm text-surface-500">{description}</p>
                </div>
                <ArrowRight className="text-surface-400 group-hover:text-surface-600 group-hover:translate-x-1 transition-all" size={20} />
            </motion.div>
        </Link>
    );
}

interface ActivityItemProps {
    title: string;
    time: string;
    status: 'approved' | 'pending' | 'rejected';
}

function ActivityItem({ title, time, status }: ActivityItemProps) {
    const statusConfig = {
        approved: { icon: <CheckCircle size={16} />, color: 'text-green-600 bg-green-50' },
        pending: { icon: <Clock size={16} />, color: 'text-yellow-600 bg-yellow-50' },
        rejected: { icon: <AlertCircle size={16} />, color: 'text-red-600 bg-red-50' },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-4 py-3 border-b border-surface-100 last:border-0">
            <div className={`p-2 rounded-lg ${config.color}`}>
                {config.icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-surface-900">{title}</p>
                <p className="text-xs text-surface-500">{time}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${config.color}`}>
                {status}
            </span>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === UserRole.PARTICIPANT) {
            navigate('/events');
        }
    }, [user, navigate]);

    const isAdmin = user?.role === UserRole.ADMIN;
    const isOrganizer = user?.role === UserRole.ORGANIZER;

    return (
        <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8 bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-surface-900">
                            Welcome back, {user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-surface-600 mt-1">
                            {isAdmin
                                ? 'Manage your campus system and approve pending requests.'
                                : isOrganizer
                                    ? 'Organize events and manage your club activities.'
                                    : 'Discover events and connect with your campus community.'}
                        </p>
                    </div>
                    <Link
                        to={isOrganizer ? '/calendar' : '/events'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                    >
                        {isOrganizer ? 'Manage Calendar' : 'Browse Events'}
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={24}
                    change="+12% from last month"
                    changeType="positive"
                    icon={<Calendar className="text-primary-600" size={24} />}
                    color="bg-primary-50"
                />
                <StatCard
                    title="Active Clubs"
                    value={18}
                    change="+2 new clubs"
                    changeType="positive"
                    icon={<Users className="text-green-600" size={24} />}
                    color="bg-green-50"
                />
                <StatCard
                    title="Resources Booked"
                    value={156}
                    change="This week"
                    changeType="neutral"
                    icon={<Building2 className="text-orange-600" size={24} />}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Participation Rate"
                    value="89%"
                    change="+5% improvement"
                    changeType="positive"
                    icon={<TrendingUp className="text-purple-600" size={24} />}
                    color="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-display font-semibold text-surface-900">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <QuickAction
                            title="Book a Resource"
                            description="Reserve rooms and equipment"
                            icon={<Building2 className="text-primary-600" size={20} />}
                            to="/calendar?view=resources"
                            color="bg-primary-50"
                        />
                        <QuickAction
                            title="Browse Events"
                            description="Upcoming campus events"
                            icon={<Calendar className="text-green-600" size={20} />}
                            to="/events"
                            color="bg-green-50"
                        />
                        <QuickAction
                            title="Join a Club"
                            description="Explore campus communities"
                            icon={<Users className="text-orange-600" size={20} />}
                            to="/clubs"
                            color="bg-orange-50"
                        />
                        {isAdmin && (
                            <QuickAction
                                title="View Analytics"
                                description="Campus insights and reports"
                                icon={<TrendingUp className="text-purple-600" size={20} />}
                                to="/analytics"
                                color="bg-purple-50"
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-display font-semibold text-surface-900">Recent Activity</h2>
                    <div className="glass-card rounded-2xl p-5">
                        <ActivityItem
                            title="HackOverflow 2026 approved"
                            time="2 hours ago"
                            status="approved"
                        />
                        <ActivityItem
                            title="AI Workshop pending review"
                            time="5 hours ago"
                            status="pending"
                        />
                        <ActivityItem
                            title="Auditorium A booked"
                            time="1 day ago"
                            status="approved"
                        />
                        <ActivityItem
                            title="Music Fest needs revision"
                            time="2 days ago"
                            status="rejected"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
