import React, { useState } from 'react';
import { Event, EventStatus, Resource, User, UserRole } from '../types';
import { Card, Button, Input, Modal, Badge, PageHeader } from './Common';
import { generateEventDescription } from '../services/geminiService';
import { Plus, Wand2, Calendar as CalIcon, Clock, MapPin, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface EventsProps {
  events: Event[];
  resources: Resource[];
  user: User;
  onAddEvent: (e: Event) => void;
  onUpdateStatus: (id: string, status: EventStatus) => void;
}

export const Events: React.FC<EventsProps> = ({ events, resources, user, onAddEvent, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const handleGenerate = async () => {
    if (!formData.title || !formData.notes) return;
    setIsGenerating(true);
    const desc = await generateEventDescription(formData.title, formData.notes);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title: formData.title,
      description: formData.description || formData.notes,
      organizerId: user.id,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      locationResourceIds: [],
      // Admins bypass approval; Organizers need approval
      status: user.role === UserRole.ADMIN ? EventStatus.APPROVED : EventStatus.PENDING,
      attendees: [],
      budget: 0
    };
    onAddEvent(newEvent);
    setShowForm(false);
    setFormData({ title: '', notes: '', description: '', startDate: '', endDate: '' });
  };

  const canCreateEvent = user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Events" 
        subtitle="Manage campus activities and approvals."
        action={
          canCreateEvent ? (
            <Button onClick={() => setShowForm(true)} className="shadow-lg shadow-blue-200">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4">
        {events.map(event => {
          const bookedResources = event.locationResourceIds
            .map(id => resources.find(r => r.id === id))
            .filter((r): r is Resource => !!r);

          return (
            <Card key={event.id} className="p-0 flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow group">
              <div className="w-full md:w-2 bg-slate-200 group-hover:bg-blue-500 transition-colors"></div>
              <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                          <Badge color={event.status === 'APPROVED' ? 'green' : event.status === 'PENDING' ? 'amber' : 'slate'}>
                              {event.status}
                          </Badge>
                          <span className="text-slate-400 text-xs font-medium flex items-center bg-slate-50 px-2 py-1 rounded">
                              <CalIcon className="w-3 h-3 mr-1.5" />
                              {format(new Date(event.startDate), 'MMM d, yyyy')}
                          </span>
                          <span className="text-slate-400 text-xs font-medium flex items-center bg-slate-50 px-2 py-1 rounded">
                              <Clock className="w-3 h-3 mr-1.5" />
                              {format(new Date(event.startDate), 'h:mm a')}
                          </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{event.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{event.description}</p>
                      
                      {bookedResources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {bookedResources.map(res => (
                            <span key={res.id} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                              {res.type === 'LAB' || res.type === 'EQUIPMENT' ? <Building2 className="w-3 h-3 mr-1.5 text-blue-500" /> : <MapPin className="w-3 h-3 mr-1.5 text-red-500" />}
                              {res.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center gap-2">
                          <div className="flex -space-x-2">
                              {[1,2,3].map(i => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                              ))}
                          </div>
                          <span className="text-xs text-slate-500 ml-2">+12 attendees</span>
                      </div>
                  </div>

                  <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[160px]">
                      {user.role === 'ADMIN' && event.status === 'PENDING' ? (
                          <>
                          <Button onClick={() => onUpdateStatus(event.id, EventStatus.APPROVED)} className="w-full text-sm">Approve</Button>
                          <Button variant="danger" onClick={() => onUpdateStatus(event.id, EventStatus.REJECTED)} className="w-full text-sm">Reject</Button>
                          </>
                      ) : (
                          <Button variant="secondary" className="w-full text-sm">View Details</Button>
                      )}
                  </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Event">
        <form onSubmit={handleSubmit} className="space-y-5">
            <Input 
              label="Event Title" 
              placeholder="e.g. Annual Tech Symposium"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Start Date" 
                type="datetime-local" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                required
              />
              <Input 
                label="End Date" 
                type="datetime-local" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <label className="block text-sm font-medium text-slate-700">Description</label>
                 <button 
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.title}
                    className="text-xs flex items-center text-purple-600 hover:text-purple-700 disabled:opacity-50 font-medium transition-colors"
                 >
                    <Wand2 className="w-3 h-3 mr-1" />
                    {isGenerating ? 'Generating...' : 'Enhance with AI'}
                 </button>
              </div>
              
              {!formData.description ? (
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all h-32 resize-none"
                    placeholder="Jot down rough notes..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
              ) : (
                  <div className="relative">
                      <textarea 
                        className="w-full px-4 py-3 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all h-32 resize-none text-slate-700"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] text-purple-400 font-medium bg-white px-2 rounded-full border border-purple-100">AI Generated</div>
                  </div>
              )}
            </div>

            <div className="pt-2">
                <Button type="submit" className="w-full py-2.5">Create Event</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};