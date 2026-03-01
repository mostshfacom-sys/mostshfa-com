
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { Clinic } from '@/types/clinic';
import { fetchClinics } from '@/lib/api/clinics';

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

interface ClinicInteractiveMapProps {
  clinics: Clinic[];
  onClose: () => void;
}

export function ClinicInteractiveMap({ clinics, onClose }: ClinicInteractiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pointsRef = useRef<Array<[number, number]>>([]);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
     const fetchAll = async () => {
       setLoading(true);
       try {
          const data = await fetchClinics({ limit: 5000 });
          setAllClinics(data.results || []);
        } catch (err) {
         console.error('Failed to fetch clinics for map:', err);
         setAllClinics(clinics); // Fallback to passed clinics
       } finally {
         setLoading(false);
       }
     };
     fetchAll();
   }, [clinics]);

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
    import('leaflet').then((leafletModule) => {
      const leaflet = leafletModule.default || leafletModule;
      setL(leaflet);

      // Fix default icon issue
      // @ts-expect-error Leaflet _getIconUrl type issue
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const filteredClinics = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const source = allClinics.length > 0 ? allClinics : clinics;
    if (!term) return source;
    return source.filter(c =>
      (c.nameAr || '').toLowerCase().includes(term) ||
      (c.nameEn || '').toLowerCase().includes(term)
    );
  }, [allClinics, clinics, searchQuery]);

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: EGYPT_CENTER,
      zoom: 6,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    setMapReady(true);

    // Initial invalidate size
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 500);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      setMapReady(false);
    };
  }, [L]);

  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const validPoints: Array<[number, number]> = [];

    filteredClinics.forEach((clinic) => {
      const lat = clinic.lat;
      const lng = clinic.lng;
      if (typeof lat === 'number' && typeof lng === 'number' && isValidEgyptCoords(lat, lng)) {
        validPoints.push([lat, lng]);
        
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

        const marker = L.marker([lat, lng]);
        marker.bindPopup(popupHtml, { maxWidth: 260 });
        marker.addTo(markersLayerRef.current);
      }
    });

    scheduleMapRefresh(validPoints);
  }, [L, mapReady, filteredClinics]);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">خريطة العيادات التفاعلية</h2>
              <p className="text-xs text-white/80">
                {loading ? 'جاري تحميل البيانات...' : `${filteredClinics.length} عيادة متاحة`}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-neutral-100 dark:bg-neutral-900">
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />
          {/* Search Overlay */}
          <div className="absolute top-4 right-4 z-[400] w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث سريع في الخريطة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border-2 border-transparent focus:border-teal-500 outline-none text-sm font-medium"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            </div>
          </div>

          <div ref={mapRef} className="w-full h-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
