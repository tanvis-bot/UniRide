import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MessageSquareIcon,
  NavigationIcon,
  PhoneCallIcon,
  RadioIcon,
  Share2Icon } from
'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { RideMap } from '../../components/map/RideMap';
import { RideStageTimeline } from '../../components/rides/RideStageTimeline';
import { SosButton } from '../../components/safety/SosButton';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { VerifiedBadge } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useLiveRide } from '../../hooks/useLiveRide';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { fromNow, rideStageLabel } from '../../utils/format';

export function ActiveRide() {
  const ride = useAsync(() => api.rides.active(), []);
  const contacts = useAsync(() => api.emergency.list(), []);
  const live = useLiveRide(ride.data);
  const [chatOpen, setChatOpen] = useState(false);

  async function shareTrip(rideId: string) {
    try {
      const share = await api.rides.share(rideId);
      const url = `${window.location.origin}/trip/${share.token}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      toast.success('Live trip link copied', { description: url });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (ride.loading) return <LoadingState label="Checking for an active ride…" />;
  if (ride.error) return <ErrorState message={ride.error} onRetry={ride.refetch} />;
  if (!ride.data)
  return (
    <div className="space-y-6">
        <PageHeader title="Active ride" />
        <EmptyState
        icon={<NavigationIcon className="h-5 w-5" aria-hidden />}
        title="No ride in progress"
        description="When your driver starts the trip, live tracking and the SOS controls appear here."
        action={
        <Link to="/passenger/bookings">
              <Button>View my bookings</Button>
            </Link>
        } />
      
      </div>);


  const data = ride.data;
  const stage = live.stage ?? data.stage;

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
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
              <p className="text-sm text-slate-600">
                {live.updatedAt ?
                `Driver location updated ${fromNow(live.updatedAt)}` :
                'Waiting for the driver to share location…'}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden />
                Live GPS
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Your driver" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={data.driver.full_name} src={data.driver.avatar_url} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-bold text-ink-900">
                      {data.driver.full_name}
                    </p>
                    <VerifiedBadge verified={data.driver.verified} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {data.vehicle ?
                    `${data.vehicle.make} ${data.vehicle.model} · ${data.vehicle.color} · ${data.vehicle.number}` :
                    'Vehicle pending'}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                icon={<MessageSquareIcon className="h-4 w-4" aria-hidden />}
                onClick={() => setChatOpen(true)}>
                
                Chat
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Ride status" />
            <RideStageTimeline stage={stage} />
          </Card>

          <Card>
            <CardHeader title="Safety" description="Available for the whole trip." />
            <div className="space-y-3">
              <SosButton rideId={data.id} />
              <Button
                variant="secondary"
                block
                icon={<Share2Icon className="h-4 w-4" aria-hidden />}
                onClick={() => shareTrip(data.id)}>
                
                Share trip
              </Button>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Emergency contacts
                </p>
                {contacts.loading ?
                <p className="mt-2 text-sm text-slate-500">Loading contacts…</p> :
                (contacts.data ?? []).length === 0 ?
                <div className="mt-2">
                    <p className="text-sm text-slate-500">No contacts saved yet.</p>
                    <Link
                    to="/passenger/emergency-contacts"
                    className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
                    
                      Add a contact
                    </Link>
                  </div> :

                <ul className="mt-2 space-y-2">
                    {contacts.data!.map((contact) =>
                  <li key={contact.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {contact.name}
                          </p>
                          <p className="text-xs text-slate-500">{contact.relationship}</p>
                        </div>
                        <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                          <Button
                        variant="secondary"
                        size="sm"
                        icon={<PhoneCallIcon className="h-4 w-4" aria-hidden />}>
                        
                            Call
                          </Button>
                        </a>
                      </li>
                  )}
                  </ul>
                }
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={`Chat with ${data.driver.full_name}`}
        description="Messaging is limited to people on this ride.">
        
        <ChatPanel
          rideId={data.id}
          participant={data.driver}
          route={`${data.source} → ${data.destination}`}
          online
          className="h-96" />
        
      </Modal>
    </div>);

}