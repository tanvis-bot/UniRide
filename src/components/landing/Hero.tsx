import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheckIcon,
  GraduationCapIcon,
  NavigationIcon,
  SearchIcon,
  WalletIcon } from
'lucide-react';
import { IMAGES } from '../../data/seed';
import { Button } from '../ui/Button';

const assurances = [
{ icon: BadgeCheckIcon, label: 'Verified drivers' },
{ icon: WalletIcon, label: 'Affordable fares' },
{ icon: NavigationIcon, label: 'Live tracking' },
{ icon: GraduationCapIcon, label: 'Student friendly' }];


export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      <img
        src={IMAGES.hero}
        alt="Students sharing a car outside a university campus gate"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-70" />
      
      <div
        className="absolute inset-0 bg-ink-950/80 md:bg-[linear-gradient(90deg,rgba(7,13,24,0.94)_0%,rgba(7,13,24,0.86)_45%,rgba(7,13,24,0.35)_100%)]"
        aria-hidden />
      
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-2xl">
          
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />
            Verified campus carpooling network
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Journey.
            <br />
            Shared Safely.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Find trusted rides, share travel costs, and reach your destination
            safely with UniRide.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/passenger/find-ride">
              <Button
                size="lg"
                icon={<SearchIcon className="h-4 w-4" aria-hidden />}
                className="w-full sm:w-auto">
                
                Find a Ride
              </Button>
            </Link>
            <Link to="/driver/offer-ride">
              <Button
                size="lg"
                variant="secondary"
                className="w-full border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20 sm:w-auto">
                
                Offer a Ride
              </Button>
            </Link>
          </div>

          <ul className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {assurances.map(({ icon: Icon, label }) =>
            <li key={label} className="flex items-center gap-2 text-sm text-slate-200">
                <Icon className="h-4 w-4 shrink-0 text-brand-400" aria-hidden />
                <span className="font-medium">{label}</span>
              </li>
            )}
          </ul>
        </motion.div>
      </div>
    </section>);

}