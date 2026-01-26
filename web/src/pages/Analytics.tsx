import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar, Building2, DollarSign, Download, Filter, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Initial empty states
const defaultStats = {
    totalEvents: 0,
    totalUsers: 0,
    totalResources: 0,
    pendingBookings: 0,
    // Add others as needed depending on backend response
};

interface StatCardProps {
    title: string;
    value: string | number;
    change: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
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
                    <p className="text-sm mt-2 font-medium text-green-600">{change}</p>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

export default function Analytics() {
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Data State
    const [stats, setStats] = useState<any>(defaultStats);
    const [eventTrends, setEventTrends] = useState<any[]>([]);
    const [resourceUtilization, setResourceUtilization] = useState<any[]>([]);
    const [clubActivity, setClubActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashStats, trends, resources, clubs] = await Promise.all([
                    api.getDashboardStats(),
                    api.getEventTrends(),
                    api.getResourceUtilization(),
                    api.getClubActivity()
                ]);

                setStats(dashStats);

                // Format Trends
                const trendData = Object.keys(trends).map(month => ({
                    month,
                    events: trends[month].events,
                    participants: trends[month].registrations
                })).sort((a, b) => a.month.localeCompare(b.month));
                setEventTrends(trendData);

                // Format Resources
                const resData = resources.map((r: any, i: number) => ({
                    name: r.name,
                    value: r.totalBookings,
                    color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                }));
                setResourceUtilization(resData);

                setClubActivity(clubs);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load analytics", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-surface-500">Loading analytics...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Analytics Dashboard</h1>
                    <p className="text-surface-500 mt-1">Campus insights and performance metrics</p>
                </div>
                <div className="flex gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors">
                        <Filter size={18} />
                        Filters
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                        >
                            <Download size={18} />
                            Export
                            <ChevronDown size={16} />
                        </button>

                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-100 overflow-hidden z-20 origin-top-right"
                                >
                                    <div className="p-1">
                                        <button onClick={() => { api.exportData('events'); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-green-600" />
                                            Export Events
                                        </button>
                                        <button onClick={() => { api.exportData('bookings'); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-blue-600" />
                                            Export Bookings
                                        </button>
                                        <button onClick={() => { api.exportData('users'); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-orange-600" />
                                            Export Users
                                        </button>
                                        <button onClick={() => { api.exportData('clubs'); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-purple-600" />
                                            Export Clubs
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={stats.totalEvents}
                    change="All time"
                    icon={<Calendar className="text-primary-600" size={24} />}
                    color="bg-primary-50"
                />
                <StatCard
                    title="Total Participants"
                    value={stats.totalUsers}
                    change="Registered Users"
                    icon={<Users className="text-green-600" size={24} />}
                    color="bg-green-50"
                />
                <StatCard
                    title="Total Resources"
                    value={stats.totalResources}
                    change={`${stats.pendingBookings} pending`}
                    icon={<Building2 className="text-orange-600" size={24} />}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Active Clubs"
                    value={stats.totalClubs}
                    change="Communities"
                    icon={<Users className="text-purple-600" size={24} />}
                    color="bg-purple-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events Over Time */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="text-primary-600" size={20} />
                        Events Over Time
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={eventTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Bar dataKey="events" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Participation Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        Participation Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={eventTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Resource Utilization */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-6 flex items-center gap-2">
                        <Building2 className="text-orange-600" size={20} />
                        Resource Utilization
                    </h2>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={resourceUtilization}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {resourceUtilization.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {resourceUtilization.map((item: any) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm text-surface-600">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Club Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h2 className="text-lg font-display font-semibold text-surface-900 mb-6 flex items-center gap-2">
                        <Users className="text-purple-600" size={20} />
                        Club Activity
                    </h2>
                    <div className="space-y-4">
                        {clubActivity.map((club: any) => (
                            <div key={club.name} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {club.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-surface-900">{club.name}</span>
                                        <span className="text-xs text-surface-500">{club.eventCount} events</span>
                                    </div>
                                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                                            style={{ width: `${Math.min(100, (club.eventCount / 10) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
