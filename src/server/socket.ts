import { io, Socket } from "socket.io-client";
import type { LatLng } from "../types";

export type SocketEvent =
  | "notification"
  | "chat:message"
  | "ride:location"
  | "ride:status"
  | "booking:update"
  | "sos:triggered"
  | "auth:unauthorized";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

let socketClient: Socket | null = null;
let currentUserId: string | null = null;

export const socket = {
  get connected() {
    return socketClient?.connected ?? false;
  },

  get userId() {
    return currentUserId;
  },

  connect(userId: string) {
    currentUserId = userId;

    if (socketClient) {
      if (!socketClient.connected) {
        socketClient.connect();
      }
      return;
    }

    socketClient = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: true,
    });

    socketClient.on("connect", () => {
      console.log("Socket connected:", socketClient?.id);

      socketClient?.emit("join:user", {
        userId,
      });
    });

    socketClient.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  },

  disconnect() {
    socketClient?.disconnect();
    socketClient = null;
    currentUserId = null;
  },

  join(room: string) {
    socketClient?.emit("join:room", room);
  },

  leave(room: string) {
    socketClient?.emit("leave:room", room);
  },

  on(
    event: SocketEvent,
    listener: (payload: any) => void
  ) {
    socketClient?.on(event, listener);

    return () => socketClient?.off(event, listener);
  },

  off(
    event: SocketEvent,
    listener: (payload: any) => void
  ) {
    socketClient?.off(event, listener);
  },

  emit(
    event: SocketEvent,
    payload: unknown
  ) {
    socketClient?.emit(event, payload);
  },
};

/* ---------------- live location broadcasting ---------------- */

const timers = new Map<string, number>();
const watchers = new Map<string, number>();

export interface LocationBroadcastOptions {
  rideId: string;
  fallbackRoute: LatLng[];
  onUpdate: (coords: LatLng) => void;
}

export function startLocationBroadcast({
  rideId,
  fallbackRoute,
  onUpdate,
}: LocationBroadcastOptions): () => void {
  stopLocationBroadcast(rideId);

  let index = 8;

  const tick = () => {
    if (fallbackRoute.length === 0) return;

    index = Math.min(
      fallbackRoute.length - 1,
      index + 1
    );

    onUpdate(fallbackRoute[index]);
  };

  const timer = window.setInterval(tick, 4000);
  timers.set(rideId, timer);

  if ("geolocation" in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Permission denied — fallback route continues.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    watchers.set(rideId, watchId);
  }

  return () => stopLocationBroadcast(rideId);
}

export function stopLocationBroadcast(
  rideId: string
): void {
  const timer = timers.get(rideId);

  if (timer) {
    window.clearInterval(timer);
    timers.delete(rideId);
  }

  const watchId = watchers.get(rideId);

  if (watchId !== undefined) {
    navigator.geolocation?.clearWatch(watchId);
    watchers.delete(rideId);
  }
}

function stopAllBroadcasts(): void {
  Array.from(timers.keys()).forEach(
    stopLocationBroadcast
  );
}

export function getCurrentPosition(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => resolve(null),
      {
        timeout: 8000,
      }
    );
  });
}