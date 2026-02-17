import React from 'react';
import { Club } from '../types';
import { Card, Button } from './Common';
import { Users } from 'lucide-react';

interface ClubsProps {
  clubs: Club[];
}

export const Clubs: React.FC<ClubsProps> = ({ clubs }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Student Organizations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <Card key={club.id} className="overflow-hidden flex flex-col h-full">
            <div className="h-32 bg-slate-200 relative">
               <img src={club.bannerUrl} alt={club.name} className="w-full h-full object-cover" />
               <div className="absolute -bottom-6 left-4 border-4 border-white rounded-full bg-white">
                 <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                   {club.name[0]}
                 </div>
               </div>
            </div>
            <div className="pt-8 p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900">{club.name}</h3>
              <p className="text-slate-500 text-sm mt-2 flex-1">{club.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-500">
                  <Users className="w-4 h-4 mr-1" />
                  {club.members.length} Members
                </div>
                <Button variant="secondary" className="text-sm">View Club</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
