'use client';

import { MapContainer, type MapMarker } from '@/components/maps/MapContainer';

interface DoctorWorkplaceMapProps {
  marker: MapMarker;
}

export default function DoctorWorkplaceMap({ marker }: DoctorWorkplaceMapProps) {
  return (
    <MapContainer
      markers={[marker]}
      center={{ lat: marker.lat, lng: marker.lng }}
      zoom={14}
      height="360px"
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      showDirections
    />
  );
}
