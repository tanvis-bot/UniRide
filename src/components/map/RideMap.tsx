import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap } from
'react-leaflet';
import type { LatLng } from '../../types';

interface RideMapProps {
  source: LatLng;
  destination: LatLng;
  route?: LatLng[];
  driverLocation?: LatLng | null;
  sourceLabel?: string;
  destinationLabel?: string;
  className?: string;
  interactive?: boolean;
}

function pinIcon(color: string, glyph: string) {
  return L.divIcon({
    className: 'uniride-marker',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:${color};color:#fff;font:600 11px/1 Inter,sans-serif;box-shadow:0 2px 8px rgba(11,20,36,.35);border:2px solid #fff">${glyph}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

function carIcon() {
  return L.divIcon({
    className: 'uniride-marker',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:#0B1424;border:3px solid #35C997;box-shadow:0 4px 14px rgba(11,20,36,.4)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H6.34a3 3 0 0 0-2.91 2.27l-1.07 4.27c-.24.958-.24 1.961 0 2.92L3 17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>
    </span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function FitBounds({ points }: {points: LatLng[];}) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(
      points.map((p) => [p.lat, p.lng]) as [number, number][],
      { padding: [36, 36] }
    );
  }, [map, points]);
  return null;
}

export function RideMap({
  source,
  destination,
  route = [],
  driverLocation,
  sourceLabel = 'Pickup',
  destinationLabel = 'Drop',
  className = 'h-72',
  interactive = true
}: RideMapProps) {
  const line = useMemo(
    () => route.length ? route : [source, destination],
    [route, source, destination]
  );
  const bounds = useMemo(
    () => driverLocation ? [...line, driverLocation] : line,
    [line, driverLocation]
  );

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      
      <MapContainer
        center={[source.lat, source.lng]}
        zoom={12}
        scrollWheelZoom={false}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl
        style={{ height: '100%', width: '100%' }}>
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        
        <Polyline
          positions={line.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: '#068C67', weight: 5, opacity: 0.9 }} />
        
        <Marker position={[source.lat, source.lng]} icon={pinIcon('#0B1424', 'A')}>
          <Tooltip direction="top">{sourceLabel}</Tooltip>
        </Marker>
        <Marker
          position={[destination.lat, destination.lng]}
          icon={pinIcon('#068C67', 'B')}>
          
          <Tooltip direction="top">{destinationLabel}</Tooltip>
        </Marker>
        {driverLocation &&
        <Marker
          position={[driverLocation.lat, driverLocation.lng]}
          icon={carIcon()}>
          
            <Tooltip direction="top">Driver location</Tooltip>
          </Marker>
        }
        <FitBounds points={bounds} />
      </MapContainer>
    </div>);

}