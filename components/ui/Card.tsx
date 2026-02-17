import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 ${className}`}>
    {children}
  </div>
);