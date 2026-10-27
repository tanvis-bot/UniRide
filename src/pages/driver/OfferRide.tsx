import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangleIcon, SendIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RideMap } from '../../components/map/RideMap';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { coordsFor, places } from '../../data/places';
import { buildRoute } from '../../utils/geo';
import { currency, formatLongDay, formatTime, todayIso } from '../../utils/format';

export function OfferRide() {
  const { verification } = useAuth();
  const navigate = useNavigate();
  const vehicles = useAsync(() => api.vehicles.list(), []);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    departure_date: todayIso(),
    departure_time: '09:00',
    total_seats: '3',
    total_cost: '',
    vehicle_id: '',
    notes: ''
  });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const verified = verification.driver === 'approved';

  const route = useMemo(() => {
    if (!form.source || !form.destination || form.source === form.destination) return null;
    return buildRoute(coordsFor(form.source), coordsFor(form.destination));
  }, [form.source, form.destination]);

  const perSeat =
  form.total_cost && Number(form.total_seats) ?
  Math.round(Number(form.total_cost) / Math.max(1, Number(form.total_seats))) :
  0;

  async function publish(publishRide: boolean) {
    setWorking(true);
    try {
      const sourceCoords = coordsFor(form.source);
const destinationCoords = coordsFor(
  form.destination
);

const ride = await api.rides.create({
  ...form,
  publish: publishRide,
  source_coords: sourceCoords,
  dest_coords: destinationCoords,
  distance_km: route?.distanceKm ?? 0,
  duration_min: route?.durationMin ?? 0,
  route: route?.coordinates ?? []
});
      toast.success(publishRide ? 'Ride published.' : 'Draft saved.');
      navigate(`/driver/rides/${ride.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
      setSummaryOpen(false);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer a ride"
        description="Publish your commute, set the total trip cost and let UniRide split it across confirmed passengers." />
      

      {!verified &&
      <div
        role="status"
        className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 className="font-display text-base font-bold text-amber-900">
                Your driver verification is pending
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                You can offer rides after your documents are approved. Drafts can
                still be saved now.
              </p>
            </div>
          </div>
          <Link to="/driver/verification">
            <Button variant="secondary">Check verification</Button>
          </Link>
        </div>
      }

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Ride details" />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSummaryOpen(true);
            }}>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Source" htmlFor="source" required>
                <Select
                  id="source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  required>
                  
                  <option value="">Select pickup point</option>
                  {places.map((place) =>
                  <option key={place.name} value={place.name}>
                      {place.name}
                    </option>
                  )}
                </Select>
              </Field>
              <Field label="Destination" htmlFor="destination" required>
                <Select
                  id="destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  required>
                  
                  <option value="">Select destination</option>
                  {places.map((place) =>
                  <option key={place.name} value={place.name}>
                      {place.name}
                    </option>
                  )}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Departure date" htmlFor="date" required>
                <Input
                  id="date"
                  type="date"
                  min={todayIso()}
                  value={form.departure_date}
                  onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                  required />
                
              </Field>
              <Field label="Departure time" htmlFor="time" required>
                <Input
                  id="time"
                  type="time"
                  value={form.departure_time}
                  onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                  required />
                
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Available seats" htmlFor="seats" required>
                <Select
                  id="seats"
                  value={form.total_seats}
                  onChange={(e) => setForm({ ...form, total_seats: e.target.value })}>
                  
                  {[1, 2, 3, 4, 5, 6].map((n) =>
                  <option key={n} value={n}>
                      {n} {n === 1 ? 'seat' : 'seats'}
                    </option>
                  )}
                </Select>
              </Field>
              <Field
                label="Estimated total cost"
                htmlFor="cost"
                hint={perSeat ? `About ${currency(perSeat)} per passenger if full` : 'Fuel, tolls and parking'}
                required>
                
                <Input
                  id="cost"
                  type="number"
                  min={1}
                  value={form.total_cost}
                  onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
                  placeholder="420"
                  required />
                
              </Field>
            </div>

            <Field label="Vehicle" htmlFor="vehicle" required>
              {vehicles.loading ?
              <p className="text-sm text-slate-500">Loading vehicles…</p> :
              (vehicles.data ?? []).length === 0 ?
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  No vehicle registered yet.{' '}
                  <Link
                  to="/driver/vehicles"
                  className="font-semibold text-brand-700 hover:underline">
                  
                    Add a vehicle
                  </Link>{' '}
                  to publish a ride.
                </div> :

              <Select
                id="vehicle"
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                required>
                
                  <option value="">Select vehicle</option>
                  {vehicles.data!.map((vehicle) =>
                <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} · {vehicle.number} ({vehicle.seats} seats)
                    </option>
                )}
                </Select>
              }
            </Field>

            <Field label="Notes for passengers" htmlFor="notes">
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Pickup at the main gate, one small bag per passenger." />
              
            </Field>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="submit"
                icon={<SendIcon className="h-4 w-4" aria-hidden />}
                disabled={!verified}>
                
                Review & publish
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={working}
                onClick={() => publish(false)}>
                
                Save draft
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Route preview"
            description={
            route ?
            `${route.distanceKm} km · about ${route.durationMin} min` :
            'Choose a source and destination to preview the route.'
            } />
          
          {route ?
          <RideMap
            source={coordsFor(form.source)}
            destination={coordsFor(form.destination)}
            route={route.coordinates}
            sourceLabel={form.source}
            destinationLabel={form.destination}
            className="h-80" /> :


          <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              Route preview appears here
            </div>
          }
        </Card>
      </div>

      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Ride summary"
        description="Check the details before publishing. Passengers see this immediately."
        footer={
        <>
            <Button variant="secondary" onClick={() => setSummaryOpen(false)}>
              Keep editing
            </Button>
            <Button loading={working} onClick={() => publish(true)}>
              Publish ride
            </Button>
          </>
        }>
        
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Route</dt>
            <dd className="font-semibold text-ink-900">
              {form.source} → {form.destination}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Departure</dt>
            <dd className="font-semibold text-ink-900">
              {form.departure_date && formatLongDay(form.departure_date)} ·{' '}
              {form.departure_time && formatTime(form.departure_time)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Seats</dt>
            <dd className="font-semibold text-ink-900">{form.total_seats}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Total cost</dt>
            <dd className="font-semibold text-ink-900">
              {currency(Number(form.total_cost || 0))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Fare if all seats fill
            </dt>
            <dd className="font-semibold text-brand-700">
              {currency(perSeat)} per passenger
            </dd>
          </div>
        </dl>
      </Modal>

      {working && <LoadingState label="Publishing your ride…" />}
    </div>);

}