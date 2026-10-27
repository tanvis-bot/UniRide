import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheckIcon } from 'lucide-react';

import { RideMap } from '../components/map/RideMap';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Status';
import { ErrorState, LoadingState } from '../components/ui/States';
import { Logo } from '../components/layout/Logo';

import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { socket } from '../server/socket';

import {
  formatLongDay,
  formatTime,
  fromNow,
  rideStageLabel,
} from '../utils/format';

export function TripShare() {
  const { token = '' } = useParams();

  const trip = useAsync(
    () => api.trips.share(token),
    [token]
  );

  const [driverLocation, setDriverLocation] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  const [locationUpdatedAt, setLocationUpdatedAt] =
    useState<string | null>(null);

  useEffect(() => {
    if (!trip.data?.ride) return;

    setDriverLocation(
      trip.data.ride.driver_location ?? null
    );

    setLocationUpdatedAt(
      trip.data.ride.location_updated_at ?? null
    );
  }, [trip.data]);

  useEffect(() => {
    const rideId = trip.data?.ride?.id;

    if (!rideId) return;

    const room = `ride:${rideId}`;

    socket.join(room);

    const offLocation = socket.on(
      'ride:location',
      (payload: any) => {
        if (
          String(payload?.rideId) !==
          String(rideId)
        ) {
          return;
        }

        if (
          !Number.isFinite(Number(payload.lat)) ||
          !Number.isFinite(Number(payload.lng))
        ) {
          return;
        }

        setDriverLocation({
          lat: Number(payload.lat),
          lng: Number(payload.lng),
        });

        setLocationUpdatedAt(
          payload.location_updated_at ??
            new Date().toISOString()
        );
      }
    );

    return () => {
      offLocation();
      socket.leave(room);
    };
  }, [trip.data?.ride?.id]);

  if (trip.loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <Logo />
            <Badge tone="neutral">
              Shared trip · read only
            </Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <LoadingState label="Loading shared trip…" />
        </main>
      </div>
    );
  }

  if (trip.error || !trip.data?.ride) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <Logo />
            <Badge tone="neutral">
              Shared trip · read only
            </Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <ErrorState
            message={
              trip.error ||
              'This shared trip could not be loaded.'
            }
          />
        </main>
      </div>
    );
  }

  const ride = trip.data.ride;

  const statusLabel =
    rideStageLabel[ride.stage] ??
    ride.status;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />

          <Badge tone="neutral">
            Shared trip · read only
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-6">

          {/* Trip heading */}
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
              {ride.source} → {ride.destination}
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              {formatLongDay(ride.departure_date)} at{' '}
              {formatTime(ride.departure_time)} ·{' '}
              {statusLabel}
            </p>
          </div>

          {/* Map */}
          <Card
            padded={false}
            className="overflow-hidden"
          >
            <RideMap
              source={ride.source_coords}
              destination={ride.dest_coords}
              route={ride.route}
              driverLocation={driverLocation}
              sourceLabel={ride.source}
              destinationLabel={ride.destination}
              className="h-[24rem] rounded-none border-0"
            />

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-sm text-slate-600">
                {locationUpdatedAt
                  ? `Driver location updated ${fromNow(
                      locationUpdatedAt
                    )}`
                  : 'Live location is not being shared right now.'}
              </p>

              {driverLocation && (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live GPS
                </div>
              )}
            </div>
          </Card>

          {/* Trip status */}
          <Card>
            <CardHeader title="Trip status" />

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                tone={
                  ride.status === 'completed'
                    ? 'success'
                    : ride.status === 'in_progress'
                      ? 'success'
                      : 'neutral'
                }
              >
                {statusLabel}
              </Badge>

              {ride.status === 'in_progress' && (
                <span className="text-sm text-emerald-600">
                  Trip is currently active
                </span>
              )}

              {ride.status === 'completed' && (
                <span className="text-sm text-slate-600">
                  Trip completed
                </span>
              )}
            </div>
          </Card>

          {/* Driver and vehicle */}
          <Card>
            <CardHeader title="Driver and vehicle" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={ride.driver.full_name}
                  src={ride.driver.avatar_url}
                />

                <div>
                  <p className="font-semibold text-ink-900">
                    {ride.driver.full_name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {ride.vehicle
                      ? `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.color} · ${ride.vehicle.number}`
                      : 'Vehicle pending'}
                  </p>
                </div>
              </div>

              {ride.driver.verified && (
                <Badge tone="success">
                  <ShieldCheckIcon
                    className="h-3.5 w-3.5"
                    aria-hidden
                  />
                  Verified driver
                </Badge>
              )}
            </div>

            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              This link shows the trip route, status,
              live driver location and driver details.
              Personal contact details of passengers are
              never shared.
            </p>
          </Card>

          {/* About UniRide */}
          <div className="flex justify-center">
            <Link to="/">
              <Button variant="secondary">
                About UniRide
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}