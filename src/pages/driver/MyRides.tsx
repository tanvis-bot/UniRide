import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFrontIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { currency, formatDay, formatTime } from '../../utils/format';

const filters = [
{ key: 'all', label: 'All' },
{ key: 'draft', label: 'Drafts' },
{ key: 'scheduled', label: 'Scheduled' },
{ key: 'active', label: 'Active' },
{ key: 'completed', label: 'Completed' },
{ key: 'cancelled', label: 'Cancelled' }] as
const;

export function MyRides({ historyOnly = false }: {historyOnly?: boolean;}) {
  const rides = useAsync(() => api.rides.mine(), []);
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>(
    historyOnly ? 'completed' : 'all'
  );

  const rows = (rides.data ?? []).filter((ride) => {
    if (historyOnly) return ['completed', 'cancelled'].includes(ride.status);
    return filter === 'all' || ride.status === filter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={historyOnly ? 'Ride history' : 'My rides'}
        description={
        historyOnly ?
        'Completed and cancelled trips you have driven.' :
        'Everything you have published, from drafts to completed trips.'
        }
        action={
        !historyOnly ?
        <Link to="/driver/offer-ride">
              <Button>Offer a ride</Button>
            </Link> :
        null
        } />
      

      {!historyOnly &&
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {filters.map((item) =>
        <button
          key={item.key}
          onClick={() => setFilter(item.key)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-out ${
          filter === item.key ?
          'bg-ink-900 text-white' :
          'text-slate-600 hover:bg-slate-100'}`
          }>
          
              {item.label}
            </button>
        )}
        </div>
      }

      {rides.loading ?
      <LoadingState label="Loading your rides…" /> :
      rides.error ?
      <ErrorState message={rides.error} onRetry={rides.refetch} /> :
      rows.length === 0 ?
      <EmptyState
        icon={<CarFrontIcon className="h-5 w-5" aria-hidden />}
        title="No rides here yet"
        description="Publish a ride and it will show up in this list with its bookings."
        action={
        <Link to="/driver/offer-ride">
              <Button>Offer a ride</Button>
            </Link>
        } /> :


      <Card padded={false} className="overflow-hidden">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Route</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Departure</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Seats</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Total cost</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((ride) =>
              <tr key={ride.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink-900">
                        {ride.source} → {ride.destination}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ride.vehicle ? ride.vehicle.number : 'Vehicle pending'} ·{' '}
                        {ride.distance_km} km
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDay(ride.departure_date)} · {formatTime(ride.departure_time)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {ride.total_seats - ride.available_seats}/{ride.total_seats} booked
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink-900">
                      {currency(ride.total_cost)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={ride.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/driver/rides/${ride.id}`}>
                        <Button variant="secondary" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 lg:hidden">
            {rows.map((ride) =>
          <li key={ride.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">
                      {ride.source} → {ride.destination}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDay(ride.departure_date)} · {formatTime(ride.departure_time)}
                    </p>
                  </div>
                  <StatusPill status={ride.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    {ride.total_seats - ride.available_seats}/{ride.total_seats} seats ·{' '}
                    {currency(ride.total_cost)}
                  </p>
                  <Link to={`/driver/rides/${ride.id}`}>
                    <Button variant="secondary" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              </li>
          )}
          </ul>
        </Card>
      }
    </div>);

}