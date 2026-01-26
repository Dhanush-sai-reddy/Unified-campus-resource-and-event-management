import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { getCurrentUser } from '../services/mockService';
import { API_BASE_URL } from '../config';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<any>;
    loginWithData: (user: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getCurrentUser()
                .then(u => setUser(u))
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        // For OTP flow, we return the data instead of setting it immediately if needed, 
        // but here we maintain current behavior for other components and add a helper logic if needed.
        // Actually, for OTP we will bypass this 'login' function in the component and use 'verifyLogin' logic there,
        // then call 'completeLogin' here.
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    };

    const loginWithData = (user: User, token: string) => {
        localStorage.setItem('token', token);
        setUser(user);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithData, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
