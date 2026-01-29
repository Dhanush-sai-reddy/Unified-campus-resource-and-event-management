import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
    LayoutDashboard,
    Calendar,
    CalendarDays,
    Users,
    User,
    BarChart3,
    LogOut,
    ChevronLeft,
    Menu,
    MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    roles?: UserRole[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.ORGANIZER] },
    { label: 'Events', path: '/events', icon: <Calendar size={20} /> },
    { label: 'Calendar', path: '/calendar', icon: <CalendarDays size={20} /> },

    { label: 'Chat', path: '/chat', icon: <MessageCircle size={20} /> },
    { label: 'Resources', path: '/resources', icon: <CalendarDays size={20} />, roles: [UserRole.ADMIN, UserRole.ORGANIZER] },
    { label: 'Clubs', path: '/clubs', icon: <Users size={20} /> },
    { label: 'Profile', path: '/profile', icon: <User size={20} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    console.log('Sidebar: Current User:', user);
    console.log('Sidebar: User Role:', user?.role);

    const filteredItems = navItems.filter(
        item => {
            if (!item.roles) return true;
            const hasRole = user && item.roles.includes(user.role);
            // console.log(`Checking item ${item.label}: User Role: ${user?.role}, Required Roles: ${item.roles}, Allowed: ${hasRole}`);
            return hasRole;
        }
    );

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className={`p-4 border-b border-surface-100/50 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/30">
                        C
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-display font-bold text-xl text-surface-900 tracking-tight"
                        >
                            CampusSys
                        </motion.span>
                    )}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                >
                    <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }: { isActive: boolean }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${isActive
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                            } ${collapsed ? 'justify-center' : ''}`
                        }
                    >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className={`p-3 border-t border-surface-100 ${collapsed ? 'items-center' : ''}`}>
                {user && !collapsed && (
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{user.name}</p>
                            <p className="text-xs text-surface-500 capitalize">{user.role.toLowerCase()}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white shadow-lg text-surface-600"
            >
                <Menu size={24} />
            </button>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-surface-200 z-50 md:hidden flex flex-col"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex fixed inset-y-0 left-0 bg-white/90 backdrop-blur-xl border-r border-surface-200 z-20 flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
