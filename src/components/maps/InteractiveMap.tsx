'use client';

import { useMemo, useState, useEffect } from 'react';
import { MapContainer, MapMarker, EntityType } from './MapContainer';
import { NearbySearch } from './NearbySearch';
import { DirectionsPanel } from './DirectionsPanel';

const DEFAULT_ENTITY_TYPES: EntityType[] = ['hospital', 'clinic', 'lab', 'pharmacy'];

interface InteractiveMapProps {
  initialMarkers?: MapMarker[];
  showSearch?: boolean;
  showDirections?: boolean;
  entityTypes?: EntityType[];
  className?: string;
}

export function InteractiveMap({
  initialMarkers,
  showSearch = true,
  showDirections = true,
  entityTypes,
  className = '',
}: InteractiveMapProps) {
  const resolvedInitialMarkers = useMemo(() => initialMarkers ?? [], [initialMarkers]);
  const entityTypesKey = useMemo(
    () => (entityTypes && entityTypes.length > 0
      ? entityTypes.join(',')
      : DEFAULT_ENTITY_TYPES.join(',')),
    [entityTypes]
  );
  const resolvedEntityTypes = useMemo(
    () => entityTypesKey.split(',') as EntityType[],
    [entityTypesKey]
  );

  const [markers, setMarkers] = useState<MapMarker[]>(resolvedInitialMarkers);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mapHeight, setMapHeight] = useState('360px');
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  // Load initial markers from API
  useEffect(() => {
    let isMounted = true;

    const loadMarkers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (resolvedEntityTypes.length > 0) {
          params.set('types', resolvedEntityTypes.join(','));
        }
        const query = params.toString();
        const response = await fetch(`/api/map/markers${query ? `?${query}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setMarkers(data.markers || []);
          }
        }
      } catch (error) {
        console.error('Failed to load markers:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (resolvedInitialMarkers.length > 0) {
      setMarkers(resolvedInitialMarkers);
      setLoading(false);
    } else {
      loadMarkers();
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedInitialMarkers, entityTypesKey, resolvedEntityTypes]);

  useEffect(() => {
    if (filterType !== 'all' && !resolvedEntityTypes.includes(filterType)) {
      setFilterType('all');
    }
  }, [filterType, resolvedEntityTypes]);

  const handleSearch = (results: MapMarker[]) => {
    setMarkers(results);
  };

  const handleLocationChange = (location: { lat: number; lng: number } | null) => {
    setUserLocation(location);
    if (location) {
      setIsPickingLocation(false);
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
  };

  const openDirections = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setShowDirectionsPanel(true);
  };

  const handleMapClick = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
    setIsPickingLocation(false);
  };

  const filteredMarkers = filterType === 'all' 
    ? markers 
    : markers.filter(m => m.type === filterType);

  const getTypeCount = (type: EntityType) => markers.filter(m => m.type === type).length;

  const typeLabels: Record<EntityType, { label: string; icon: string; color: string }> = {
    hospital: { label: 'مستشفيات', icon: '🏥', color: 'bg-red-500' },
    clinic: { label: 'عيادات', icon: '🏨', color: 'bg-blue-500' },
    lab: { label: 'معامل', icon: '🔬', color: 'bg-purple-500' },
    pharmacy: { label: 'صيدليات', icon: '💊', color: 'bg-green-500' },
    ambulance: { label: 'إسعاف', icon: '🚑', color: 'bg-red-600' },
  };

  useEffect(() => {
    const updateMapHeight = () => {
      const viewportHeight = window.innerHeight || 700;
      const nextHeight = Math.round(Math.min(Math.max(viewportHeight * 0.55, 260), 520));
      setMapHeight(`${nextHeight}px`);
    };

    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    return () => window.removeEventListener('resize', updateMapHeight);
  }, []);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🗺️ الخريطة التفاعلية
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {markers.length} موقع متاح
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'map'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🗺️ خريطة
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 قائمة
              </button>
            </div>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filterType === 'all'
                ? 'bg-primary-100 text-primary-900 border-primary-200'
                : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
            }`}
          >
            الكل ({markers.length})
          </button>
          {resolvedEntityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? `${typeLabels[type].color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{typeLabels[type].icon}</span>
              <span>{typeLabels[type].label}</span>
              <span className="opacity-75">({getTypeCount(type)})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Search Panel */}
        {showSearch && (
          <div className="md:col-span-1 order-2 md:order-1">
            <NearbySearch
              onSearch={handleSearch}
              onLocationChange={handleLocationChange}
              entityTypes={resolvedEntityTypes}
              location={userLocation}
              onStartManualLocation={() => setIsPickingLocation(true)}
              isPickingLocation={isPickingLocation}
            />
          </div>
        )}

        {/* Map / List View */}
        <div className={`${showSearch ? 'md:col-span-3' : 'md:col-span-4'} order-1 md:order-2`}>
          {view === 'map' ? (
            <MapContainer
              markers={filteredMarkers}
              userLocation={userLocation}
              onMarkerClick={handleMarkerClick}
              showDirections={showDirections}
              height={mapHeight}
              className={`min-h-[260px] ${isPickingLocation ? 'cursor-crosshair' : ''}`}
              enableLocationPick={isPickingLocation}
              onMapClick={handleMapClick}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div
                className="overflow-auto min-h-[260px]"
                style={{ height: mapHeight }}
              >
                {filteredMarkers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <span className="text-4xl">📍</span>
                    <p className="mt-2">لا توجد نتائج</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleMarkerClick(marker)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeLabels[marker.type].color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg">{typeLabels[marker.type].icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800">{marker.name}</h4>
                            {marker.address && (
                              <p className="text-sm text-gray-600 mt-0.5 truncate">
                                📍 {marker.address}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {marker.rating && (
                                <span className="flex items-center gap-1 text-sm">
                                  <span className="text-yellow-500">⭐</span>
                                  {marker.rating.toFixed(1)}
                                </span>
                              )}
                              {marker.isOpen !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  marker.isOpen
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {marker.isOpen ? 'مفتوح' : 'مغلق'}
                                </span>
                              )}
                            </div>
                          </div>
                          {showDirections && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDirections(marker);
                              }}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                            >
                              🧭 اتجاهات
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Directions Panel Modal */}
      {showDirectionsPanel && selectedMarker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <DirectionsPanel
              destination={selectedMarker}
              userLocation={userLocation}
              onClose={() => setShowDirectionsPanel(false)}
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      )}
    </div>
  );
}
