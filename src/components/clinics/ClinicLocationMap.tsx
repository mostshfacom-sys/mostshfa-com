
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

  // If we have coordinates, use Google Maps Embed for better street detail
  if (lat && lng) {
    const q = `${lat},${lng}`;
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_YOUR_FREE_GOOGLE_MAPS_EMBED_API_KEY&q=${q}&zoom=16`;
    
    // Note: Google Maps Embed API is free but technically requires an API Key. 
    // However, Google allows a simpler "View" mode via search query which is public.
    const publicEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

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
        />
      </div>
    );
  }

  // Fallback if no coordinates (keep existing Cairo default or message)
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
