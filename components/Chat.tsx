import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, Event, EventStatus } from '../types';
import { Card, Button } from './Common';
import { Send, Hash, Calendar, MessageSquare, UserCircle2 } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  user: User;
  events: Event[];
  onSend: (msg: ChatMessage) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, user, events, onSend }) => {
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const approvedEvents = events.filter(e => e.status === EventStatus.APPROVED);

  // Filter messages for current channel
  const channelMessages = messages.filter(m => m.channelId === activeChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend({
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: input,
      timestamp: new Date().toISOString(),
      channelId: activeChannelId
    });
    setInput('');
  };

  const ChannelItem: React.FC<{ id: string, name: string, icon: any, subText?: string }> = ({ id, name, icon: Icon, subText }) => (
    <div 
      onClick={() => setActiveChannelId(id)}
      className={`
        p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 mb-1
        ${activeChannelId === id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}
      `}
    >
        <div className={`p-2 rounded-full ${activeChannelId === id ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="font-bold text-sm truncate">{name}</div>
            {subText && <div className={`text-[10px] truncate ${activeChannelId === id ? 'text-blue-200' : 'text-slate-400'}`}>{subText}</div>}
        </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <Card className="w-80 flex flex-col overflow-hidden hidden md:flex border-r border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <MessageSquare className="w-5 h-5 text-blue-600"/> Messages
           </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">General</h3>
            <ChannelItem id="general" name="General Lobby" icon={Hash} subText="Campus-wide discussions" />
            <ChannelItem id="announcements" name="Announcements" icon={Hash} subText="Official updates" />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex justify-between items-center">
                Event Channels
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{approvedEvents.length}</span>
            </h3>
            {approvedEvents.length === 0 && (
                <div className="px-2 text-xs text-slate-400 italic">No approved events yet.</div>
            )}
            {approvedEvents.map(evt => (
                <ChannelItem 
                    key={evt.id} 
                    id={evt.id} 
                    name={evt.title} 
                    icon={Calendar} 
                    subText={`Group for ${new Date(evt.startDate).toLocaleDateString()}`}
                />
            ))}
          </div>
        </div>
      </Card>

      {/* Message Area */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-0 ring-1 ring-slate-100">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                 <Hash className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-800">
                    {activeChannelId === 'general' ? 'General Lobby' : 
                     activeChannelId === 'announcements' ? 'Announcements' : 
                     approvedEvents.find(e => e.id === activeChannelId)?.title || 'Unknown Channel'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Online
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {channelMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <p>No messages yet.</p>
                <p className="text-sm">Be the first to say hello!</p>
            </div>
          )}
          
          {channelMessages.map((msg, index) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.senderId === 'system';
            const showAvatar = index === 0 || channelMessages[index - 1].senderId !== msg.senderId;

            if (isSystem) {
                return (
                    <div key={msg.id} className="flex justify-center my-4">
                        <span className="bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full border border-blue-100 shadow-sm font-medium">
                            {msg.content}
                        </span>
                    </div>
                );
            }

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                <div className="w-8 flex-shrink-0 flex flex-col items-center">
                    {showAvatar ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                            ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}
                        `}>
                            {isMe ? 'ME' : msg.senderName[0]}
                        </div>
                    ) : <div className="w-8" />}
                </div>

                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                      <span className="text-xs text-slate-500 ml-1 mb-1 font-medium">{msg.senderName}</span>
                  )}
                  <div className={`
                    rounded-2xl px-4 py-2.5 text-sm shadow-sm
                    ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                  `}>
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder={`Message #${activeChannelId === 'general' ? 'general' : 'this channel'}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <Button type="submit" className="rounded-xl px-6"><Send className="w-5 h-5" /></Button>
          </form>
        </div>
      </Card>
    </div>
  );
};