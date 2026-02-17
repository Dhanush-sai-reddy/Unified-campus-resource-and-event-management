import React from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // e.g. "bg-blue-500"
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  // Extract text color from bg color class (simple heuristic for this design system)
  const textColorClass = color.replace('bg-', 'text-');
  
  return (
    <Card className="p-6 relative overflow-hidden transition-all hover:shadow-md group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon className={`w-16 h-16 ${textColorClass}`} />
      </div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-4 text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        {trend && (
          <p className="text-xs font-medium text-green-600 mt-2 flex items-center">
            +{trend}% from last month
          </p>
        )}
      </div>
    </Card>
  );
};