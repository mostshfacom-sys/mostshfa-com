
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
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    // Load Leaflet dynamically
    import('leaflet').then((leafletModule) => {
      const leaflet = leafletModule.default || leafletModule;
      setL(leaflet);

      // Fix default icon issue
      // @ts-expect-error Leaflet type mismatch on _getIconUrl
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const lat = clinic.lat ?? 30.0444; // Default to Cairo
  const lng = clinic.lng ?? 31.2357;
  const position: [number, number] = [lat, lng];

  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView(position, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerRef.current = L.marker(position).addTo(map);
    setMapReady(true);
    
    // Invalidate size to fix rendering issues
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]); // Run once when L is loaded

  // Update marker when clinic changes
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markerRef.current) return;

    const map = mapInstanceRef.current;
    const marker = markerRef.current;

    map.setView(position);
    marker.setLatLng(position);

    const address = clinic.addressAr 
      ? `📌 ${escapeHtml(clinic.addressAr)}` 
      : `📌 ${escapeHtml([clinic.governorate?.nameAr, clinic.city?.nameAr].filter(Boolean).join(' - '))}`;
      
    const phone = clinic.phone 
      ? `<a href="tel:${escapeHtml(clinic.phone)}" style="display:block;text-align:center;padding:8px 12px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:600;margin-top:8px;">اتصل الآن</a>` 
      : '';

    const popupHtml = `
      <div style="min-width:200px;font-family:sans-serif;direction:rtl;text-align:right;">
        <h3 style="font-weight:700;font-size:1rem;margin:0 0 8px;color:#111827;">
          ${escapeHtml(clinic.nameAr)}
        </h3>
        <p style="margin:0 0 4px;color:#4b5563;font-size:0.875rem;">
          ${address}
        </p>
        ${phone}
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 260 });
  }, [L, clinic, position]);

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

  return (
    <div className="h-96 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-200 dark:border-neutral-700 relative z-0">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
