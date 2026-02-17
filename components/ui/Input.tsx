import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
    <input className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${className}`} {...props} />
  </div>
);