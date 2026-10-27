import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlertIcon } from 'lucide-react';
import { dashboardPath, useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function Unauthorized() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-signal-red">
          <ShieldAlertIcon className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900">
          You do not have access to this area
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This section belongs to a different role. The API rejects the request
          as well, so nothing was loaded.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {user ?
          <Link to={dashboardPath[user.role]}>
              <Button block>Go to my dashboard</Button>
            </Link> :

          <Link to="/login">
              <Button block>Sign in</Button>
            </Link>
          }
          <Link to="/">
            <Button variant="secondary" block>
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </main>);

}