import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { NavigationIcon, RadioIcon, Share2Icon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { RideMap } from '../../components/map/RideMap';
import { RideStageTimeline } from '../../components/rides/RideStageTimeline';
import { SosButton } from '../../components/safety/SosButton';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useLiveRide } from '../../hooks/useLiveRide';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { startLocationBroadcast, stopLocationBroadcast } from '../../server/socket';
import { currency, fromNow, rideStageLabel } from '../../utils/format';

const nextStage: Record<string, string> = {
  starting_soon: 'driver_on_the_way',
  driver_on_the_way: 'ride_started',
  ride_started: 'in_progress',
  in_progress: 'arriving',
  arriving: 'completed'
};

export function DriverActiveRide() {
  const ride = useAsync(() => api.rides.active(), []);
  const live = useLiveRide(ride.data);
  const [sharing, setSharing] = useState(false);
  const [working, setWorking] = useState(false);
  const rideId = ride.data?.id;
  const passengers = useAsync(
    () => rideId ? api.rides.passengers(rideId) : Promise.resolve([]),
    [rideId]
  );

  useEffect(() => {
    if (!ride.data || !sharing) return;
    const stop = startLocationBroadcast({
      rideId: ride.data.id,
      fallbackRoute: ride.data.route,
      onUpdate: (coords) => {
        api.rides.pushLocation(ride.data!.id, coords).catch(() => undefined);
      }
    });
    return () => {
      stop();
      stopLocationBroadcast(ride.data!.id);
    };
  }, [ride.data, sharing]);

  if (ride.loading) return <LoadingState label="Checking for an active ride…" />;
  if (ride.error) return <ErrorState message={ride.error} onRetry={ride.refetch} />;
  if (!ride.data)
  return (
    <div className="space-y-6">
        <PageHeader title="Active ride" />
        <EmptyState
        icon={<NavigationIcon className="h-5 w-5" aria-hidden />}
        title="No ride in progress"
        description="Start a scheduled ride from My Rides to begin sharing your location."
        action={
        <Link to="/driver/rides">
              <Button>Go to my rides</Button>
            </Link>
        } />
      
      </div>);


  const data = ride.data;
  const stage = live.stage ?? data.stage;

  async function advance() {
    const next = nextStage[stage];
    if (!next) return;
    setWorking(true);
    try {
      await api.rides.setStage(data.id, next);
      toast.success(
        next === 'completed' ? 'Ride completed.' : `Status set to ${rideStageLabel[next]}.`
      );
      if (next === 'completed') {
        setSharing(false);
        stopLocationBroadcast(data.id);
      }
      ride.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function shareTrip() {
    try {
      const share = await api.rides.share(data.id);
      const url = `${window.location.origin}/trip/${share.token}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      toast.success('Live trip link copied', { description: url });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-signal-red px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            <RadioIcon className="h-3.5 w-3.5" aria-hidden />
            Live ride
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
            {data.source} → {data.destination}
          </h1>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {rideStageLabel[stage] ?? 'In progress'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card padded={false} className="overflow-hidden">
            <RideMap
              source={data.source_coords}
              destination={data.dest_coords}
              route={data.route}
              driverLocation={live.location}
              sourceLabel={data.source}
              destinationLabel={data.destination}
              className="h-[26rem] rounded-none border-0" />
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
              <p className="text-sm text-slate-600">
                {live.updatedAt ?
                `Driver location updated ${fromNow(live.updatedAt)}` :
                'Location sharing is off.'}
              </p>
              <Button
                size="sm"
                variant={sharing ? 'secondary' : 'primary'}
                onClick={() => setSharing((v) => !v)}>
                
                {sharing ? 'Stop sharing location' : 'Share my location'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Passengers on board"
              description="Confirmed riders for this trip." />
            
            {passengers.loading ?
            <LoadingState label="Loading passengers…" /> :
            (passengers.data ?? []).length === 0 ?
            <EmptyState title="No confirmed passengers" /> :

            <ul className="divide-y divide-slate-100">
                {passengers.data!.map((row) =>
              <li
                key={row.booking.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                
                    <div className="flex items-center gap-3">
                      <Avatar
                    name={row.passenger.full_name}
                    src={row.passenger.avatar_url}
                    size="sm" />
                  
                      <div>
                        <p className="font-semibold text-ink-900">
                          {row.passenger.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{row.passenger.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Ride status" />
            <RideStageTimeline stage={stage} />
            {nextStage[stage] &&
            <Button block className="mt-4" loading={working} onClick={advance}>
                {nextStage[stage] === 'completed' ?
              'Complete ride' :
              `Mark as ${rideStageLabel[nextStage[stage]].toLowerCase()}`}
              </Button>
            }
          </Card>

          <Card>
            <CardHeader title="Safety" />
            <div className="space-y-3">
              <SosButton rideId={data.id} />
              <Button
                variant="secondary"
                block
                icon={<Share2Icon className="h-4 w-4" aria-hidden />}
                onClick={shareTrip}>
                
                Share trip link
              </Button>
              <Link to="/driver/messages">
                <Button variant="secondary" block>
                  Message passengers
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}