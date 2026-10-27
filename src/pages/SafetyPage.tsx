import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoyIcon, ShieldCheckIcon } from 'lucide-react';
import { safetyFeatures } from '../data/landing';
import { IMAGES } from '../data/seed';
import { Button } from '../components/ui/Button';

const escalation = [
{
  title: 'During the ride',
  body: 'Tap SOS on the active ride screen. We record your identity, ride, timestamp and last known location, and alert the platform response desk immediately.'
},
{
  title: 'Your contacts',
  body: 'Saved emergency contacts are listed on the same screen with one-tap calling, and your live trip link can be shared with them before you depart.'
},
{
  title: 'After the trip',
  body: 'Report an issue from the booking. Every report is triaged by the admin team, and accounts can be suspended while a case is open.'
}];


export function SafetyPage() {
  return (
    <>
      <header className="relative isolate overflow-hidden bg-ink-950">
        <img
          src={IMAGES.safety}
          alt="Driver on a city road at dusk with navigation running"
          className="absolute inset-0 h-full w-full object-cover opacity-40" />
        
        <div className="absolute inset-0 bg-ink-950/75" aria-hidden />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
            Trust & safety
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Nobody drives on UniRide without being checked
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            Verification, live tracking and a real escalation path are part of
            the product, not an optional extra.
          </p>
        </div>
      </header>

      <section id="verification" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          What we verify
        </h2>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {safetyFeatures.map((feature) =>
          <li key={feature.title} className="bg-white p-6">
              <h3 className="font-display text-base font-bold text-ink-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.body}
              </p>
            </li>
          )}
        </ul>
      </section>

      <section id="sos" className="bg-slate-50 py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-signal-red">
              <LifeBuoyIcon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              If something feels wrong
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Escalation is available at every stage of the trip, and it never
              takes more than one tap to reach a human.
            </p>
            <Link to="/signup" className="mt-6 inline-block">
              <Button>Create your account</Button>
            </Link>
          </div>
          <ol className="space-y-4">
            {escalation.map((item, index) =>
            <li
              key={item.title}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6">
              
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink-900">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              </li>
            )}
          </ol>
        </div>
      </section>
    </>);

}