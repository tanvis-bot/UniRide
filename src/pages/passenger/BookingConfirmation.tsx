import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2Icon, Share2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill, VerifiedBadge } from '../../components/ui/Status';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { RideMap } from '../../components/map/RideMap';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, formatLongDay, formatTime } from '../../utils/format';

export function BookingConfirmation() {
  const { bookingId = '' } = useParams();
  const booking = useAsync(() => api.bookings.get(bookingId), [bookingId]);

  async function shareTrip(rideId: string) {
    try {
      const share = await api.rides.share(rideId);
      const url = `${window.location.origin}/trip/${share.token}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      toast.success('Trip link copied', { description: url });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (booking.loading) return <LoadingState label="Loading your booking…" />;
  if (booking.error || !booking.data)
  return (
    <ErrorState
      message={booking.error ?? 'Booking not found.'}
      onRetry={booking.refetch} />);



  const data = booking.data;
  const ride = data.ride;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2Icon className="h-8 w-8 shrink-0 text-brand-600" aria-hidden />
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink-900">
              {data.status === 'pending' ?
              'Booking request sent' :
              'Your seat is confirmed'}
            </h1>
            <p className="mt-1 text-sm text-ink-700">
              {data.status === 'pending' ?
              `${ride.driver.full_name} has been notified and will confirm your seat shortly.` :
              'You are all set. Track the ride from the Active Ride screen on the day of travel.'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Booking ${data.id}`}
          action={<StatusPill status={data.status} />} />
        

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={ride.driver.full_name} src={ride.driver.avatar_url} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink-900">{ride.driver.full_name}</p>
                <VerifiedBadge verified={ride.driver.verified} />
              </div>
              <p className="text-sm text-slate-500">
                {ride.vehicle ?
                `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.color} · ${ride.vehicle.number}` :
                'Vehicle pending'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">You pay</p>
            <p className="font-display text-2xl font-extrabold text-ink-900">
              {currency(data.final_fare)}
            </p>
          </div>
        </div>

        <dl className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Route</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-900">
              {ride.source} → {ride.destination}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Date</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-900">
              {formatLongDay(ride.departure_date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Departure</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-900">
              {formatTime(ride.departure_time)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Seats</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-900">{data.seats}</dd>
          </div>
        </dl>

        <dl className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Base fare</dt>
            <dd className="font-semibold text-ink-900">{currency(data.base_fare)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Student discount</dt>
            <dd className="font-semibold text-brand-700">
              {data.discount ? `− ${currency(data.discount)}` : '—'}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <dt className="font-semibold text-ink-900">Final fare</dt>
            <dd className="font-display text-lg font-extrabold text-ink-900">
              {currency(data.final_fare)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/passenger/bookings">
            <Button variant="secondary">All bookings</Button>
          </Link>
          <Link to="/passenger/active-ride">
            <Button variant="secondary">Active ride</Button>
          </Link>
          <Button
            icon={<Share2Icon className="h-4 w-4" aria-hidden />}
            onClick={() => shareTrip(ride.id)}>
            
            Share trip
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Route preview" />
        <RideMap
          source={ride.source_coords}
          destination={ride.dest_coords}
          route={ride.route}
          sourceLabel={ride.source}
          destinationLabel={ride.destination}
          className="h-72" />
        
      </Card>
    </div>);

}