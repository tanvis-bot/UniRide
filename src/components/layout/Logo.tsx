import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({
  to = '/',
  tone = 'dark'



}: {to?: string;tone?: 'dark' | 'light';}) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2.5"
      aria-label="UniRide home">
      
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden>
          
          <path d="M5 17h14" />
          <path d="M6.5 17V9.5L8 6h8l1.5 3.5V17" />
          <circle cx="8" cy="19" r="1.6" />
          <circle cx="16" cy="19" r="1.6" />
          <path d="M6.5 11h11" />
        </svg>
      </span>
      <span
        className={`font-display text-lg font-extrabold tracking-tight ${
        tone === 'light' ? 'text-white' : 'text-ink-900'}`
        }>
        
        Uni<span className="text-brand-500">Ride</span>
      </span>
    </Link>);

}