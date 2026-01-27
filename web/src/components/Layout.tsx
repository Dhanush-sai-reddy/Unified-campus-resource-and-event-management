import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Info, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, Notification } from '../services/mockService';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/events': 'Events',

    '/resources': 'Resources',
    '/clubs': 'Clubs',
    '/profile': 'Profile',
    '/analytics': 'Analytics',
};

export default function Layout() {
    const location = useLocation();
    const { user } = useAuth();

    const pageTitle = pageTitles[location.pathname] || 'Campus System';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
        fetchNotifications();

        // Poll for notifications every minute (mock)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-surface-50">
            <Sidebar />

            {/* Main content area */}
            <main className="md:ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-surface-200/60 h-16 px-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 ml-12 md:ml-0">
                        <motion.h1
                            key={pageTitle}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl font-display font-semibold text-surface-800"
                        >
                            {pageTitle}
                        </motion.h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="hidden sm:flex relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-48 lg:w-64 pl-10 pr-4 py-2 rounded-xl border border-surface-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                            />
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-full transition-colors relative"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                                            <h3 className="font-semibold text-surface-900">Notifications</h3>
                                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{unreadCount} new</span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-surface-500">
                                                    <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No notifications</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-surface-100">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-4 hover:bg-surface-50 transition-colors relative group ${notification.isRead ? 'opacity-60' : ''}`}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={`mt-1 p-1.5 rounded-full ${notification.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                    <Info size={14} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-surface-900 mb-0.5">{notification.title}</p>
                                                                    <p className="text-xs text-surface-500 leading-snug mb-1">{notification.message}</p>
                                                                    <p className="text-[10px] text-surface-400">
                                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {!notification.isRead && (
                                                                    <button
                                                                        onClick={(e) => handleMarkRead(notification.id, e)}
                                                                        className="absolute top-4 right-4 p-1 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-50 rounded"
                                                                        title="Mark as read"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User avatar */}
                        {user && (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                            />
                        )}
                    </div>
                </header>

                {/* Page content */}
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 md:p-8 max-w-7xl mx-auto"
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}
