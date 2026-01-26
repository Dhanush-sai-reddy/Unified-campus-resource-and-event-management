import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/events': 'Events',
    '/events/new': 'Create Event',
    '/resources': 'Resources',
    '/clubs': 'Clubs',
    '/profile': 'Profile',
    '/analytics': 'Analytics',
};

export default function Layout() {
    const location = useLocation();
    const { user } = useAuth();

    const pageTitle = pageTitles[location.pathname] || 'Campus System';

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
                        <button className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-full transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

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
