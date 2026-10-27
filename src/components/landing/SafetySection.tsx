import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from 'lucide-react';
import { safetyFeatures } from '../../data/landing';
import { IMAGES } from '../../data/seed';
import { Button } from '../ui/Button';

export function SafetySection() {
  return (
    <section id="safety" className="bg-ink-950 py-20 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
            Safety by default
          </p>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Every ride is checked before it starts
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Carpooling only works when riders know exactly who is driving.
            UniRide verifies documents, tracks trips live and keeps an
            escalation path open for the whole journey.
          </p>
          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
            <img
              src={IMAGES.safety}
              alt="Driver navigating a city road at dusk with a mounted navigation map"
              className="h-56 w-full object-cover" />
            
          </div>
          <Link to="/safety" className="mt-6 inline-block">
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              Read the safety guide
            </Button>
          </Link>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
          {safetyFeatures.map((feature) =>
          <li key={feature.title} className="bg-ink-900 p-6">
              <h3 className="font-display text-base font-bold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {feature.body}
              </p>
            </li>
          )}
        </ul>
      </div>
    </section>);

}