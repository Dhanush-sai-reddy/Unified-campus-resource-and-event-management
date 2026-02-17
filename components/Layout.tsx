import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Using HashRouter from App
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Building2, 
  Users, 
  MessageSquare, 
  LogOut, 
  Menu,
  X,
  Bell
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/', 
      allowed: [UserRole.ADMIN, UserRole.ORGANIZER] 
    },
    { 
      label: 'Events', 
      icon: CalendarDays, 
      path: '/events', 
      allowed: [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.STUDENT] 
    },
    { 
      label: 'Resources', 
      icon: Building2, 
      path: '/resources', 
      allowed: [UserRole.ADMIN, UserRole.ORGANIZER] 
    },
    { 
      label: 'Clubs & Committees', 
      icon: Users, 
      path: '/clubs', 
      allowed: [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.STUDENT] 
    },
    { 
      label: 'Messages', 
      icon: MessageSquare, 
      path: '/chat', 
      allowed: [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.STUDENT] 
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Filter items based on user role
  const visibleNavItems = navItems.filter(item => item.allowed.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-tight">
          <span className="text-blue-400 mr-2">Uni</span>Nexus
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-slate-700"
            />
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none"></div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
