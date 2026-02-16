import { Navigate } from 'react-router-dom';

export default function HomeRedirect() {
    // Redirect to Calendar for now to showcase the new features
    return <Navigate to="/calendar" replace />;
}
