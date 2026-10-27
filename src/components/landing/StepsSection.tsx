import React from 'react';
import { steps } from '../../data/landing';

export function StepsSection() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            How UniRide works
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Four steps from signing up to arriving. Verification sits in the
            middle on purpose — nobody travels with an unchecked account.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) =>
          <li key={step.title} className="flex flex-col bg-white p-6">
              <span className="font-display text-sm font-bold text-brand-600">
                Step {index + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          )}
        </ol>
      </div>
    </section>);

}