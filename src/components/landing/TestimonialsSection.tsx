import React from 'react';
import { QuoteIcon } from 'lucide-react';
import { testimonials } from '../../data/landing';
import { AVATARS } from '../../data/seed';
import { Avatar } from '../ui/Avatar';

const avatarByName: Record<string, string> = {
  'Priya Nair': AVATARS.priya,
  'Rahul Deshmukh': AVATARS.rahul,
  'Arjun Mehta': AVATARS.arjun
};

export function TestimonialsSection() {
  const featured = testimonials.find((t) => t.featured)!;
  const supporting = testimonials.filter((t) => !t.featured);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          Riders and drivers on the same commute
        </h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <figure className="flex h-full flex-col rounded-2xl bg-ink-900 p-8 text-white">
            <QuoteIcon className="h-7 w-7 text-brand-400" aria-hidden />
            <blockquote className="mt-5 font-display text-xl font-semibold leading-relaxed sm:text-2xl">
              “{featured.quote}”
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-8">
              <Avatar name={featured.name} src={avatarByName[featured.name]} size="md" />
              <div>
                <p className="font-semibold">{featured.name}</p>
                <p className="text-sm text-slate-400">{featured.role}</p>
              </div>
            </figcaption>
          </figure>

          <div className="grid gap-6">
            {supporting.map((t) =>
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              
                <blockquote className="text-sm leading-relaxed text-ink-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-5">
                  <Avatar name={t.name} src={avatarByName[t.name]} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>
    </section>);

}