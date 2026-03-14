'use client';

import { useState } from 'react';
import { MapMarker, EntityType } from './MapContainer';

interface DirectionsPanelProps {
  destination: MapMarker | null;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
}

export function DirectionsPanel({
  destination,
  userLocation,
  onClose,
}: DirectionsPanelProps) {
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit'>('driving');
  const [loading, setLoading] = useState(false);

  const travelModes = [
    { id: 'driving', label: 'سيارة', icon: '🚗' },
    { id: 'walking', label: 'مشي', icon: '🚶' },
    { id: 'transit', label: 'مواصلات', icon: '🚌' },
  ] as const;

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

  const openGoogleMapsDirections = () => {
    if (!destination) return;

    let url = 'https://www.google.com/maps/dir/?api=1';
    
    if (userLocation) {
      url += `&origin=${userLocation.lat},${userLocation.lng}`;
    }
    
    url += `&destination=${destination.lat},${destination.lng}`;
    url += `&travelmode=${travelMode}`;
    
    window.open(url, '_blank');
  };

  const copyAddress = () => {
    if (destination?.address) {
      navigator.clipboard.writeText(destination.address);
    }
  };

  const shareLocation = async () => {
    if (!destination) return;

    const shareData = {
      title: destination.name,
      text: `${destination.name} - ${destination.address || ''}`,
      url: `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
    }
  };

  if (!destination) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            🧭 الاتجاهات
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Destination Info */}
      <div className="p-4 border-b">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{getMarkerIcon(destination.type)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800">{destination.name}</h4>
            {destination.address && (
              <p className="text-sm text-gray-600 mt-1">{destination.address}</p>
            )}
            {destination.phone && (
              <a
                href={`tel:${destination.phone}`}
                className="inline-flex items-center gap-1 text-sm text-primary mt-1 hover:underline"
              >
                📞 {destination.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Travel Mode Selection */}
      <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          وسيلة التنقل
        </label>
        <div className="flex gap-2">
          {travelModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTravelMode(mode.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                travelMode === mode.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">{mode.icon}</span>
              <span className="text-xs">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Origin Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600">📍</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {userLocation ? 'موقعك الحالي' : 'حدد موقعك'}
            </p>
            {userLocation && (
              <p className="text-xs text-gray-500">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Route Line */}
        <div className="mr-5 my-2 border-r-2 border-dashed border-gray-300 h-8"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600">🎯</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{destination.name}</p>
            <p className="text-xs text-gray-500">الوجهة</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <button
          onClick={openGoogleMapsDirections}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
        >
          🗺️ فتح في خرائط جوجل
        </button>

        <div className="flex gap-2">
          <button
            onClick={copyAddress}
            disabled={!destination.address}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
          >
            📋 نسخ العنوان
          </button>
          <button
            onClick={shareLocation}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            📤 مشاركة
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-4">
        <p className="text-xs text-blue-700">
          💡 سيتم فتح خرائط جوجل لعرض الاتجاهات التفصيلية
        </p>
      </div>
    </div>
  );
}
