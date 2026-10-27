import { useEffect, useState } from 'react';
import type { LatLng } from '../types';
import { socket } from '../server/socket';
import type { HydratedRide } from '../services/api';

interface LiveRideState {
  location: LatLng | null;
  updatedAt: string | null;
  stage: string | null;
}

export function useLiveRide(
  ride: HydratedRide | null | undefined
): LiveRideState {
  const [state, setState] = useState<LiveRideState>({
    location: ride?.driver_location ?? null,
    updatedAt: ride?.location_updated_at ?? null,
    stage: ride?.stage ?? null,
  });

  useEffect(() => {
    setState({
      location: ride?.driver_location ?? null,
      updatedAt: ride?.location_updated_at ?? null,
      stage: ride?.stage ?? null,
    });
  }, [
    ride?.id,
    ride?.driver_location,
    ride?.location_updated_at,
    ride?.stage,
  ]);

  useEffect(() => {
    if (!ride) return;

    socket.join(`ride:${ride.id}`);

    const offLocation = socket.on(
      'ride:location',
      (payload: any) => {
        if (String(payload.rideId) !== String(ride.id)) {
          return;
        }

        setState((prev) => ({
          ...prev,
          location: {
            lat: Number(payload.lat),
            lng: Number(payload.lng),
          },
          updatedAt: payload.location_updated_at ?? null,
        }));
      }
    );

    const offStatus = socket.on(
      'ride:status',
      (payload: HydratedRide) => {
        if (String(payload.id) !== String(ride.id)) {
          return;
        }

        setState((prev) => ({
          ...prev,
          stage: payload.stage,
        }));
      }
    );

    return () => {
      offLocation();
      offStatus();
      socket.leave(`ride:${ride.id}`);
    };
  }, [ride?.id]);

  return state;
}