import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';

const columns = [
{
  title: 'Platform',
  links: [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Find a Ride', to: '/passenger/find-ride' },
  { label: 'Offer a Ride', to: '/driver/offer-ride' },
  { label: 'About UniRide', to: '/about' }]

},
{
  title: 'Trust & Safety',
  links: [
  { label: 'Safety', to: '/safety' },
  { label: 'Verification', to: '/safety#verification' },
  { label: 'Emergency SOS', to: '/safety#sos' },
  { label: 'Help Centre', to: '/help' }]

},
{
  title: 'Legal',
  links: [
  { label: 'Terms of Use', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Contact', to: '/contact' }]

}];


export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <p className="font-display text-xl font-extrabold text-white">
            Uni<span className="text-brand-400">Ride</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            A verified carpooling network built for students and daily
            commuters — shared fares, tracked trips and drivers you can check
            before you get in.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <MailIcon className="h-4 w-4 text-brand-400" aria-hidden />
              support@uniride.app
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-brand-400" aria-hidden />
              +91 20 4455 6677
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-brand-400" aria-hidden />
              Campus Innovation Centre, Pune
            </li>
          </ul>
        </div>
        {columns.map((column) =>
        <div key={column.title}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">
              {column.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) =>
            <li key={link.label}>
                  <Link
                to={link.to}
                className="text-sm text-slate-400 transition-colors duration-150 ease-out hover:text-white">
                
                    {link.label}
                  </Link>
                </li>
            )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} UniRide. Built for campus commuters.</p>
          <p>Maps © OpenStreetMap contributors</p>
        </div>
      </div>
    </footer>);

}