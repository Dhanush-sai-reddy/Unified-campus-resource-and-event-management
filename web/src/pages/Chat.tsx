import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to Chat Socket");
            socket.emit('join_room', 'global');
        });

        socket.on('receive_message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

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
        };

        socketRef.current?.emit('send_message', { ...msg, room: 'global' });
        setInputText('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-display font-bold text-lg text-surface-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    Campus Global Chat
                </h2>
                <p className="text-xs text-surface-500">Real-time messaging powered by Redis & Socket.io</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-surface-400 py-10">
                        <p>No messages yet. Say hello!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender === user?.name;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-surface-100 text-surface-900 rounded-bl-none'}`}>
                                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.sender}</p>}
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-surface-200 bg-white flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
