import React from 'react';
import { IMAGES } from '../data/seed';
import { CtaSection } from '../components/landing/CtaSection';

const principles = [
{
  title: 'Verified before travel',
  body: 'Identity checks are a gate, not a badge. Drivers cannot publish and students cannot claim a discount until documents are approved.'
},
{
  title: 'Transparent cost sharing',
  body: 'UniRide never invents a price. Drivers declare the real cost of the trip and the platform divides it across confirmed riders.'
},
{
  title: 'Accountable trips',
  body: 'Every ride has a route, a passenger list, a live location trail and a record that both sides can refer back to.'
}];


export function About() {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900">
              About UniRide
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              UniRide started with a simple observation on a campus road: dozens
              of cars arriving each morning from the same three suburbs, most of
              them carrying one person. Students were spending a large part of
              their monthly budget on travel while seats sat empty next to them.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              The platform connects those journeys. It verifies who is driving,
              splits the real cost of the trip between the people in the car,
              and keeps the route visible to passengers and the people waiting
              for them.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <img
              src={IMAGES.signup}
              alt="Two students with backpacks beside a car on a campus street"
              className="h-80 w-full object-cover" />
            
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          What we hold to
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {principles.map((principle) =>
          <article
            key={principle.title}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            
              <h3 className="font-display text-lg font-bold text-ink-900">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {principle.body}
              </p>
            </article>
          )}
        </div>
      </section>

      <CtaSection />
    </>);

}