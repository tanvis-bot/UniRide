import React from 'react';
import { Link } from 'react-router-dom';
import {
  CarFrontIcon,
  CheckCircle2Icon,
  ClockIcon,
  InboxIcon,
  NavigationIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { currency, formatDay, formatTime, greeting } from '../../utils/format';

export function DriverDashboard() {
  const { user, verification } = useAuth();
  const rides = useAsync(() => api.rides.mine(), []);
  const requests = useAsync(() => api.bookings.requests(), []);

  const list = rides.data ?? [];
  const upcoming = list.filter((r) => r.status === 'scheduled');
  const active = list.filter((r) => r.status === 'active');
  const completed = list.filter((r) => r.status === 'completed');
  const pendingRequests = (requests.data ?? []).filter((r) => r.status === 'pending');
  const passengersServed = completed.reduce((sum, r) => sum + r.confirmed_passengers, 0);

  const verified = verification.driver === 'approved';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${user?.full_name.split(' ')[0]}`}
        description="Your rides, requests and verification status at a glance."
        action={
        <Link to="/driver/offer-ride">
            <Button icon={<CarFrontIcon className="h-4 w-4" aria-hidden />}>
              Offer a ride
            </Button>
          </Link>
        } />
      

      {!verified &&
      <div
        role="status"
        className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        
          <div className="flex gap-3">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 className="font-display text-base font-bold text-amber-900">
                {verification.driver === 'rejected' ?
              'Your driver verification was rejected' :
              'Your driver verification is pending'}
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                You can offer rides after your documents are approved.
              </p>
            </div>
          </div>
          <Link to="/driver/verification">
            <Button variant="secondary">Review documents</Button>
          </Link>
        </div>
      }

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active rides"
          value={active.length}
          hint={active.length ? 'Live tracking is on' : 'Nothing in progress'}
          icon={<NavigationIcon className="h-5 w-5" aria-hidden />}
          to="/driver/active-ride"
          tone={active.length ? 'primary' : 'default'} />
        
        <StatCard
          label="Upcoming rides"
          value={upcoming.length}
          hint="Published and accepting bookings"
          icon={<CarFrontIcon className="h-5 w-5" aria-hidden />}
          to="/driver/rides" />
        
        <StatCard
          label="Total passengers"
          value={passengersServed}
          hint="Across completed trips"
          icon={<UsersIcon className="h-5 w-5" aria-hidden />} />
        
        <StatCard
          label="Completed trips"
          value={completed.length}
          hint="Lifetime on UniRide"
          icon={<CheckCircle2Icon className="h-5 w-5" aria-hidden />}
          to="/driver/history" />
        
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Upcoming rides"
            description="Published rides waiting to depart."
            action={
            <Link to="/driver/rides">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            } />
          
          {rides.loading ?
          <LoadingState label="Loading your rides…" /> :
          rides.error ?
          <ErrorState message={rides.error} onRetry={rides.refetch} /> :
          upcoming.length === 0 ?
          <EmptyState
            icon={<CarFrontIcon className="h-5 w-5" aria-hidden />}
            title="No upcoming rides"
            description={
            verified ?
            'Publish your regular commute and let riders book the empty seats.' :
            'Once verification is approved you can publish your first ride.'
            }
            action={
            verified ?
            <Link to="/driver/offer-ride">
                    <Button>Offer a ride</Button>
                  </Link> :
            undefined
            } /> :


          <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 4).map((ride) =>
            <li key={ride.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold text-ink-900">
                        {ride.source} → {ride.destination}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {formatDay(ride.departure_date)} · {formatTime(ride.departure_time)} ·{' '}
                        {ride.available_seats} of {ride.total_seats} seats free
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-extrabold text-ink-900">
                        {currency(ride.total_cost)}
                      </p>
                      <p className="text-xs text-slate-500">total trip cost</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link to={`/driver/rides/${ride.id}`}>
                      <Button variant="secondary" size="sm">
                        Manage ride
                      </Button>
                    </Link>
                  </div>
                </li>
            )}
            </ul>
          }
        </Card>

        <Card>
          <CardHeader
            title="Ride requests"
            description="Passengers waiting for your decision."
            action={
            <Link to="/driver/requests">
                <Button variant="ghost" size="sm">
                  All
                </Button>
              </Link>
            } />
          
          {requests.loading ?
          <LoadingState label="Loading requests…" /> :
          pendingRequests.length === 0 ?
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" aria-hidden />}
            title="No pending requests"
            description="New booking requests will appear here in real time." /> :


          <ul className="divide-y divide-slate-100">
              {pendingRequests.slice(0, 4).map((request) =>
            <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {request.passenger.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {request.ride.source} → {request.ride.destination}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                </li>
            )}
            </ul>
          }
        </Card>
      </div>
    </div>);

}