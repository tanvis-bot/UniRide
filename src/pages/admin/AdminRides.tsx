import React, { useState } from 'react';
import { MapIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { RideMap } from '../../components/map/RideMap';
import { useAsync } from '../../hooks/useAsync';
import { api, type HydratedRide } from '../../services/api';
import { currency, formatDay, formatTime } from '../../utils/format';

export function AdminRides() {
  const [filters, setFilters] = useState({ status: 'all', q: '', date: '' });
  const [applied, setApplied] = useState(filters);
  const rides = useAsync(() => api.admin.rides(applied), [JSON.stringify(applied)]);
  const [preview, setPreview] = useState<HydratedRide | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride monitoring"
        description="Every ride on the platform with its driver, seats and booking state." />
      

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(filters);
          }}>
          
          <Input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search driver, source or destination"
            aria-label="Search rides" />
          
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            aria-label="Filter by status">
            
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            aria-label="Filter by date" />
          
          <Button type="submit">Filter</Button>
        </form>
      </Card>

      {rides.loading ?
      <LoadingState label="Loading rides…" /> :
      rides.error ?
      <ErrorState message={rides.error} onRetry={rides.refetch} /> :
      (rides.data ?? []).length === 0 ?
      <EmptyState
        icon={<MapIcon className="h-5 w-5" aria-hidden />}
        title="No rides match this filter"
        description="Adjust the status, date or search term." /> :


      <Card padded={false} className="overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Route</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Driver</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Departure</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Seats</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Cost</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Route map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.data!.map((ride) =>
              <tr key={ride.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-ink-900">
                      {ride.source} → {ride.destination}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{ride.driver.full_name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDay(ride.departure_date)} · {formatTime(ride.departure_time)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {ride.total_seats - ride.available_seats}/{ride.total_seats}
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink-900">
                      {currency(ride.total_cost)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={ride.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => setPreview(ride)}>
                        View
                      </Button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 lg:hidden">
            {rides.data!.map((ride) =>
          <li key={ride.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ink-900">
                    {ride.source} → {ride.destination}
                  </p>
                  <StatusPill status={ride.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {ride.driver.full_name} · {formatDay(ride.departure_date)} ·{' '}
                  {formatTime(ride.departure_time)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {ride.total_seats - ride.available_seats}/{ride.total_seats} seats ·{' '}
                    {currency(ride.total_cost)}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setPreview(ride)}>
                    View
                  </Button>
                </div>
              </li>
          )}
          </ul>
        </Card>
      }

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.source} → ${preview.destination}` : ''}
        description={
        preview ?
        `${preview.driver.full_name} · ${formatDay(preview.departure_date)} at ${formatTime(preview.departure_time)}` :
        ''
        }
        size="lg">
        
        {preview &&
        <RideMap
          source={preview.source_coords}
          destination={preview.dest_coords}
          route={preview.route}
          driverLocation={preview.driver_location}
          sourceLabel={preview.source}
          destinationLabel={preview.destination}
          className="h-72" />

        }
      </Modal>
    </div>);

}