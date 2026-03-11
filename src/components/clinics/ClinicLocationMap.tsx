
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Clinic } from '@/types/clinic';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface ClinicLocationMapProps {
  clinic: Clinic;
}

export function ClinicLocationMap({ clinic }: ClinicLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const lat = clinic.lat;
  const lng = clinic.lng;
  const name = clinic.nameAr;
  const address = clinic.addressAr?.replace(//g, '').trim();

  if (!mounted) {
    return (
      <div className="h-96 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-neutral-500">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  // Generate the best possible search query for Google Maps
  let searchQuery = '';
  if (lat && lng) {
    searchQuery = `${lat},${lng}`;
  } else if (name && address) {
    // If no lat/lng, try searching by name and address
    searchQuery = `${name} ${address}`;
  } else if (address) {
    searchQuery = address;
  }

  if (searchQuery) {
    // Using the more reliable "search" endpoint for public embed
    const publicEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    return (
      <div className="h-96 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-200 dark:border-neutral-700 relative z-0">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={publicEmbedUrl}
          title={name}
        />
      </div>
    );
  }

  return (
    <div className="h-96 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-2">📍</div>
        <p className="text-neutral-500">الموقع الجغرافي غير متوفر بدقة حالياً</p>
        <p className="text-sm text-neutral-400 mt-1">{clinic.addressAr}</p>
      </div>
    </div>
  );
}
