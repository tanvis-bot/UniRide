import type { LatLng } from '../types';

const R = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h =
  Math.sin(dLat / 2) ** 2 +
  Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Stand-in for an OpenRouteService `directions` response. Produces a plausible
 * road-like polyline between two points plus distance and duration estimates.
 * Swap `buildRoute` for a real ORS fetch without touching any caller.
 */
export interface RouteResult {
  coordinates: LatLng[];
  distanceKm: number;
  durationMin: number;
}

export function buildRoute(from: LatLng, to: LatLng): RouteResult {
  const steps = 40;
  const straight = haversineKm(from, to);
  const coordinates: LatLng[] = [];
  // deterministic pseudo-random wobble so the same route always renders the same
  const seed = Math.abs(from.lat * 1000 + to.lng * 1000);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bend = Math.sin(t * Math.PI) * 0.012;
    const jitter = Math.sin(t * 9 + seed) * 0.0016;
    coordinates.push({
      lat: from.lat + (to.lat - from.lat) * t + bend * 0.6 + jitter,
      lng: from.lng + (to.lng - from.lng) * t - bend + jitter * 0.5
    });
  }
  const distanceKm = Math.round(straight * 1.32 * 10) / 10;
  const durationMin = Math.max(8, Math.round(distanceKm / 26 * 60));
  return { coordinates, distanceKm, durationMin };
}

/** Point on the route for a given progress ratio (used for live tracking). */
export function pointAlongRoute(route: LatLng[], progress: number): LatLng {
  const clamped = Math.min(0.999, Math.max(0, progress));
  const idx = Math.floor(clamped * (route.length - 1));
  return route[idx];
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}