import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../../types';
import { dashboardPath, useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/States';

/**
 * Route guard. The backend re-checks authorization on every request, so this
 * only controls what is rendered — never what is permitted.
 */
export function ProtectedRoute({ roles }: {roles?: Role[];}) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-6 w-6" />
          <p className="text-sm text-slate-500">Checking your session…</p>
        </div>
      </div>);

  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}