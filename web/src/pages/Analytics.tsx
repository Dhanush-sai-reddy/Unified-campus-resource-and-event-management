import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar, Building2, DollarSign, Download, Filter, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';
import { exportEventsCSV, exportUsersCSV, exportBookingsCSV, exportClubsCSV } from '../services/mockService';

const eventData = [
    { month: 'Sep', events: 12 },
    { month: 'Oct', events: 19 },
    { month: 'Nov', events: 15 },
    { month: 'Dec', events: 8 },
    { month: 'Jan', events: 24 },
];

const participationData = [
    { month: 'Sep', participants: 450 },
    { month: 'Oct', participants: 680 },
    { month: 'Nov', participants: 590 },
    { month: 'Dec', participants: 320 },
    { month: 'Jan', participants: 890 },
];

const resourceData = [
    { name: 'Auditorium A', value: 35, color: '#6366f1' },
    { name: 'Lecture Halls', value: 28, color: '#10b981' },
    { name: 'Labs', value: 20, color: '#f59e0b' },
    { name: 'Equipment', value: 17, color: '#ef4444' },
];

const clubActivityData = [
    { name: 'Coding Club', events: 8, members: 156 },
    { name: 'Cultural Club', events: 12, members: 234 },
    { name: 'Sports', events: 15, members: 312 },
    { name: 'AI Society', events: 5, members: 89 },
    { name: 'E-Cell', events: 3, members: 67 },
];

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
                                        <button onClick={() => { exportEventsCSV(); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-green-600" />
                                            Export Events
                                        </button>
                                        <button onClick={() => { exportBookingsCSV(); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-blue-600" />
                                            Export Bookings
                                        </button>
                                        <button onClick={() => { exportUsersCSV(); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
                                            <FileSpreadsheet size={16} className="text-orange-600" />
                                            Export Users
                                        </button>
                                        <button onClick={() => { exportClubsCSV(); setShowExportMenu(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 rounded-lg transition-colors">
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
                    value={78}
                    change="+23% vs last semester"
                    icon={<Calendar className="text-primary-600" size={24} />}
                    color="bg-primary-50"
                />
                <StatCard
                    title="Total Participants"
                    value="2,930"
                    change="+18% engagement"
                    icon={<Users className="text-green-600" size={24} />}
                    color="bg-green-50"
                />
                <StatCard
                    title="Resource Bookings"
                    value={456}
                    change="+12% utilization"
                    icon={<Building2 className="text-orange-600" size={24} />}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Budget Utilized"
                    value="₹2.4L"
                    change="68% of allocation"
                    icon={<DollarSign className="text-purple-600" size={24} />}
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
                        <BarChart data={eventData}>
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
                        <LineChart data={participationData}>
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
                                    data={resourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {resourceData.map((entry, index) => (
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
                        {resourceData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm text-surface-600">{item.name}</span>
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
                        {clubActivityData.map((club) => (
                            <div key={club.name} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {club.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-surface-900">{club.name}</span>
                                        <span className="text-xs text-surface-500">{club.events} events</span>
                                    </div>
                                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                                            style={{ width: `${(club.events / 15) * 100}%` }}
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
