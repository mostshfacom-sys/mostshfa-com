'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolidIcon } from '@heroicons/react/24/solid';

interface MapEntity {
  id: number;
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  type: 'hospital' | 'clinic' | 'lab' | 'pharmacy';
  address: string;
  phone?: string;
  rating?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  hasEmergency?: boolean;
}

interface InteractiveMapProps {
  entities: MapEntity[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  onEntitySelect?: (entity: MapEntity) => void;
  onLocationChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  entities = [],
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo coordinates
  zoom = 10,
  height = '400px',
  showSearch = true,
  showFilters = true,
  onEntitySelect,
  onLocationChange,
  className = ''
}) => {
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<MapEntity[]>(entities);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  // تحديث الكيانات المفلترة
  useEffect(() => {
    let filtered = [...entities];

    // فلترة حسب البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.nameAr.toLowerCase().includes(query) ||
        entity.name.toLowerCase().includes(query) ||
        entity.address.toLowerCase().includes(query)
      );
    }

    // فلترة حسب النوع
    if (activeFilters.size > 0) {
      filtered = filtered.filter(entity => activeFilters.has(entity.type));
    }

    setFilteredEntities(filtered);
  }, [entities, searchQuery, activeFilters]);

  // محاكاة تحميل الخريطة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleEntityClick = useCallback((entity: MapEntity) => {
    setSelectedEntity(entity);
    setMapCenter({ lat: entity.latitude, lng: entity.longitude });
    setMapZoom(15);
    onEntitySelect?.(entity);
  }, [onEntitySelect]);

  const handleFilterToggle = useCallback((type: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  }, []);

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'hospital': return 'مستشفى';
      case 'clinic': return 'عيادة';
      case 'lab': return 'مختبر';
      case 'pharmacy': return 'صيدلية';
      default: return type;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-red-500';
      case 'clinic': return 'bg-blue-500';
      case 'lab': return 'bg-green-500';
      case 'pharmacy': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const renderMapMarker = (entity: MapEntity, index: number) => {
    const isSelected = selectedEntity?.id === entity.id;
    const colorClass = getEntityTypeColor(entity.type);
    
    return (
      <div
        key={entity.id}
        className={`
          absolute transform -translate-x-1/2 -translate-y-full cursor-pointer
          transition-all duration-200 hover:scale-110 z-10
          ${isSelected ? 'scale-125 z-20' : ''}
        `}
        style={{
          left: `${((entity.longitude - (mapCenter.lng - 0.1)) / 0.2) * 100}%`,
          top: `${((mapCenter.lat + 0.1 - entity.latitude) / 0.2) * 100}%`,
        }}
        onClick={() => handleEntityClick(entity)}
      >
        <div className={`
          w-8 h-8 rounded-full ${colorClass} border-2 border-white shadow-lg
          flex items-center justify-center text-white text-xs font-bold
          ${isSelected ? 'ring-4 ring-blue-300' : ''}
        `}>
          {entity.isFeatured && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
          )}
          <MapPinSolidIcon className="w-4 h-4" />
        </div>
        
        {/* تسمية الكيان */}
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2 mt-1
          bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap
          border border-gray-200 transition-opacity duration-200
          ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
        `}>
          {entity.nameAr}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* شريط البحث والفلاتر */}
      {(showSearch || showFilters) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* البحث */}
            {showSearch && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث في الخريطة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* الفلاتر */}
            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
                {['hospital', 'clinic', 'lab', 'pharmacy'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilterToggle(type)}
                    className={`
                      flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${activeFilters.has(type)
                        ? `${getEntityTypeColor(type)} text-white`
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`w-3 h-3 rounded-full ${getEntityTypeColor(type)}`}></div>
                    {getEntityTypeLabel(type)}
                    <span className="text-xs opacity-75">
                      ({entities.filter(e => e.type === type).length})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* منطقة الخريطة */}
      <div 
        ref={mapRef}
        className="relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden"
        style={{ height }}
      >
        {isLoading ? (
          // حالة التحميل
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الخريطة...</p>
            </div>
          </div>
        ) : (
          <>
            {/* خلفية الخريطة المحاكاة */}
            <div className="absolute inset-0">
              {/* شبكة الخريطة */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-gray-300" style={{ top: `${i * 5}%` }} />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-gray-300" style={{ left: `${i * 5}%` }} />
                ))}
              </div>

              {/* شوارع وهمية */}
              <div className="absolute inset-0">
                <div className="absolute w-full h-1 bg-gray-400 opacity-30" style={{ top: '30%' }}></div>
                <div className="absolute w-full h-1 bg-gray-400 opacity-30" style={{ top: '60%' }}></div>
                <div className="absolute h-full w-1 bg-gray-400 opacity-30" style={{ left: '25%' }}></div>
                <div className="absolute h-full w-1 bg-gray-400 opacity-30" style={{ left: '75%' }}></div>
              </div>

              {/* مناطق وهمية */}
              <div className="absolute top-10 left-10 bg-green-200 opacity-40 w-20 h-16 rounded"></div>
              <div className="absolute bottom-10 right-10 bg-blue-200 opacity-40 w-24 h-20 rounded"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-200 opacity-40 w-16 h-16 rounded-full"></div>
            </div>

            {/* العلامات */}
            {filteredEntities.map((entity, index) => renderMapMarker(entity, index))}

            {/* معلومات الكيان المحدد */}
            {selectedEntity && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getEntityTypeColor(selectedEntity.type)}`}></div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getEntityTypeLabel(selectedEntity.type)}
                      </span>
                      {selectedEntity.isFeatured && (
                        <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">مميز</span>
                      )}
                      {selectedEntity.isVerified && (
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">موثق</span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-1">{selectedEntity.nameAr}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedEntity.address}</p>
                    
                    {selectedEntity.phone && (
                      <p className="text-sm text-blue-600">{selectedEntity.phone}</p>
                    )}
                    
                    {selectedEntity.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(selectedEntity.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{selectedEntity.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* أدوات التحكم في الخريطة */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button
                onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700"
              >
                +
              </button>
              <button
                onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700"
              >
                -
              </button>
            </div>

            {/* مؤشر الزوم */}
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-300 text-sm text-gray-600 z-20">
              تكبير: {mapZoom}x
            </div>
          </>
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>عرض {filteredEntities.length} من أصل {entities.length} موقع</span>
          {selectedEntity && (
            <span>محدد: {selectedEntity.nameAr}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;