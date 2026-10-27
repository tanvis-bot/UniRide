import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, PlayIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RideMap } from '../../components/map/RideMap';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Badge, StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { currency, formatLongDay, formatTime } from '../../utils/format';

export function DriverRideDetail() {
  const { rideId = '' } = useParams();
  const navigate = useNavigate();
  const ride = useAsync(() => api.rides.get(rideId), [rideId]);
  const passengers = useAsync(() => api.rides.passengers(rideId), [rideId]);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [edit, setEdit] = useState({
    departure_date: '',
    departure_time: '',
    total_cost: '',
    total_seats: ''
  });

  if (ride.loading) return <LoadingState label="Loading ride…" />;
  if (ride.error || !ride.data)
  return <ErrorState message={ride.error ?? 'Ride not found.'} onRetry={ride.refetch} />;

  const data = ride.data;

  function openEdit() {
    setEdit({
      departure_date: data.departure_date,
      departure_time: data.departure_time,
      total_cost: String(data.total_cost),
      total_seats: String(data.total_seats)
    });
    setEditOpen(true);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    try {
      await api.rides.update(rideId, edit);
      toast.success('Ride updated.');
      setEditOpen(false);
      ride.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function publishDraft() {
    setWorking(true);
    try {
      await api.rides.update(rideId, { status: 'scheduled' });
      toast.success('Ride published.');
      ride.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function cancelRide() {
    setWorking(true);
    try {
      await api.rides.cancel(rideId);
      toast.success('Ride cancelled and passengers notified.');
      setCancelOpen(false);
      ride.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function startRide() {
    setWorking(true);
    try {
      await api.rides.setStage(rideId, 'ride_started');
      toast.success('Ride started. Live tracking is on.');
      navigate('/driver/active-ride');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/driver/rides"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors duration-150 ease-out hover:text-ink-900">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to my rides
      </Link>

      <PageHeader
        title={`${data.source} → ${data.destination}`}
        description={`${formatLongDay(data.departure_date)} at ${formatTime(data.departure_time)} · ${data.distance_km} km`}
        action={<StatusPill status={data.status} />} />
      

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Passengers"
              description="Everyone who has requested or confirmed a seat."
              action={
              <Link to="/driver/requests">
                  <Button variant="ghost" size="sm">
                    Requests
                  </Button>
                </Link>
              } />
            
            {passengers.loading ?
            <LoadingState label="Loading passenger list…" /> :
            (passengers.data ?? []).length === 0 ?
            <EmptyState
              icon={<UsersIcon className="h-5 w-5" aria-hidden />}
              title="No bookings yet"
              description="Requests appear here as soon as a passenger books a seat." /> :


            <ul className="divide-y divide-slate-100">
                {passengers.data!.map((row) =>
              <li
                key={row.booking.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                    name={row.passenger.full_name}
                    src={row.passenger.avatar_url}
                    size="sm" />
                  
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">
                          {row.passenger.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.booking.id} · {row.booking.seats} seat
                          {row.booking.seats > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.student_verified && <Badge tone="success">Student verified</Badge>}
                      <StatusPill status={row.booking.status} />
                      <p className="font-semibold text-ink-900">
                        {currency(row.booking.final_fare)}
                      </p>
                    </div>
                  </li>
              )}
              </ul>
            }
          </Card>

          <Card>
            <CardHeader title="Route" />
            <RideMap
              source={data.source_coords}
              destination={data.dest_coords}
              route={data.route}
              sourceLabel={data.source}
              destinationLabel={data.destination}
              className="h-72" />
            
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Ride summary" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Vehicle</dt>
                <dd className="font-semibold text-ink-900">
                  {data.vehicle ? `${data.vehicle.make} ${data.vehicle.model}` : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Seats booked</dt>
                <dd className="font-semibold text-ink-900">
                  {data.total_seats - data.available_seats} of {data.total_seats}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Total trip cost</dt>
                <dd className="font-semibold text-ink-900">{currency(data.total_cost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Current fare per passenger</dt>
                <dd className="font-semibold text-brand-700">
                  {currency(data.per_seat_fare)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Manage" />
            <div className="space-y-2">
              {data.status === 'draft' &&
              <Button block loading={working} onClick={publishDraft}>
                  Publish ride
                </Button>
              }
              {data.status === 'scheduled' &&
              <Button
                block
                loading={working}
                icon={<PlayIcon className="h-4 w-4" aria-hidden />}
                onClick={startRide}>
                
                  Start ride
                </Button>
              }
              {data.status === 'active' &&
              <Link to="/driver/active-ride">
                  <Button block>Go to active ride</Button>
                </Link>
              }
              {['draft', 'scheduled'].includes(data.status) &&
              <Button variant="secondary" block onClick={openEdit}>
                  Edit ride
                </Button>
              }
              {['draft', 'scheduled', 'active'].includes(data.status) &&
              <Button
                variant="ghost"
                block
                className="text-signal-red hover:bg-rose-50"
                onClick={() => setCancelOpen(true)}>
                
                  Cancel ride
                </Button>
              }
              {data.status === 'completed' &&
              <p className="text-sm text-slate-500">
                  This trip is complete. Passenger fares have been finalised.
                </p>
              }
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit ride"
        description="Passengers with a booking are notified of any change.">
        
        <form onSubmit={saveEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Departure date" htmlFor="editDate" required>
              <Input
                id="editDate"
                type="date"
                value={edit.departure_date}
                onChange={(e) => setEdit({ ...edit, departure_date: e.target.value })}
                required />
              
            </Field>
            <Field label="Departure time" htmlFor="editTime" required>
              <Input
                id="editTime"
                type="time"
                value={edit.departure_time}
                onChange={(e) => setEdit({ ...edit, departure_time: e.target.value })}
                required />
              
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total cost" htmlFor="editCost" required>
              <Input
                id="editCost"
                type="number"
                min={1}
                value={edit.total_cost}
                onChange={(e) => setEdit({ ...edit, total_cost: e.target.value })}
                required />
              
            </Field>
            <Field label="Total seats" htmlFor="editSeats" required>
              <Input
                id="editSeats"
                type="number"
                min={1}
                max={6}
                value={edit.total_seats}
                onChange={(e) => setEdit({ ...edit, total_seats: e.target.value })}
                required />
              
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={working}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this ride?"
        description="Every confirmed and pending booking is cancelled and each passenger is notified immediately."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep ride
            </Button>
            <Button variant="danger" loading={working} onClick={cancelRide}>
              Cancel ride
            </Button>
          </>
        } />
      
    </div>);

}