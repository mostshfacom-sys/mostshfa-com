
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { Hospital } from '@/types/hospital';

const EGYPT_CENTER: [number, number] = [26.8206, 30.8025];
const EGYPT_BOUNDS = {
  minLat: 22,
  maxLat: 32,
  minLng: 24,
  maxLng: 37,
};

const isValidEgyptCoords = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= EGYPT_BOUNDS.minLat &&
  lat <= EGYPT_BOUNDS.maxLat &&
  lng >= EGYPT_BOUNDS.minLng &&
  lng <= EGYPT_BOUNDS.maxLng;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface InteractiveMapProps {
  hospitals: Hospital[];
  onClose: () => void;
}

export function InteractiveMap({ hospitals, onClose }: InteractiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pointsRef = useRef<Array<[number, number]>>([]);
  const refreshTimeoutRef = useRef<number | null>(null);

  const scheduleMapRefresh = (points: Array<[number, number]>) => {
    if (!mapInstanceRef.current || !mapRef.current) return;
    pointsRef.current = points;
    let attempts = 0;
    const refresh = () => {
      if (!mapInstanceRef.current || !mapRef.current) return;
      const { clientWidth, clientHeight } = mapRef.current;
      if ((clientWidth === 0 || clientHeight === 0) && attempts < 12) {
        attempts += 1;
        requestAnimationFrame(refresh);
        return;
      }

      const map = mapInstanceRef.current;
      map.invalidateSize();
      if (points.length > 0 && L) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, animate: false });
      } else {
        map.setView(EGYPT_CENTER, 6, { animate: false });
      }
    };

    requestAnimationFrame(refresh);
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(refresh, 450);
  };

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

  const filteredHospitals = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return hospitals;
    return hospitals.filter(h =>
      (h.name_ar || '').toLowerCase().includes(term) ||
      (h.name_en || '').toLowerCase().includes(term)
    );
  }, [hospitals, searchQuery]);

  const hospitalPositions = useMemo(() => {
    const positions = new Map<number, [number, number]>();
    hospitals.forEach((hospital) => {
      const lat = typeof hospital.lat === 'number' ? hospital.lat : parseFloat(String(hospital.lat ?? ''));
      const lng = typeof hospital.lng === 'number' ? hospital.lng : parseFloat(String(hospital.lng ?? ''));
      if (isValidEgyptCoords(lat, lng)) {
        positions.set(hospital.id, [lat, lng]);
      } else {
        positions.set(hospital.id, [
          EGYPT_CENTER[0] + (Math.random() - 0.5) * 4,
          EGYPT_CENTER[1] + (Math.random() - 0.5) * 4,
        ]);
      }
    });
    return positions;
  }, [hospitals]);

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;
    let rafId = 0;

    const initMap = () => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      const { clientWidth, clientHeight } = mapRef.current;
      if (clientWidth === 0 || clientHeight === 0) {
        rafId = requestAnimationFrame(initMap);
        return;
      }

      const map = L.map(mapRef.current, { center: EGYPT_CENTER, zoom: 6 });
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    };

    rafId = requestAnimationFrame(initMap);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      setMapReady(false);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [L]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      scheduleMapRefresh(pointsRef.current);
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!L || !mapReady || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const points: Array<[number, number]> = [];

    filteredHospitals.forEach((hospital) => {
      const position = hospitalPositions.get(hospital.id) ?? EGYPT_CENTER;
      const marker = L.marker(position);
      points.push(position);
      const typeLabel = hospital.hospital_type_name_ar || hospital.type_name || '';
      const locationLabel = [hospital.governorate_name, hospital.city_name]
        .filter(Boolean)
        .join(' - ');
      const popupHtml = `
        <div style="min-width:200px">
          <h3 style="font-weight:700;font-size:1rem;margin:0 0 8px;">
            ${escapeHtml(String(hospital.name_ar || ''))}
          </h3>
          ${typeLabel ? `<p style="margin:0 0 4px;color:#4b5563;font-size:0.875rem;">📍 ${escapeHtml(String(typeLabel))}</p>` : ''}
          ${locationLabel ? `<p style="margin:0 0 8px;color:#4b5563;font-size:0.875rem;">📌 ${escapeHtml(String(locationLabel))}</p>` : ''}
          <a href="/hospitals-pro/${hospital.id}" style="display:block;text-align:center;padding:8px 12px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:0.875rem;font-weight:600;">
            عرض التفاصيل
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.addTo(markersLayerRef.current);
    });

    scheduleMapRefresh(points);
  }, [L, mapReady, filteredHospitals, hospitalPositions]);

  if (!mounted || !L) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-2xl">
          <div className="animate-pulse text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <p className="text-neutral-600 dark:text-neutral-400">جاري تحميل الخريطة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="absolute inset-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onAnimationComplete={() => {
          const points = filteredHospitals.map((hospital) =>
            hospitalPositions.get(hospital.id) ?? EGYPT_CENTER
          );
          scheduleMapRefresh(points);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">خريطة المستشفيات التفاعلية</h2>
              <p className="text-white/80 text-sm">{filteredHospitals.length} مستشفى</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث على الخريطة..."
                className="w-64 px-4 py-2 pr-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          />
          <div ref={mapRef} className="h-full w-full z-0" />
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-neutral-600 dark:text-neutral-400">المستشفيات</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-teal-600" />
              <span className="text-neutral-600 dark:text-neutral-400">اضغط على العلامة للتفاصيل</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
