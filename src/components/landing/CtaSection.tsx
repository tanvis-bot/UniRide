import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function CtaSection() {
  return (
    <section className="bg-brand-600 py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Start sharing your commute this week
          </h2>
          <p className="mt-2 max-w-xl text-sm text-brand-50 sm:text-base">
            Create an account, verify once, and book or publish rides on your
            regular route.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/signup">
            <Button size="lg" variant="dark" className="w-full sm:w-auto">
              Create free account
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button
              size="lg"
              variant="secondary"
              className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
              
              See how it works
            </Button>
          </Link>
        </div>
      </div>
    </section>);

}