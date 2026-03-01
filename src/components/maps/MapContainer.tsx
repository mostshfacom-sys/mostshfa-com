'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export type EntityType = 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'ambulance';

export interface MapMarker {
  id: string;
  name: string;
  type: EntityType;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  slug?: string;
  phone?: string;
  isOpen?: boolean;
}

interface MapContainerProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  showDirections?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  enableLocationPick?: boolean;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  className?: string;
  height?: string;
}

export function MapContainer({
  markers,
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo default
  zoom = 12,
  onMarkerClick,
  showDirections = false,
  userLocation,
  enableLocationPick = false,
  onMapClick,
  className = '',
  height = '400px',
}: MapContainerProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const getMarkerIcon = (type: EntityType): string => {
    const icons: Record<EntityType, string> = {
      hospital: '🏥',
      clinic: '🏨',
      lab: '🔬',
      pharmacy: '💊',
      ambulance: '🚑',
    };
    return icons[type] || '📍';
  };

  const getMarkerColor = (type: EntityType): string => {
    const colors: Record<EntityType, string> = {
      hospital: 'bg-red-500',
      clinic: 'bg-blue-500',
      lab: 'bg-purple-500',
      pharmacy: 'bg-green-500',
      ambulance: 'bg-red-600',
    };
    return colors[type] || 'bg-gray-500';
  };

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    setMapCenter({ lat: marker.lat, lng: marker.lng });
    onMarkerClick?.(marker);
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom?.() ?? zoom;
      const nextZoom = Math.max(currentZoom, 14);
      mapInstanceRef.current.setView([marker.lat, marker.lng], nextZoom, { animate: true });
    }
  }, [onMarkerClick, zoom]);

  const openInGoogleMaps = (marker: MapMarker) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`;
    window.open(url, '_blank');
  };

  const getDirections = (marker: MapMarker) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${marker.lat},${marker.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;
      window.open(url, '_blank');
    }
  };

  const closePopup = () => setSelectedMarker(null);

  useEffect(() => {
    setMapCenter(center);
  }, [center.lat, center.lng]);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom,
    });
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => map.invalidateSize(), 0);
    setTimeout(() => map.invalidateSize(), 350);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [L, mapCenter.lat, mapCenter.lng, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!enableLocationPick || !onMapClick) return;

    const handleClick = (event: any) => {
      if (!event?.latlng) return;
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [enableLocationPick, onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || markers.length > 0) return;
    mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: false });
  }, [mapCenter.lat, mapCenter.lng, zoom, markers.length]);

  useEffect(() => {
    if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    const points: Array<[number, number]> = [];

    const typeColors: Record<EntityType, string> = {
      hospital: '#ef4444',
      clinic: '#3b82f6',
      lab: '#a855f7',
      pharmacy: '#22c55e',
      ambulance: '#dc2626',
    };

    markers.forEach((marker) => {
      const lat = Number.isFinite(marker.lat) ? marker.lat : parseFloat(String(marker.lat));
      const lng = Number.isFinite(marker.lng) ? marker.lng : parseFloat(String(marker.lng));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const position: [number, number] = [lat, lng];
      points.push(position);
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="width:32px;height:32px;border-radius:9999px;background:${typeColors[marker.type] || '#6b7280'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;border:2px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,0.2);">${getMarkerIcon(marker.type)}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30],
      });

      const leafletMarker = L.marker(position, { icon });
      const popupHtml = `
        <div style="min-width:200px">
          <h3 style="font-weight:700;font-size:1rem;margin:0 0 6px;">${escapeHtml(marker.name)}</h3>
          ${marker.address ? `<p style="margin:0 0 6px;color:#4b5563;font-size:0.875rem;">📍 ${escapeHtml(marker.address)}</p>` : ''}
          ${marker.rating ? `<p style="margin:0 0 6px;color:#f59e0b;font-size:0.875rem;">⭐ ${marker.rating.toFixed(1)}</p>` : ''}
          ${marker.slug ? `<a href="/${marker.type}s/${marker.slug}" style="display:block;text-align:center;padding:6px 10px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600;">عرض التفاصيل</a>` : ''}
        </div>
      `;
      leafletMarker.bindPopup(popupHtml, { maxWidth: 260 });
      leafletMarker.on('click', () => handleMarkerClick(marker));
      leafletMarker.addTo(markersLayerRef.current);
    });

    if (userLocation) {
      const userPoint: [number, number] = [userLocation.lat, userLocation.lng];
      points.push(userPoint);
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker(userPoint, {
          radius: 6,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(mapInstanceRef.current);
      } else {
        userMarkerRef.current.setLatLng(userPoint);
      }
    } else if (userMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: false });
    } else {
      map.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: false });
    }

    setTimeout(() => map.invalidateSize(), 0);
  }, [L, markers, userLocation, mapCenter.lat, mapCenter.lng, zoom, handleMarkerClick]);
  if (!mounted || !L) {
    return (
      <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-gray-600">
            <div className="text-4xl animate-pulse">🗺️</div>
            <p className="mt-2 text-sm">جاري تحميل الخريطة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
      />
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Map Header */}
      <div className="absolute top-3 right-3 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-md px-2.5 py-1 shadow-md flex items-center gap-1.5 text-[11px] sm:text-sm whitespace-nowrap">
          <span className="font-semibold text-gray-800">🗺️ خريطة المواقع</span>
          <span className="text-gray-600">({markers.length})</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-md px-2 py-2 shadow-md text-gray-700 w-28 sm:w-32">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">دليل الرموز</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 text-gray-700">
              <span>🏥</span><span>مستشفى</span>
            </div>
            <div className="flex items-center gap-1 text-gray-700">
              <span>🏨</span><span>عيادة</span>
            </div>
            <div className="flex items-center gap-1 text-gray-700">
              <span>🔬</span><span>معمل</span>
            </div>
            <div className="flex items-center gap-1 text-gray-700">
              <span>💊</span><span>صيدلية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Marker Popup */}
      {selectedMarker && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 bg-white rounded-xl shadow-2xl p-3 sm:p-4 animate-slideUp">
          <button
            onClick={closePopup}
            className="absolute top-2 left-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600"
            type="button"
          >
            ×
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${getMarkerColor(selectedMarker.type)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-xl sm:text-2xl">{getMarkerIcon(selectedMarker.type)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 text-lg truncate">{selectedMarker.name}</h4>
              {selectedMarker.address && (
                <p className="text-sm text-gray-600 mt-1 truncate">📍 {selectedMarker.address}</p>
              )}
              {selectedMarker.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-medium">{selectedMarker.rating.toFixed(1)}</span>
                </div>
              )}
              {selectedMarker.isOpen !== undefined && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedMarker.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedMarker.isOpen ? 'مفتوح الآن' : 'مغلق'}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {selectedMarker.slug && (
              <Link
                href={`/${selectedMarker.type}s/${selectedMarker.slug}`}
                className="w-full sm:flex-1 bg-primary text-white text-center py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                عرض التفاصيل
              </Link>
            )}
            <button
              onClick={() => openInGoogleMaps(selectedMarker)}
              className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              type="button"
            >
              🗺️ فتح في الخريطة
            </button>
            {showDirections && (
              <button
                onClick={() => getDirections(selectedMarker)}
                className="w-full sm:flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                type="button"
              >
                🧭 الاتجاهات
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <span className="text-6xl">🗺️</span>
            <p className="mt-4 text-gray-600">لا توجد مواقع للعرض</p>
          </div>
        </div>
      )}
    </div>
  );
}
