import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-end justify-between mb-6 ${className}`}>
    <div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, className = '' }) => (
  <div className={`flex items-center justify-between mb-6 ${className}`}>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    {action && <div>{action}</div>}
  </div>
);
