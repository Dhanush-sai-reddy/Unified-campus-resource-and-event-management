import React, { useState } from 'react';
import { Resource, Booking, User, Event, EventStatus, UserRole } from '../types';
import { Button, Modal, Input } from './Common';
import { startOfWeek, addDays, format, isSameDay, differenceInHours } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, CheckCircle, Info, Plus, Trash2, ShoppingCart, CalendarCheck, X, Clock } from 'lucide-react';

interface ResourcesProps {
  resources: Resource[];
  bookings: Booking[];
  events: Event[];
  user: User;
  onBook: (b: Booking) => void;
  onAddEvent: (e: Event) => void;
  onAddResource: (r: Resource) => void;
  onRemoveResource: (id: string) => void;
}

interface PendingSlot {
  resourceId: string;
  start: Date;
  end: Date;
}

export const Resources: React.FC<ResourcesProps> = ({ 
  resources, bookings, events, user, onBook, onAddEvent, onAddResource, onRemoveResource 
}) => {
  const [selectedResId, setSelectedResId] = useState<string>(resources[0]?.id);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Cart State
  const [cart, setCart] = useState<PendingSlot[]>([]);
  
  // Drag Selection State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: Date; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: Date; hour: number } | null>(null);
  
  // Modals
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  
  // Forms
  const [eventDetails, setEventDetails] = useState({ title: '', description: '' });
  const [newResource, setNewResource] = useState<Partial<Resource>>({ name: '', type: 'ROOM', capacity: 10, features: [], isAutoApprove: false });

  const selectedResource = resources.find(r => r.id === selectedResId);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8 AM to 6 PM

  const getBookingsForDay = (resourceId: string, day: Date) => {
    return bookings.filter(b => 
      b.resourceId === resourceId && 
      (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
      isSameDay(new Date(b.startTime), day)
    );
  };

  const getPendingForDay = (resourceId: string, day: Date) => {
    return cart.filter(p => p.resourceId === resourceId && isSameDay(p.start, day));
  };

  const getEventColor = (eventId: string) => {
    const colors = [
      'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200',
      'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
      'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 hover:bg-fuchsia-200',
      'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
      'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200',
      'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
      'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
      'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200',
      'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200',
      'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200',
      'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
      'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
      'bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-200',
      'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
      'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
      'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
      'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
    ];
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleMouseDown = (day: Date, hour: number) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  };

  const handleMouseEnter = (day: Date, hour: number) => {
    if (isDragging && dragStart && isSameDay(day, dragStart.day)) {
      setDragEnd({ day, hour });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && selectedResId) {
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
      
      const startDate = new Date(dragStart.day);
      startDate.setHours(startHour, 0, 0, 0);
      
      const endDate = new Date(dragStart.day);
      endDate.setHours(endHour, 0, 0, 0);

      // Add to cart
      setCart(prev => [...prev, { resourceId: selectedResId, start: startDate, end: endDate }]);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const finalizeEvent = () => {
    if (!eventDetails.title) return;
    
    // Admins bypass approval; Organizers need approval unless auto-approve
    const eventStatus = user.role === UserRole.ADMIN ? EventStatus.APPROVED : EventStatus.PENDING;

    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title: eventDetails.title,
      description: eventDetails.description,
      organizerId: user.id,
      startDate: cart[0].start.toISOString(), // Use first slot as start
      endDate: cart[cart.length - 1].end.toISOString(),
      locationResourceIds: Array.from(new Set(cart.map(c => c.resourceId))),
      status: eventStatus,
      attendees: [],
      budget: 0
    };

    onAddEvent(newEvent);

    cart.forEach((slot, idx) => {
      const resource = resources.find(r => r.id === slot.resourceId);
      const isAutoApprove = resource?.isAutoApprove || user.role === UserRole.ADMIN;

      onBook({
        id: `bk-${Date.now()}-${idx}`,
        resourceId: slot.resourceId,
        eventId: newEvent.id,
        bookedBy: user.id,
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString(),
        status: isAutoApprove ? 'CONFIRMED' : 'PENDING'
      });
    });

    setCart([]);
    setShowFinalizeModal(false);
    setEventDetails({ title: '', description: '' });
  };

  const handleAddResource = () => {
    if(!newResource.name) return;
    onAddResource({
        id: `res-${Date.now()}`,
        name: newResource.name!,
        type: newResource.type as any,
        capacity: newResource.capacity || 10,
        features: newResource.features || [],
        isAutoApprove: newResource.isAutoApprove || false
    });
    setShowAddResourceModal(false);
    setNewResource({ name: '', type: 'ROOM', capacity: 10, features: [], isAutoApprove: false });
  };

  const isSlotSelected = (day: Date, hour: number) => {
    if (!dragStart || !dragEnd) return false;
    if (!isSameDay(day, dragStart.day)) return false;
    const minH = Math.min(dragStart.hour, dragEnd.hour);
    const maxH = Math.max(dragStart.hour, dragEnd.hour);
    return hour >= minH && hour <= maxH;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 relative">
      {/* Sidebar: Resources List */}
      <div className="lg:w-80 flex flex-col gap-4 overflow-y-auto pb-20 custom-scrollbar">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-slate-800">Resources</h2>
          {user.role === 'ADMIN' && (
              <button onClick={() => setShowAddResourceModal(true)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                  <Plus className="w-4 h-4" />
              </button>
          )}
        </div>
        
        {resources.map(res => {
          const inCartCount = cart.filter(c => c.resourceId === res.id).length;
          return (
            <div 
                key={res.id} 
                onClick={() => setSelectedResId(res.id)}
                className={`
                p-4 rounded-xl cursor-pointer transition-all border group relative
                ${selectedResId === res.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }
                `}
            >
                <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{res.name}</h3>
                {user.role === 'ADMIN' ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveResource(res.id); }}
                        className={`p-1 rounded hover:bg-red-100 hover:text-red-600 ${selectedResId === res.id ? 'text-blue-200' : 'text-slate-300'}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : res.isAutoApprove && (
                    <CheckCircle className={`w-5 h-5 ${selectedResId === res.id ? 'text-blue-200' : 'text-green-500'}`} />
                )}
                </div>
                <div className={`text-xs space-y-1 ${selectedResId === res.id ? 'text-blue-100' : 'text-slate-500'}`}>
                <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>Capacity: {res.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    <span>{res.features.slice(0, 2).join(', ')}</span>
                </div>
                </div>
                {inCartCount > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {inCartCount} in cart
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Main: Calendar Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative pb-20">
        {/* Calendar Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-xl text-slate-800">{selectedResource?.name}</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium border border-slate-200">
               {selectedResource?.type}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-sm font-semibold px-3 w-32 text-center text-slate-700">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'd')}
            </span>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Scrollable Calendar Area */}
        <div 
          className="flex-1 overflow-auto custom-scrollbar select-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="grid grid-cols-8 min-w-[800px] relative">
            <div className="sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
               <div className="h-12 border-b border-slate-100 bg-slate-50/50"></div>
               {hours.map(h => (
                 <div key={h} className="h-20 border-b border-slate-50 flex items-start justify-center pt-2">
                   <span className="text-xs font-medium text-slate-400 font-mono">{h}:00</span>
                 </div>
               ))}
            </div>

            {weekDays.map(day => {
              const dayBookings = getBookingsForDay(selectedResId || '', day);
              const dayPending = getPendingForDay(selectedResId || '', day);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                  <div className={`
                    h-12 border-b border-slate-100 flex flex-col items-center justify-center text-sm sticky top-0 bg-white z-10
                    ${isToday ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}
                  `}>
                    <span className="font-semibold text-xs uppercase tracking-wide opacity-80">{format(day, 'EEE')}</span>
                    <span className={`font-bold text-lg leading-none ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mt-1 shadow-sm' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Bookings (Confirmed and Pending) */}
                    {dayBookings.map(b => {
                      const start = new Date(b.startTime);
                      const end = new Date(b.endTime);
                      const topOffset = (start.getHours() - 8) * 5;
                      const height = differenceInHours(end, start) * 5; 
                      const isPending = b.status === 'PENDING';
                      
                      const linkedEvent = events.find(e => e.id === b.eventId);
                      const eventName = linkedEvent?.title || 'Booked';

                      // Style logic: Random bright color for confirmed, Striped amber for pending
                      const baseClass = isPending 
                        ? 'bg-[repeating-linear-gradient(45deg,#fffbeb,#fffbeb_10px,#fef3c7_10px,#fef3c7_20px)] border-amber-400 text-amber-800' 
                        : getEventColor(b.eventId);

                      return (
                         <div 
                            key={b.id} 
                            className={`
                                absolute left-1 right-1 rounded-md p-2 z-10 overflow-hidden shadow-sm border-l-4 transition-all hover:scale-[1.02] hover:z-20
                                ${baseClass}
                            `} 
                            style={{ top: `${topOffset}rem`, height: `${height}rem` }}
                         >
                            <div className="text-xs font-bold leading-tight line-clamp-2">
                                {isPending && <span className="block text-[10px] uppercase font-extrabold opacity-75 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                                {eventName}
                            </div>
                         </div>
                      );
                    })}

                    {/* Pending Cart Items */}
                    {dayPending.map((p, idx) => {
                      const topOffset = (p.start.getHours() - 8) * 5;
                      const height = differenceInHours(p.end, p.start) * 5; 
                      return (
                         <div key={`pending-${idx}`} className="absolute left-1 right-1 rounded-md bg-green-50 border-l-4 border-green-500 p-2 z-10 overflow-hidden shadow-sm ring-1 ring-green-200" style={{ top: `${topOffset}rem`, height: `${height}rem` }}>
                            <div className="text-xs font-bold text-green-700 truncate">Selected</div>
                            <button onClick={(e) => {e.stopPropagation(); setCart(prev => prev.filter(i => i !== p))}} className="absolute top-1 right-1 text-green-700 hover:text-red-500"><X className="w-3 h-3"/></button>
                         </div>
                      );
                    })}

                    {hours.map(h => {
                      const selected = isSlotSelected(day, h);
                      return (
                        <div 
                          key={`${day}-${h}`} 
                          className={`h-20 border-b border-slate-50 relative group transition-colors ${selected ? 'bg-blue-100/50' : 'hover:bg-slate-50'}`}
                          onMouseDown={() => handleMouseDown(day, h)}
                          onMouseEnter={() => handleMouseEnter(day, h)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Cart) */}
      {cart.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in w-11/12 max-w-3xl border border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                      <p className="font-bold text-lg">{cart.length} Resources Selected</p>
                      <p className="text-slate-400 text-sm">Across {new Set(cart.map(c => c.resourceId)).size} locations</p>
                  </div>
              </div>
              
              <div className="h-8 w-px bg-slate-700 mx-2"></div>

              <div className="flex-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {cart.map((item, i) => (
                      <div key={i} className="bg-slate-800 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-2 border border-slate-700">
                          <span className="font-medium text-blue-300">
                              {resources.find(r => r.id === item.resourceId)?.name}
                          </span>
                          <span className="text-slate-400">
                              {format(item.start, 'EEE h:mm a')}
                          </span>
                          <button onClick={() => setCart(c => c.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                  ))}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                  <button onClick={() => setCart([])} className="text-slate-400 hover:text-white font-medium text-sm transition-colors">Clear</button>
                  <Button onClick={() => setShowFinalizeModal(true)} className="whitespace-nowrap shadow-blue-900/50">
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      Finalize Event
                  </Button>
              </div>
          </div>
      )}

      {/* Finalize Event Modal */}
      <Modal 
        isOpen={showFinalizeModal} 
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize & Create Event"
      >
        <div className="space-y-4">
          <Input 
             label="Event Name" 
             placeholder="e.g. Annual Robot War" 
             value={eventDetails.title}
             onChange={e => setEventDetails({...eventDetails, title: e.target.value})}
             autoFocus
          />
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none h-24 resize-none"
                  value={eventDetails.description}
                  onChange={e => setEventDetails({...eventDetails, description: e.target.value})}
              />
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Resource Summary</h4>
              <ul className="space-y-2">
                  {cart.map((c, i) => (
                      <li key={i} className="text-sm flex justify-between">
                          <span className="font-medium text-slate-700">{resources.find(r => r.id === c.resourceId)?.name}</span>
                          <span className="text-slate-500">{format(c.start, 'MMM d, h:mm a')} - {format(c.end, 'h:mm a')}</span>
                      </li>
                  ))}
              </ul>
          </div>

          <div className="pt-2 flex gap-3">
             <Button variant="secondary" className="flex-1" onClick={() => setShowFinalizeModal(false)}>Cancel</Button>
             <Button className="flex-1" onClick={finalizeEvent}>Create Event</Button>
          </div>
        </div>
      </Modal>

      {/* Admin Add Resource Modal */}
      <Modal
        isOpen={showAddResourceModal}
        onClose={() => setShowAddResourceModal(false)}
        title="Add New Resource"
      >
          <div className="space-y-4">
              <Input 
                  label="Resource Name"
                  placeholder="e.g. Chemistry Lab 2"
                  value={newResource.name}
                  onChange={e => setNewResource({...newResource, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                      <select 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                          value={newResource.type}
                          onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                      >
                          <option value="ROOM">Room</option>
                          <option value="LAB">Lab</option>
                          <option value="HALL">Hall</option>
                          <option value="EQUIPMENT">Equipment</option>
                      </select>
                  </div>
                  <Input 
                      label="Capacity"
                      type="number"
                      value={newResource.capacity}
                      onChange={e => setNewResource({...newResource, capacity: parseInt(e.target.value)})}
                  />
              </div>
              <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="autoApprove" 
                    checked={newResource.isAutoApprove}
                    onChange={e => setNewResource({...newResource, isAutoApprove: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="autoApprove" className="text-sm text-slate-700">Auto-approve bookings</label>
              </div>
              <Button onClick={handleAddResource} className="w-full mt-4">Add Resource</Button>
          </div>
      </Modal>
    </div>
  );
};
