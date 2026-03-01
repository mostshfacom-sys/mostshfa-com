'use client';

import { useEffect, useRef, useState } from 'react';
import type { Hospital } from '@/types/hospital';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface HospitalLocationMapProps {
  hospital: Hospital;
}

export function HospitalLocationMap({ hospital }: HospitalLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    // Load Leaflet
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);

      // Fix default icon issue
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const lat = typeof hospital.lat === 'number' ? hospital.lat : parseFloat(String(hospital.lat ?? ''));
  const lng = typeof hospital.lng === 'number' ? hospital.lng : parseFloat(String(hospital.lng ?? ''));
  const position: [number, number] = Number.isFinite(lat) && Number.isFinite(lng)
    ? [lat, lng]
    : [26.8206 + Math.random() * 5, 30.8025 + Math.random() * 5];

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: position, zoom: 13 });
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markerRef.current = L.marker(position).addTo(map);
    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
  }, [L]);

  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.setView(position);
    markerRef.current.setLatLng(position);

    const popupHtml = `
      <div style="min-width:200px">
        <h3 style="font-weight:700;font-size:1rem;margin:0 0 8px;">
          ${escapeHtml(String(hospital.name_ar || ''))}
        </h3>
        ${hospital.hospital_type_name_ar ? `<p style="margin:0 0 4px;color:#4b5563;font-size:0.875rem;">📍 ${escapeHtml(String(hospital.hospital_type_name_ar))}</p>` : ''}
        ${hospital.address ? `<p style="margin:0 0 8px;color:#4b5563;font-size:0.875rem;">📌 ${escapeHtml(String(hospital.address))}</p>` : ''}
        ${hospital.phone ? `<a href="tel:${escapeHtml(String(hospital.phone))}" style="display:block;text-align:center;padding:8px 12px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:600;">اتصل الآن</a>` : ''}
      </div>
    `;

    markerRef.current.bindPopup(popupHtml, { maxWidth: 260 });
  }, [L, mapReady, position, hospital]);

  if (!mounted || !L) {
    return (
      <div className="h-96 bg-neutral-200 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-2">🗺️</div>
          <p className="text-neutral-600 dark:text-neutral-400">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-300 dark:border-neutral-600">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
      />
      <div ref={mapRef} className="h-full w-full z-0" />
    </div>
  );
}
