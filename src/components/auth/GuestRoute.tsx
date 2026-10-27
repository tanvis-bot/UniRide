import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { dashboardPath, useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/States';

/** Keeps signed-in users out of the auth screens. */
export function GuestRoute() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <Spinner className="h-6 w-6" />
      </div>);

  }

  if (status === 'authenticated' && user) {
    return <Navigate to={dashboardPath[user.role]} replace />;
  }

  return <Outlet />;
}