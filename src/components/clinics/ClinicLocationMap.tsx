
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
  // Using name + address is often more reliable for the info panel than raw coordinates
  const searchQuery = name && address ? `${name} ${address}` : (address || `${lat},${lng}`);

  if (searchQuery && (lat || address)) {
    // This format is the most robust for public embeds without an API key
    // Using google.com/maps/search/ instead of google.com/maps?q=
    const publicEmbedUrl = `https://www.google.com/maps/embed/v1/search?key=REPLACE_WITH_YOUR_FREE_GOOGLE_MAPS_EMBED_API_KEY&q=${encodeURIComponent(searchQuery)}&zoom=16`;
    
    // Fallback to a completely public search URL if no API key is provided
    const noKeyEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&output=embed&iwloc=addr`;

    return (
      <div className="h-96 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-200 dark:border-neutral-700 relative z-0">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={noKeyEmbedUrl}
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
