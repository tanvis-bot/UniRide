import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CarFrontIcon,
  NavigationIcon,
  RouteIcon,
  TicketIcon,
  WalletIcon } from
'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { RideSearchForm, type RideSearchValues } from '../../components/rides/RideSearchForm';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { currency, formatDay, formatTime, fromNow, greeting, todayIso } from '../../utils/format';

export function PassengerDashboard() {
  const { user, studentApproved } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [search, setSearch] = useState<RideSearchValues>({
    source: '',
    destination: '',
    date: todayIso(),
    seats: 1
  });

  const bookings = useAsync(() => api.bookings.mine(), []);
  const active = useAsync(() => api.rides.active(), []);

  const upcoming = (bookings.data ?? []).
  filter((b) => ['pending', 'confirmed'].includes(b.status) && b.ride.status === 'scheduled').
  sort((a, b) =>
  `${a.ride.departure_date}${a.ride.departure_time}`.localeCompare(
    `${b.ride.departure_date}${b.ride.departure_time}`
  )
  );
  const completed = (bookings.data ?? []).filter((b) => b.status === 'completed');
  const saved = completed.reduce(
    (sum, b) => sum + Math.max(0, b.ride.total_cost - b.final_fare),
    0
  );

  function runSearch() {
    const params = new URLSearchParams();
    if (search.source) params.set('source', search.source);
    if (search.destination) params.set('destination', search.destination);
    if (search.date) params.set('date', search.date);
    params.set('seats', String(search.seats));
    navigate(`/passenger/find-ride?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${user?.full_name.split(' ')[0]}`}
        description={
        studentApproved ?
        'Your student verification is approved — the 15% discount applies automatically.' :
        'Verify your college ID to unlock the student discount on every booking.'
        }
        action={
        !studentApproved ?
        <Link to="/passenger/student-verification">
              <Button variant="secondary">Verify student ID</Button>
            </Link> :
        null
        } />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming ride"
          value={upcoming.length ? formatDay(upcoming[0].ride.departure_date) : '—'}
          hint={
          upcoming.length ?
          `${upcoming[0].ride.source} → ${upcoming[0].ride.destination}` :
          'No ride booked yet'
          }
          icon={<TicketIcon className="h-5 w-5" aria-hidden />}
          to="/passenger/bookings" />
        
        <StatCard
          label="Active ride"
          value={active.data ? 'Live now' : 'None'}
          hint={active.data ? 'Track your driver on the map' : 'Nothing in progress'}
          icon={<NavigationIcon className="h-5 w-5" aria-hidden />}
          to="/passenger/active-ride"
          tone={active.data ? 'primary' : 'default'} />
        
        <StatCard
          label="Total trips"
          value={completed.length}
          hint="Completed with UniRide"
          icon={<RouteIcon className="h-5 w-5" aria-hidden />} />
        
        <StatCard
          label="Saved travel cost"
          value={currency(saved)}
          hint="Versus paying the full trip cost"
          icon={<WalletIcon className="h-5 w-5" aria-hidden />} />
        
      </div>

      <Card>
        <CardHeader
          title="Find a ride"
          description="Search verified drivers travelling your route." />
        
        <RideSearchForm values={search} onChange={setSearch} onSubmit={runSearch} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Upcoming rides"
            description="Bookings waiting for departure."
            action={
            <Link to="/passenger/bookings">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            } />
          
          {bookings.loading ?
          <LoadingState label="Loading your bookings…" /> :
          bookings.error ?
          <ErrorState message={bookings.error} onRetry={bookings.refetch} /> :
          upcoming.length === 0 ?
          <EmptyState
            icon={<CarFrontIcon className="h-5 w-5" aria-hidden />}
            title="No upcoming rides"
            description="Search your route to book a seat with a verified driver."
            action={
            <Link to="/passenger/find-ride">
                  <Button>Find a ride</Button>
                </Link>
            } /> :


          <ul className="space-y-3">
              {upcoming.slice(0, 3).map((booking) =>
            <li
              key={booking.id}
              className="rounded-xl border border-slate-200 p-4 transition-colors duration-150 ease-out hover:border-brand-300">
              
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                    name={booking.ride.driver.full_name}
                    src={booking.ride.driver.avatar_url}
                    size="sm" />
                  
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {booking.ride.driver.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {booking.ride.vehicle ?
                      `${booking.ride.vehicle.make} ${booking.ride.vehicle.model} · ${booking.ride.vehicle.number}` :
                      'Vehicle pending'}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={booking.status} />
                  </div>
                  <p className="mt-3 truncate text-sm font-medium text-ink-800">
                    {booking.ride.source} → {booking.ride.destination}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                    <span>
                      {formatDay(booking.ride.departure_date)} ·{' '}
                      {formatTime(booking.ride.departure_time)}
                    </span>
                    <span className="font-display font-bold text-ink-900">
                      {currency(booking.final_fare)}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/passenger/bookings/${booking.id}`}>
                      <Button variant="secondary" size="sm">
                        Booking details
                      </Button>
                    </Link>
                    <Link to={`/passenger/rides/${booking.ride.id}`}>
                      <Button variant="ghost" size="sm">
                        View ride
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
            title="Recent notifications"
            action={
            <Link to="/passenger/notifications">
                <Button variant="ghost" size="sm">
                  All
                </Button>
              </Link>
            } />
          
          {notifications.length === 0 ?
          <EmptyState
            icon={<BellIcon className="h-5 w-5" aria-hidden />}
            title="Nothing new"
            description="Booking updates and ride alerts will show up here." /> :


          <ul className="divide-y divide-slate-100">
              {notifications.slice(0, 5).map((n) =>
            <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{fromNow(n.created_at)}</p>
                </li>
            )}
            </ul>
          }
        </Card>
      </div>
    </div>);

}