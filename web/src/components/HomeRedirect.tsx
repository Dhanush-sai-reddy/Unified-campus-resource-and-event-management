import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Dashboard from '../pages/Dashboard';

export default function HomeRedirect() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (user.role === UserRole.PARTICIPANT) {
        return <Navigate to="/events" replace />;
    }

    return <Dashboard />;
}
