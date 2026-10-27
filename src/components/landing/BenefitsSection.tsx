import React from 'react';
import { benefits } from '../../data/landing';

export function BenefitsSection() {
  const [primary, ...rest] = benefits;
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="rounded-2xl bg-brand-50 p-8 ring-1 ring-brand-200">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              {primary.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-700">
              {primary.body}
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-200 pt-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Total trip cost
                </dt>
                <dd className="mt-1 font-display text-xl font-bold text-ink-900">₹420</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Shared by
                </dt>
                <dd className="mt-1 font-display text-xl font-bold text-ink-900">3 riders</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  You pay
                </dt>
                <dd className="mt-1 font-display text-xl font-bold text-brand-700">₹119</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500">
              Built for student commuters
            </h3>
            <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {rest.map((benefit) =>
              <li key={benefit.title} className="py-5">
                  <h4 className="font-display text-lg font-bold text-ink-900">
                    {benefit.title}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {benefit.body}
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}