import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Users, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = async (role: RoleOption) => {
        setSelectedRole(role.id);
        setLoading(true);
        setError(null);

        try {
            // IMPORTANT: For the hackathon demo, we are using hardcoded passwords 'password123'
            // In a real app, users would enter their own password
            await login(role.email, 'password123');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Login failed. Please make sure the backend services are running.');
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
    };

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
