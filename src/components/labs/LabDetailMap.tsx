'use client';

import { MapContainer, type MapMarker } from '@/components/maps/MapContainer';

interface LabDetailMapProps {
  id: number;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  address?: string | null;
  rating?: number | null;
}

export default function LabDetailMap({
  id,
  name,
  slug,
  lat,
  lng,
  address,
  rating,
}: LabDetailMapProps) {
  const marker: MapMarker = {
    id: `lab-${id}`,
    name,
    type: 'lab',
    lat,
    lng,
    slug,
    address: address || undefined,
    rating: typeof rating === 'number' ? rating : undefined,
  };

  return (
    <MapContainer
      markers={[marker]}
      center={{ lat, lng }}
      zoom={14}
      height="360px"
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      showDirections
    />
  );
}
