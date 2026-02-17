import React from 'react';
import { UserRole } from '../types';
import { Card, Button } from './Common';

export const Login: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900"><span className="text-blue-600">Uni</span>Nexus</h1>
          <p className="text-slate-500 mt-2">Campus Management Platform</p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Select a Demo Role to Login</p>
          <Button className="w-full py-3" onClick={() => onLogin(UserRole.ADMIN)}>
            Login as Administrator
          </Button>
          <Button className="w-full py-3" variant="secondary" onClick={() => onLogin(UserRole.ORGANIZER)}>
            Login as Club Lead
          </Button>
          <Button className="w-full py-3" variant="ghost" onClick={() => onLogin(UserRole.STUDENT)}>
            Login as Student
          </Button>
        </div>
      </Card>
    </div>
  );
};
