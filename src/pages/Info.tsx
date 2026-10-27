import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

type Kind = 'help' | 'contact' | 'terms' | 'privacy';

const content: Record<Kind, {title: string;intro: string;sections: Array<{h: string;p: string;}>;}> = {
  help: {
    title: 'Help centre',
    intro: 'Answers to the questions students and drivers ask most often.',
    sections: [
    {
      h: 'My booking is still pending',
      p: 'Drivers confirm requests manually. If a request has been open for more than a few hours, cancel it from My Bookings and book another ride on the same route.'
    },
    {
      h: 'My verification was rejected',
      p: 'Open the verification page for the exact reason from the review team, then upload a current, fully readable document and submit again.'
    },
    {
      h: 'Live tracking is not updating',
      p: 'Tracking starts when the driver taps Share my location and allows browser location access. Until then the map shows the planned route only.'
    }]

  },
  contact: {
    title: 'Contact us',
    intro: 'The support desk answers within one working day.',
    sections: [
    { h: 'Support', p: 'support@uniride.app · +91 20 4455 6677, Monday to Saturday, 8am to 8pm.' },
    { h: 'Trust & safety', p: 'safety@uniride.app for anything involving a driver, passenger or an active trip.' },
    { h: 'Campus partnerships', p: 'partners@uniride.app to bring UniRide to your college.' }]

  },
  terms: {
    title: 'Terms of use',
    intro: 'The rules that apply to everyone using UniRide.',
    sections: [
    {
      h: 'Cost sharing, not commercial transport',
      p: 'Drivers declare the real cost of a trip and it is divided between confirmed passengers. UniRide is not a taxi service and drivers must not profit from a shared ride.'
    },
    {
      h: 'Accurate identity',
      p: 'Accounts must use real names and valid documents. Sharing an account or submitting another person’s ID results in suspension.'
    },
    {
      h: 'Conduct',
      p: 'Harassment, unsafe driving, or refusing a confirmed passenger without cause can lead to removal from the platform.'
    }]

  },
  privacy: {
    title: 'Privacy policy',
    intro: 'What UniRide collects, why, and who can see it.',
    sections: [
    {
      h: 'What we store',
      p: 'Account details, verification documents, ride and booking records, chat messages tied to a ride, and location pings while a trip is active.'
    },
    {
      h: 'Who can see it',
      p: 'Passengers see the driver’s name, photo, rating, verification badge and vehicle. Drivers see confirmed passengers. Documents are visible only to the review team.'
    },
    {
      h: 'Location data',
      p: 'GPS is only broadcast while a ride is active and the driver has enabled sharing. Shared trip links show the route and current position, never personal contact details.'
    }]

  }
};

export function Info({ kind }: {kind: Kind;}) {
  const page = content[kind];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900">
        {page.title}
      </h1>
      <p className="mt-3 text-base text-slate-600">{page.intro}</p>
      <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
        {page.sections.map((section) =>
        <section key={section.h} className="py-6">
            <h2 className="font-display text-lg font-bold text-ink-900">{section.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.p}</p>
          </section>
        )}
      </div>
      <Link to="/" className="mt-8 inline-block">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>);

}