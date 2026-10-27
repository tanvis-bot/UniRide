import React from 'react';
import { IMAGES } from '../../data/seed';

export function SustainabilitySection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <img
            src={IMAGES.sustainability}
            alt="Aerial view of a green city avenue with light traffic and wide sidewalks"
            className="h-72 w-full object-cover lg:h-96" />
          
        </div>
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Fuller cars, fewer separate trips
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Most commuter cars on a campus route travel with one person inside.
            When three students share the same journey, that is two vehicles
            that never leave the parking lot — less congestion at the gate, less
            fuel burned per person, and a cheaper commute for everyone in the
            car.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-500">Average occupancy today</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-ink-900">
                1.2 people
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Occupancy on UniRide</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-brand-700">
                3.1 people
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Cost per rider</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-ink-900">
                ↓ 62%
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>);

}