import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, Hash, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { api } from '../services/api';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
    room: string;
}

interface ChatRoom {
    id: string;
    name: string;
    type: 'global' | 'event' | 'club';
    icon: string;
}

const defaultRooms: ChatRoom[] = [
    { id: 'global', name: 'Campus Chat', type: 'global', icon: '🌐' },
    { id: 'event_hackoverflow', name: 'HackOverflow 2026', type: 'event', icon: '💻' },
    { id: 'event_ai_workshop', name: 'AI Workshop', type: 'event', icon: '🤖' },
    { id: 'club_coding', name: 'Coding Club', type: 'club', icon: '👨‍💻' },
    { id: 'club_ai', name: 'AI Society', type: 'club', icon: '🧠' },
];

export default function Chat() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event');
    const eventName = searchParams.get('name');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentRoom, setCurrentRoom] = useState<string>(eventId ? `event_${eventId}` : 'global');
    const [rooms, setRooms] = useState<ChatRoom[]>(defaultRooms);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Add event room if accessed via URL
    useEffect(() => {
        if (eventId && eventName) {
            const eventRoom: ChatRoom = {
                id: `event_${eventId}`,
                name: eventName,
                type: 'event',
                icon: '📅'
            };
            setRooms(prev => {
                if (!prev.find(r => r.id === eventRoom.id)) {
                    return [eventRoom, ...prev];
                }
                return prev;
            });
            setCurrentRoom(`event_${eventId}`);
        }
    }, [eventId, eventName]);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to Chat Socket");
            socket.emit('join_room', currentRoom);
        });

        socket.on('receive_message', (msg: Message) => {
            if (msg.room === currentRoom) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Switch rooms
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.emit('join_room', currentRoom);
            setMessages([]); // Clear messages when switching rooms

            // Fetch history
            api.getChatHistory(currentRoom)
                .then(history => {
                    setMessages(history);
                })
                .catch(err => console.error("Failed to load chat history", err));
        }
    }, [currentRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user) return;

        const msg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: user.name,
            timestamp: Date.now(),
            room: currentRoom,
        };

        socketRef.current?.emit('send_message', { ...msg, room: currentRoom });
        setInputText('');
    };

    const currentRoomInfo = rooms.find(r => r.id === currentRoom) || rooms[0];

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
            {/* Sidebar - Room List */}
            <div className="w-64 border-r border-surface-200 bg-surface-50 flex flex-col">
                <div className="p-4 border-b border-surface-200">
                    <h2 className="font-display font-bold text-surface-900 flex items-center gap-2">
                        <MessageCircle size={20} className="text-primary-600" />
                        Chat Rooms
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setCurrentRoom(room.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${currentRoom === room.id
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'text-surface-600 hover:bg-surface-100'
                                }`}
                        >
                            <span className="text-lg">{room.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{room.name}</p>
                                <p className="text-xs text-surface-400 capitalize">{room.type}</p>
                            </div>
                            {currentRoom === room.id && (
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="p-3 border-t border-surface-200 bg-white">
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
                            <p className="text-xs text-surface-400">Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-surface-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{currentRoomInfo.icon}</span>
                        <div>
                            <h3 className="font-bold text-surface-900">{currentRoomInfo.name}</h3>
                            <p className="text-xs text-surface-500 flex items-center gap-1">
                                <Users size={12} />
                                <span className="capitalize">{currentRoomInfo.type} chat</span>
                                <span className="mx-1">•</span>
                                <span className="text-green-600">Live</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                        <Hash size={14} />
                        <span>{currentRoom}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50/50">
                    {messages.length === 0 && (
                        <div className="text-center text-surface-400 py-16">
                            <MessageCircle className="mx-auto mb-3 text-surface-300" size={40} />
                            <p className="font-medium">No messages in {currentRoomInfo.name}</p>
                            <p className="text-sm mt-1">Be the first to say hello!</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.sender === user?.name;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                    ? 'bg-primary-600 text-white rounded-br-sm'
                                    : 'bg-white text-surface-900 rounded-bl-sm border border-surface-100'
                                    }`}>
                                    {!isMe && (
                                        <p className="text-xs font-semibold mb-1 text-primary-600">{msg.sender}</p>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <p className={`text-[10px] mt-1.5 ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-surface-200 bg-white flex gap-3">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Message ${currentRoomInfo.name}...`}
                        className="flex-1 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                    >
                        <Send size={18} />
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
