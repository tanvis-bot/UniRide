import type { LatLng } from '../types';

export interface Place {
  name: string;
  coords: LatLng;
}

export const places: Place[] = [
{ name: 'University Main Gate', coords: { lat: 18.5535, lng: 73.8256 } },
{ name: 'Hinjewadi Phase 1', coords: { lat: 18.5913, lng: 73.7389 } },
{ name: 'Kothrud Depot', coords: { lat: 18.5074, lng: 73.8077 } },
{ name: 'Viman Nagar', coords: { lat: 18.5679, lng: 73.9143 } },
{ name: 'City Railway Station', coords: { lat: 18.5286, lng: 73.8748 } },
{ name: 'Wakad Bridge', coords: { lat: 18.5985, lng: 73.7626 } },
{ name: 'Baner Road', coords: { lat: 18.559, lng: 73.7868 } },
{ name: 'MG Road Camp', coords: { lat: 18.5145, lng: 73.8785 } },
{ name: 'Katraj Chowk', coords: { lat: 18.4483, lng: 73.857 } },
{ name: 'Magarpatta City', coords: { lat: 18.5158, lng: 73.9276 } },
{ name: 'Engineering College Campus', coords: { lat: 18.5307, lng: 73.8567 } },
{ name: 'Airport Terminal', coords: { lat: 18.5793, lng: 73.9089 } }];


export function findPlace(name: string): Place | undefined {
  return places.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
}

export function coordsFor(name: string): LatLng {
  return findPlace(name)?.coords ?? { lat: 18.5204, lng: 73.8567 };
}