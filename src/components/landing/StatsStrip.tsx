import React from 'react';
import { heroStats } from '../../data/landing';

export function StatsStrip() {
  return (
    <section
      aria-label="UniRide at a glance"
      className="border-b border-slate-200 bg-white">
      
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {heroStats.map((stat) =>
        <div key={stat.label} className="lg:border-l lg:border-slate-200 lg:pl-6 lg:first:border-0 lg:first:pl-0">
            <p className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        )}
      </div>
    </section>);

}