import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};