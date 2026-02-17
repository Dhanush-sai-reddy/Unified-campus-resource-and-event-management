import React from 'react';
import { Event, User, Resource, EventStatus } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { Card, PageHeader, SectionHeader, StatCard, Badge } from './Common';

interface DashboardProps {
  events: Event[];
  users: User[];
  resources: Resource[];
}

export const Dashboard: React.FC<DashboardProps> = ({ events }) => {
  const activeEvents = events.filter(e => e.status === EventStatus.APPROVED).length;
  const pendingEvents = events.filter(e => e.status === EventStatus.PENDING).length;
  const totalBudget = events.reduce((acc, curr) => acc + (curr.budget || 0), 0);

  const eventsByStatus = [
    { name: 'Approved', value: activeEvents },
    { name: 'Pending', value: pendingEvents },
    { name: 'Completed', value: events.filter(e => e.status === EventStatus.COMPLETED).length },
    { name: 'Draft', value: events.filter(e => e.status === EventStatus.DRAFT).length },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#94A3B8'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening on campus."
        action={
          <Badge color="blue">
             <div className="flex items-center gap-1"><Activity className="w-3 h-3" /> Live Updates</div>
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Events" value={events.length} icon={Calendar} color="bg-blue-500" trend={12} />
        <StatCard title="Active Events" value={activeEvents} icon={TrendingUp} color="bg-emerald-500" trend={8} />
        <StatCard title="Budget Used" value={`$${totalBudget.toLocaleString()}`} icon={DollarSign} color="bg-purple-500" />
        <StatCard title="Pending" value={pendingEvents} icon={Users} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 flex flex-col">
          <SectionHeader 
            title="Recent Activity" 
            action={<button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>} 
          />
          
          <div className="space-y-0 divide-y divide-slate-100">
            {events.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${e.status === 'APPROVED' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{e.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{new Date(e.startDate).toLocaleDateString()}</p>
                        <span className="text-slate-300">•</span>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{e.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge color={e.status === 'APPROVED' ? 'green' : 'amber'}>{e.status}</Badge>
                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <Activity className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Event Distribution" />
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {eventsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{events.length}</span>
                <span className="text-xs text-slate-500 font-medium uppercase">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {eventsByStatus.map((entry, index) => (
              <div key={index} className="flex items-center p-2 rounded-lg bg-slate-50">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                <span className="text-xs font-medium text-slate-700 flex-1">{entry.name}</span>
                <span className="text-xs font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};