import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Club {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    eventCount: number;
    category: string;
    isJoined: boolean;
}

const MOCK_CLUBS: Club[] = [
    {
        id: 'c1',
        name: 'Coding Club',
        description: 'Learn to code, build projects, and participate in hackathons together.',
        memberCount: 156,
        eventCount: 24,
        category: 'Technical',
        isJoined: true,
    },
    {
        id: 'c2',
        name: 'AI Society',
        description: 'Explore artificial intelligence, machine learning, and data science.',
        memberCount: 89,
        eventCount: 12,
        category: 'Technical',
        isJoined: true,
    },
    {
        id: 'c3',
        name: 'Cultural Club',
        description: 'Celebrate diversity through music, dance, art, and cultural events.',
        memberCount: 234,
        eventCount: 36,
        category: 'Cultural',
        isJoined: false,
    },
    {
        id: 'c4',
        name: 'Sports Committee',
        description: 'Organize sports events, tournaments, and fitness activities.',
        memberCount: 312,
        eventCount: 48,
        category: 'Sports',
        isJoined: false,
    },
    {
        id: 'c5',
        name: 'Entrepreneurship Cell',
        description: 'Foster innovation and startup culture among students.',
        memberCount: 67,
        eventCount: 8,
        category: 'Business',
        isJoined: false,
    },
    {
        id: 'c6',
        name: 'Photography Club',
        description: 'Capture moments, learn photography skills, and showcase your work.',
        memberCount: 78,
        eventCount: 15,
        category: 'Arts',
        isJoined: false,
    },
];

const categoryColors: Record<string, string> = {
    Technical: 'bg-blue-50 text-blue-700',
    Cultural: 'bg-purple-50 text-purple-700',
    Sports: 'bg-green-50 text-green-700',
    Business: 'bg-orange-50 text-orange-700',
    Arts: 'bg-pink-50 text-pink-700',
};

function ClubCard({ club }: { club: Club }) {
    const [joined, setJoined] = useState(club.isJoined);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="glass-card rounded-2xl overflow-hidden group"
        >
            {/* Club banner */}
            <div className="h-24 bg-gradient-to-br from-primary-500 via-indigo-500 to-purple-500 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[club.category]}`}>
                        {club.category}
                    </span>
                </div>
            </div>

            <div className="p-5">
                {/* Avatar & Name */}
                <div className="flex items-start gap-4 -mt-10 relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-primary-600 border-2 border-white">
                        {club.name[0]}
                    </div>
                    <div className="pt-8">
                        <h3 className="font-bold text-lg text-surface-900 group-hover:text-primary-600 transition-colors">
                            {club.name}
                        </h3>
                    </div>
                </div>

                <p className="text-sm text-surface-500 mt-3 line-clamp-2">{club.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4 text-sm text-surface-600">
                    <div className="flex items-center gap-1">
                        <Users size={14} className="text-surface-400" />
                        <span>{club.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-surface-400" />
                        <span>{club.eventCount} events</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={() => setJoined(!joined)}
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${joined
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                            }`}
                    >
                        {joined ? 'Joined' : 'Join Club'}
                    </button>
                    <Link
                        to={`/clubs/${club.id}`}
                        className="px-4 py-2.5 rounded-xl bg-surface-100 text-surface-700 font-medium hover:bg-surface-200 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default function Clubs() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setClubs(MOCK_CLUBS);
            setLoading(false);
        }, 500);
    }, []);

    const categories = ['all', ...new Set(MOCK_CLUBS.map(c => c.category))];

    const filteredClubs = clubs.filter(club => {
        const matchesCategory = categoryFilter === 'all' || club.category === categoryFilter;
        const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            club.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900">Clubs & Communities</h1>
                    <p className="text-surface-500 mt-1">Join clubs and connect with like-minded peers</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search clubs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clubs grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-primary-600 animate-spin"></div>
                </div>
            ) : filteredClubs.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="mx-auto text-surface-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-surface-900">No clubs found</h3>
                    <p className="text-surface-500 mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredClubs.map((club) => (
                        <ClubCard key={club.id} club={club} />
                    ))}
                </motion.div>
            )}
        </div>
    );
}
