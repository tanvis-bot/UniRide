import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOffIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center bg-slate-50 px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <MapPinOffIcon className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900">
          This page took a wrong turn
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The link you followed does not exist on UniRide.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to home</Button>
        </Link>
      </div>
    </main>);

}