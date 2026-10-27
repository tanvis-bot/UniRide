import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MessageSquareIcon,
  Share2Icon,
  StarIcon,
  UsersIcon } from
'lucide-react';
import { FareBreakdown } from '../../components/rides/FareBreakdown';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Field, Select } from '../../components/ui/Field';
import { VerifiedBadge } from '../../components/ui/Status';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { RideMap } from '../../components/map/RideMap';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, formatLongDay, formatTime } from '../../utils/format';

export function RideDetails() {
  const { rideId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(params.get('book') === '1');
  const [booking, setBooking] = useState(false);

  const ride = useAsync(() => api.rides.get(rideId), [rideId]);
  const fare = useAsync(() => api.rides.fareQuote(rideId, seats), [rideId, seats]);
  const bookings = useAsync(() => api.bookings.mine(), []);

  useEffect(() => {
    if (params.get('book') === '1') setConfirmOpen(true);
  }, [params]);

  async function confirmBooking() {
    setBooking(true);
    try {
      const created = await api.bookings.create(rideId, seats);
      toast.success('Ride booked successfully.');
      navigate(`/passenger/bookings/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirmOpen(false);
    } finally {
      setBooking(false);
    }
  }

  async function shareTrip() {
    try {
      const share = await api.rides.share(rideId);
      const url = `${window.location.origin}/trip/${share.token}`;

      await navigator.clipboard?.writeText(url).catch(() => undefined);

      toast.success('Trip link copied', {
        description: (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Open shared trip
          </a>
        ),
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (ride.loading) return <LoadingState label="Loading ride details…" />;
  if (ride.error || !ride.data)
  return <ErrorState message={ride.error ?? 'Ride not found.'} onRetry={ride.refetch} />;

  const data = ride.data;

  const existingBooking = bookings.data?.find(
  (booking) =>
    String(booking.ride_id) === String(rideId) &&
    !['cancelled', 'rejected'].includes(booking.status)
);

  const alreadyBooked = Boolean(existingBooking);

  return (
    <div className="space-y-6">
      <Link
        to="/passenger/find-ride"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 ease-out hover:text-ink-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={data.driver.full_name} src={data.driver.avatar_url} size="lg" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-xl font-extrabold text-ink-900">
                      {data.driver.full_name}
                    </h1>
                    <VerifiedBadge verified={data.driver.verified} />
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {data.driver.rating.toFixed(1)} · {data.driver.total_trips} trips
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Fare per passenger
                </p>
                <p className="font-display text-3xl font-extrabold text-ink-900">
                  {currency(data.per_seat_fare)}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Vehicle</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">
                  {data.vehicle ?
                  `${data.vehicle.make} ${data.vehicle.model}` :
                  'Not assigned'}
                </dd>
                {data.vehicle &&
                <dd className="text-xs text-slate-500">
                    {data.vehicle.color} · {data.vehicle.number}
                  </dd>
                }
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Departure</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden />
                  {formatLongDay(data.departure_date)}
                </dd>
                <dd className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                  {formatTime(data.departure_time)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Seats</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <UsersIcon className="h-4 w-4 text-slate-400" aria-hidden />
                  {data.available_seats} of {data.total_seats} available
                </dd>
              </div>
            </dl>

            {data.notes &&
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                {data.notes}
              </p>
            }
          </Card>

          <Card>
            <CardHeader
              title="Route"
              description={`${data.source} → ${data.destination} · ${data.distance_km} km, about ${data.duration_min} min`} />
            
            <RideMap
              source={data.source_coords}
              destination={data.dest_coords}
              route={data.route}
              sourceLabel={data.source}
              destinationLabel={data.destination}
              className="h-80" />
            
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Book this ride" />
            <Field label="Seats" htmlFor="seatCount">
              <Select
                id="seatCount"
                value={String(seats)}
                onChange={(e) => setSeats(Number(e.target.value))}>
                
                {Array.from({ length: Math.max(1, data.available_seats) }).map((_, i) =>
                <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'seat' : 'seats'}
                  </option>
                )}
              </Select>
            </Field>

            <div className="mt-4">
              {fare.loading || !fare.data ?
              <LoadingState label="Calculating your fare…" /> :

              <FareBreakdown fare={fare.data} seats={seats} />
              }
            </div>

            <div className="mt-5 space-y-2">
              <Button
                block
                size="lg"
                disabled={alreadyBooked || data.available_seats < seats}
                onClick={() => setConfirmOpen(true)}
              >
                {alreadyBooked
                  ? 'Already booked'
                  : data.available_seats < seats
                    ? 'Not enough seats'
                    : 'Book Ride'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/passenger/messages">
                  <Button
                    variant="secondary"
                    block
                    icon={<MessageSquareIcon className="h-4 w-4" aria-hidden />}>
                    
                    Contact
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  block
                  icon={<Share2Icon className="h-4 w-4" aria-hidden />}
                  onClick={shareTrip}>
                  
                  Share Trip
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm your booking"
        description={`${data.source} → ${data.destination} · ${formatLongDay(data.departure_date)} at ${formatTime(data.departure_time)}`}
        footer={
        <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button loading={booking} onClick={confirmBooking}>
              {booking ? 'Booking…' : `Confirm · ${currency(fare.data?.finalFare ?? 0)}`}
            </Button>
          </>
        }>
        
        {fare.data && <FareBreakdown fare={fare.data} seats={seats} />}
        <p className="mt-4 text-sm text-slate-600">
          Your request goes to {data.driver.full_name} for approval. The seat is
          held while the driver reviews it.
        </p>
      </Modal>
    </div>);

}