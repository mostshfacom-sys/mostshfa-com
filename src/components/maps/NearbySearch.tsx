'use client';

import { useState, useEffect } from 'react';
import { MapMarker, EntityType, MAP_COLORS } from './MapContainer';

type CachedLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
};

const LOCATION_CACHE_KEY = 'mostshfa:lastLocation';
const LOCATION_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;

interface NearbySearchProps {
  onSearch: (results: MapMarker[]) => void;
  onLocationChange: (location: { lat: number; lng: number } | null) => void;
  entityTypes?: EntityType[];
  maxDistance?: number; // in km
  location?: { lat: number; lng: number } | null;
  onStartManualLocation?: () => void;
  isPickingLocation?: boolean;
}

export function NearbySearch({
  onSearch,
  onLocationChange,
  entityTypes = ['hospital', 'clinic', 'lab', 'pharmacy'],
  maxDistance = 10,
  location,
  onStartManualLocation,
  isPickingLocation = false,
}: NearbySearchProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<number | null>(null);
  const [cachedLocation, setCachedLocation] = useState<CachedLocation | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(entityTypes);
  const [distance, setDistance] = useState(maxDistance);
  const [searchResults, setSearchResults] = useState<MapMarker[]>([]);

  const clearLocation = () => {
    setUserLocation(null);
    setLocationAccuracy(null);
    setLocationUpdatedAt(null);
    setSearchResults([]);
    setError(null);
    onLocationChange(null);
    onSearch([]);
  };

  useEffect(() => {
    if (location) {
      setUserLocation(location);
      setLocationAccuracy(null);
      setLocationUpdatedAt(Date.now());
    } else if (location === null) {
      setUserLocation(null);
      setLocationAccuracy(null);
      setLocationUpdatedAt(null);
    }
  }, [location]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CachedLocation;
      if (!parsed || !Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng) || !Number.isFinite(parsed.timestamp)) {
        return;
      }
      if (Date.now() - parsed.timestamp > LOCATION_CACHE_MAX_AGE_MS) return;
      setCachedLocation(parsed);
    } catch {
      return;
    }
  }, []);

  const typeLabels: Record<EntityType, { label: string; icon: string }> = {
    hospital: { label: 'مستشفيات', icon: '🏥' },
    clinic: { label: 'عيادات', icon: '🏨' },
    lab: { label: 'معامل', icon: '🔬' },
    pharmacy: { label: 'صيدليات', icon: '💊' },
    doctor: { label: 'أطباء', icon: '👨‍⚕️' },
    ambulance: { label: 'إسعاف', icon: '🚑' },
  };

  const getTypeStyle = (type: EntityType) => {
    const color = MAP_COLORS[type];
    return {
      bg: color.bg,
      border: color.borderColor,
      text: color.textColor,
      hex: color.hex
    };
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationAccuracy(Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null);
        setLocationUpdatedAt(Date.now());
        const nextCached: CachedLocation = {
          lat: location.lat,
          lng: location.lng,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : undefined,
          timestamp: Date.now(),
        };
        setCachedLocation(nextCached);
        try {
          window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(nextCached));
        } catch {
          // ignore
        }
        onLocationChange(location);
        setLoading(false);
        searchNearby(location);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('تم رفض إذن الوصول للموقع. يمكنك اختيار موقعك يدويًا من الخريطة أو تفعيل الإذن من إعدادات المتصفح، وتأكد من فتح الموقع عبر https أو localhost.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('معلومات الموقع غير متاحة');
            break;
          case err.TIMEOUT:
            setError('انتهت مهلة طلب الموقع');
            break;
          default:
            setError('حدث خطأ في تحديد الموقع');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000 * 30,
      }
    );
  };

  const searchNearby = async (location: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        distance: distance.toString(),
        types: selectedTypes.join(','),
      });

      const response = await fetch(`/api/nearby?${params}`);
      
      if (!response.ok) {
        throw new Error('فشل في البحث عن المواقع القريبة');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      onSearch(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLocation) return;
    if (selectedTypes.length === 0) return;
    const t = window.setTimeout(() => {
      searchNearby(userLocation);
    }, 450);
    return () => window.clearTimeout(t);
  }, [distance, selectedTypes.join(','), userLocation?.lat, userLocation?.lng]);

  const toggleType = (type: EntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSearch = () => {
    if (userLocation) {
      searchNearby(userLocation);
    } else {
      getCurrentLocation();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        📍 البحث عن الأماكن القريبة
      </h3>

      {/* Location Status */}
      <div className="mb-4">
        {userLocation ? (
          <div className="flex flex-wrap items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm">تم تحديد موقعك</span>
            {locationAccuracy !== null && (
              <span className="text-xs text-green-700/90" dir="ltr">
                دقة: {Math.round(locationAccuracy)}m
              </span>
            )}
            {locationUpdatedAt !== null && (
              <span className="text-xs text-green-700/80" dir="ltr">
                {new Date(locationUpdatedAt).toLocaleTimeString('ar-EG')}
              </span>
            )}
            <button
              onClick={getCurrentLocation}
              className="mr-auto text-xs text-green-700 hover:underline"
            >
              تحديث الموقع
            </button>
            <button
              onClick={clearLocation}
              className="text-xs text-gray-700 hover:underline"
              type="button"
            >
              عرض الخريطة الكاملة
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {cachedLocation && (
              <button
                onClick={() => {
                  const next = { lat: cachedLocation.lat, lng: cachedLocation.lng };
                  setUserLocation(next);
                  setLocationAccuracy(Number.isFinite(cachedLocation.accuracy ?? NaN) ? Number(cachedLocation.accuracy) : null);
                  setLocationUpdatedAt(cachedLocation.timestamp);
                  onLocationChange(next);
                  searchNearby(next);
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                type="button"
              >
                📌 استخدام آخر موقع
              </button>
            )}
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              type="button"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري تحديد الموقع...
                </>
              ) : (
                <>📍 تحديد موقعي الحالي</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {onStartManualLocation && (
        <button
          onClick={onStartManualLocation}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {userLocation ? '🗺️ تغيير الموقع من الخريطة' : '🗺️ اختيار الموقع من الخريطة'}
        </button>
      )}

      {userLocation && (
        <button
          onClick={clearLocation}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          type="button"
        >
          🧹 عرض الخريطة الكاملة
        </button>
      )}

      {isPickingLocation && (
        <div className="mb-4 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
          🧭 اضغط على أي نقطة في الخريطة لتحديد موقعك
        </div>
      )}

      {/* Entity Type Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          فلترة نتائج البحث القريب
        </label>
        <p className="text-xs text-gray-500 mb-2">
          يحدد الأنواع التي سيتم البحث عنها داخل نصف القطر. يمكنك اختيار أكثر من نوع.
        </p>
        <div className="flex flex-wrap gap-2">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors border ${
                selectedTypes.includes(type)
                  ? 'bg-primary/15 text-primary-900 border-primary/30 hover:bg-primary/20'
                  : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
              }`}
            >
              <span>{typeLabels[type].icon}</span>
              <span>{typeLabels[type].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          المسافة: {distance} كم
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {[2, 5, 10, 25, 50].map((km) => (
            <button
              key={km}
              onClick={() => setDistance(km)}
              type="button"
              className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                distance === km
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {km} كم
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 كم</span>
          <span>50 كم</span>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading || selectedTypes.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-semibold"
      >
        <span className="relative w-5 h-5" aria-hidden>
          <span className={`absolute inset-0 flex items-center justify-center transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
            🔍
          </span>
          <span className={`absolute inset-0 flex items-center justify-center transition-opacity ${loading ? 'opacity-100' : 'opacity-0'}`}>
            <span className="animate-spin">⏳</span>
          </span>
        </span>
        <span>{loading ? 'جاري البحث...' : 'بحث'}</span>
      </button>

      {/* Results Summary */}
      {searchResults.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            تم العثور على <strong>{searchResults.length}</strong> نتيجة
          </p>
        </div>
      )}
    </div>
  );
}
