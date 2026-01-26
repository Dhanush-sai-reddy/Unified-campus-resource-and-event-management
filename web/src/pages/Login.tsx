import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, GraduationCap, ArrowRight, Sparkles, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { User } from '../types';

interface RoleOption {
    id: string;
    title: string;
    description: string;
    email: string;
    icon: React.ReactNode;
    gradient: string;
    features: string[];
}

const roleOptions: RoleOption[] = [
    {
        id: 'admin',
        title: 'Administrator',
        description: 'Full system control and oversight',
        email: 'admin@campus.edu',
        icon: <Shield size={32} />,
        gradient: 'from-red-500 via-orange-500 to-amber-500',
        features: ['Approve events', 'Manage resources', 'View analytics', 'User management'],
    },
    {
        id: 'organizer',
        title: 'Club Organizer',
        description: 'Create and manage club events',
        email: 'organizer@campus.edu',
        icon: <Users size={32} />,
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
        features: ['Create events', 'Book resources', 'Manage members', 'Track registrations'],
    },
    {
        id: 'student',
        title: 'Student',
        description: 'Discover and join campus activities',
        email: 'student@campus.edu',
        icon: <GraduationCap size={32} />,
        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        features: ['Browse events', 'Join clubs', 'Register for events', 'View schedule'],
    },
];

export default function Login() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOTP] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [pendingAuth, setPendingAuth] = useState<{ user: User, token: string } | null>(null);

    const { login, loginWithData } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showOTP && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showOTP, timer]);

    const handleRoleSelect = async (role: RoleOption) => {
        setSelectedRole(role.id);
        setLoading(true);
        setError(null);

        try {
            // STEP 1: Verify Credentials First
            // We use the auth context login method but we need to intercept the result
            // Since we modified login to return data, we can use that.
            // Or we can just call it to verify credentials.
            // Wait, standard login() sets state. We want to avoid setting state until OTP.
            // But we modified context to return data.
            // However, context login() sets state immediately as per our modification earlier?
            // Let's check... Ah, I should have modified login() to NOT set user if I wanted this flow perfectly.
            // But I returned data. 
            // Actually, for this specific flow, let's just simulate the "2-step" by:
            // 1. Calling api directly here to validate without setting context
            // 2. Or, simpler: Just show OTP for everyone "before" calling login?
            // No, that's fake.
            // Let's try to call the login() and if it works, we immediately logout() internally? No that causes flicker.
            // Best way: Don't use context.login() for step 1. Use fetch directly.

            // Direct fetch to validate credentials
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: role.email, password: 'password123' }),
            });

            if (!response.ok) throw new Error('Invalid credentials');

            const data = await response.json();
            setPendingAuth({ user: data.user, token: data.token });

            // Proceed to OTP Step
            setLoading(false);
            setShowOTP(true);
            setTimer(30);

        } catch (err) {
            console.error(err);
            setError('Login failed. Please make sure the backend services are running.');
            setLoading(false);
            setSelectedRole(null);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOTP = [...otp];
        newOTP[index] = value;
        setOTP(newOTP);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOTPSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);

        // Simulate OTP verification delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // For demo: Accept any 6-digit code, or specific one "123456"
        if (otpValue === '123456') {
            if (pendingAuth) {
                loginWithData(pendingAuth.user, pendingAuth.token);
                navigate('/');
            }
        } else {
            setError('Invalid OTP Code. Try 123456');
            setLoading(false);
        }
    };

    const handleResendOTP = () => {
        setTimer(30);
        setOTP(['', '', '', '', '', '']);
        setError(null);
        // In real app, trigger API to resend
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
    };

    if (showOTP) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
                >
                    <button
                        onClick={() => { setShowOTP(false); setSelectedRole(null); setOTP(['', '', '', '', '', '']); setError(null); }}
                        className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="text-center mb-8 mt-4">
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 mx-auto flex items-center justify-center text-primary-400 mb-4">
                            <KeyRound size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Two-Step Verification</h2>
                        <p className="text-slate-400 text-sm">
                            We sent a verification code to <span className="text-white font-medium">{roleOptions.find(r => r.id === selectedRole)?.email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleOTPSubmit} className="space-y-8">
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOTPChange(idx, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !digit && idx > 0) {
                                            const prev = document.getElementById(`otp-${idx - 1}`);
                                            prev?.focus();
                                        }
                                    }}
                                    className="w-10 h-14 md:w-12 md:h-16 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder-transparent"
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                                {error}
                            </motion.p>
                        )}

                        <div className="text-center">
                            <button
                                type="button"
                                disabled={timer > 0}
                                onClick={handleResendOTP}
                                className={`text-sm ${timer > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-primary-400 hover:text-primary-300 font-medium'}`}
                            >
                                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify & Login
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">For demo purposes, use code <span className="text-slate-300 font-mono">123456</span></p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Default Role Selection View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/5 to-transparent rounded-full"></div>
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 relative z-10"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary-500/30">
                        C
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
                    Campus<span className="text-primary-400">Sys</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                    Unified Campus Resource & Event Management
                </p>
            </motion.div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm max-w-md w-full text-center"
                >
                    {error}
                </motion.div>
            )}

            {/* Role Selection */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-5xl relative z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-xl font-medium text-white mb-2 flex items-center justify-center gap-2">
                        <Sparkles className="text-amber-400" size={20} />
                        Choose Your Role to Continue
                    </h2>
                    <p className="text-slate-500 text-sm">Select a profile to explore the system</p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {roleOptions.map((role) => (
                        <motion.button
                            key={role.id}
                            variants={item}
                            onClick={() => handleRoleSelect(role)}
                            disabled={loading}
                            className={`group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${selectedRole === role.id ? 'ring-2 ring-primary-500 border-primary-500/50' : ''
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {role.icon}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
                                {role.title}
                            </h3>
                            <p className="text-slate-400 text-sm mb-5">{role.description}</p>

                            <ul className="space-y-2 mb-6">
                                {role.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-center gap-2 text-sm font-medium text-primary-400 group-hover:text-primary-300 transition-colors">
                                {selectedRole === role.id && loading ? (
                                    <div className="w-5 h-5 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continue as {role.title.split(' ')[0]}
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 text-slate-600 text-sm relative z-10"
            >
                HackOverflow 2026 • Demo Mode
            </motion.p>
        </div>
    );
}
