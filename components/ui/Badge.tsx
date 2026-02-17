import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-${color}-50 text-${color}-600 border border-${color}-100`}>
    {children}
  </span>
);