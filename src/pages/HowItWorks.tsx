import React from 'react';
import { Link } from 'react-router-dom';
import { CarFrontIcon, UserIcon } from 'lucide-react';
import { faqs, steps } from '../data/landing';
import { Button } from '../components/ui/Button';
import { CtaSection } from '../components/landing/CtaSection';

const passengerFlow = [
'Search your route, date and the number of seats you need.',
'Compare drivers by fare, departure time, rating and verification badge.',
'Review the fare breakdown, then send a booking request.',
'Once the driver confirms, track the trip live and chat in-app.'];


const driverFlow = [
'Get your licence, government ID and vehicle registration approved.',
'Publish a ride with your route, departure time, seats and total trip cost.',
'Accept or decline requests — you always choose who travels with you.',
'Start the ride to share your GPS, then mark it complete on arrival.'];


export function HowItWorks() {
  return (
    <>
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight text-ink-900">
            How UniRide works
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            One account, one verification, and then a commute you share with
            people going the same way. Here is the full flow for both sides of
            the trip.
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) =>
          <li key={step.title} className="bg-white p-6">
              <span className="font-display text-sm font-bold text-brand-600">
                Step {index + 1}
              </span>
              <h2 className="mt-3 font-display text-lg font-bold text-ink-900">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          )}
        </ol>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <UserIcon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-display text-xl font-bold text-ink-900">
                If you are riding
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {passengerFlow.map((item, i) =>
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-ink-800">
                    {i + 1}
                  </span>
                  {item}
                </li>
              )}
            </ul>
            <Link to="/signup" className="mt-6 inline-block">
              <Button>Sign up as a passenger</Button>
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
                <CarFrontIcon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-display text-xl font-bold text-ink-900">
                If you are driving
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {driverFlow.map((item, i) =>
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-ink-800">
                    {i + 1}
                  </span>
                  {item}
                </li>
              )}
            </ul>
            <Link to="/signup" className="mt-6 inline-block">
              <Button variant="dark">Apply to drive</Button>
            </Link>
          </article>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
            Common questions
          </h2>
          <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq) =>
            <div key={faq.q} className="grid gap-2 py-5 md:grid-cols-[1fr_1.6fr] md:gap-8">
                <dt className="font-display text-base font-bold text-ink-900">
                  {faq.q}
                </dt>
                <dd className="text-sm leading-relaxed text-slate-600">{faq.a}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <CtaSection />
    </>);

}