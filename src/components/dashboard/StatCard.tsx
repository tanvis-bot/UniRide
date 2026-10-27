import React from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  to?: string;
  tone?: 'default' | 'primary';
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  to,
  tone = 'default'
}: StatCardProps) {
  const body =
  <div
    className={`flex h-full flex-col justify-between rounded-2xl border p-5 shadow-card transition-colors duration-150 ease-out ${
    tone === 'primary' ?
    'border-ink-900 bg-ink-900 text-white' :
    'border-slate-200 bg-white'} ${
    to ? 'hover:border-brand-400' : ''}`}>
    
      <div className="flex items-start justify-between gap-3">
        <p
        className={`text-sm font-medium ${
        tone === 'primary' ? 'text-slate-300' : 'text-slate-500'}`
        }>
        
          {label}
        </p>
        <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        tone === 'primary' ? 'bg-white/10 text-brand-300' : 'bg-slate-100 text-ink-700'}`
        }>
        
          {icon}
        </span>
      </div>
      <div className="mt-6">
        <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
        {hint &&
      <p
        className={`mt-1 text-xs ${
        tone === 'primary' ? 'text-slate-400' : 'text-slate-500'}`
        }>
        
            {hint}
          </p>
      }
      </div>
    </div>;


  return to ?
  <Link to={to} className="block h-full">
      {body}
    </Link> :

  body;

}