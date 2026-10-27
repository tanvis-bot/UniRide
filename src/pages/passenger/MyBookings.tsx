import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { TicketIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api, type BookingWithRide } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, formatDay, formatTime } from '../../utils/format';

const tabs = [
{ key: 'upcoming', label: 'Upcoming' },
{ key: 'completed', label: 'Completed' },
{ key: 'cancelled', label: 'Cancelled' }] as
const;

export function MyBookings() {
  const bookings = useAsync(() => api.bookings.mine(), []);
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<BookingWithRide | null>(null);
  const [working, setWorking] = useState(false);

  const rows = (bookings.data ?? []).filter((b) => {
    if (tab === 'upcoming') return ['pending', 'confirmed'].includes(b.status);
    if (tab === 'completed') return b.status === 'completed';
    return ['cancelled', 'rejected'].includes(b.status);
  });

  async function cancel() {
    if (!cancelTarget) return;
    setWorking(true);
    try {
      await api.bookings.cancel(cancelTarget.id);
      toast.success('Booking cancelled.');
      bookings.refetch();
      setCancelTarget(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        description="Every seat you have requested, confirmed or completed." />
      

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1" role="tablist">
        {tabs.map((item) =>
        <button
          key={item.key}
          role="tab"
          aria-selected={tab === item.key}
          onClick={() => setTab(item.key)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-out ${
          tab === item.key ?
          'bg-ink-900 text-white' :
          'text-slate-600 hover:bg-slate-100'}`
          }>
          
            {item.label}
          </button>
        )}
      </div>

      {bookings.loading ?
      <LoadingState label="Loading your bookings…" /> :
      bookings.error ?
      <ErrorState message={bookings.error} onRetry={bookings.refetch} /> :
      rows.length === 0 ?
      <EmptyState
        icon={<TicketIcon className="h-5 w-5" aria-hidden />}
        title={`No ${tab} bookings`}
        description="When you book a seat it will appear here with its status and fare."
        action={
        <Link to="/passenger/find-ride">
              <Button>Find a ride</Button>
            </Link>
        } /> :


      <ul className="space-y-4">
          {rows.map((booking) =>
        <li key={booking.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                  name={booking.ride.driver.full_name}
                  src={booking.ride.driver.avatar_url} />
                
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-ink-900">
                        {booking.ride.source} → {booking.ride.destination}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {booking.ride.driver.full_name} ·{' '}
                        {booking.ride.vehicle ?
                    booking.ride.vehicle.number :
                    'Vehicle pending'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={booking.status} />
                    <p className="font-display text-xl font-extrabold text-ink-900">
                      {currency(booking.final_fare)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Booking ID
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">{booking.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Date</dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">
                      {formatDay(booking.ride.departure_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Time</dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">
                      {formatTime(booking.ride.departure_time)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Seats</dt>
                    <dd className="mt-0.5 font-semibold text-ink-900">{booking.seats}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link to={`/passenger/bookings/${booking.id}`}>
                    <Button variant="secondary" size="sm">
                      View booking
                    </Button>
                  </Link>
                  <Link to={`/passenger/rides/${booking.ride.id}`}>
                    <Button variant="ghost" size="sm">
                      Ride details
                    </Button>
                  </Link>
                  {['pending', 'confirmed'].includes(booking.status) &&
              <Button
                variant="ghost"
                size="sm"
                className="text-signal-red hover:bg-rose-50"
                onClick={() => setCancelTarget(booking)}>
                
                      Cancel booking
                    </Button>
              }
                </div>
              </Card>
            </li>
        )}
        </ul>
      }

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this booking?"
        description={
        cancelTarget ?
        `${cancelTarget.ride.source} → ${cancelTarget.ride.destination} on ${formatDay(cancelTarget.ride.departure_date)}. The seat is released back to the driver.` :
        ''
        }
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Keep booking
            </Button>
            <Button variant="danger" loading={working} onClick={cancel}>
              Cancel booking
            </Button>
          </>
        } />
      
    </div>);

}