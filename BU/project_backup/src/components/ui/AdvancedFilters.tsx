'use client';

import React, { useState, useEffect } from 'react';

// Simple SVG Icons
const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

interface FilterOption {
  id: number | string;
  nameAr: string;
  nameEn?: string;
  count?: number;
  icon?: string;
  color?: string;
}

interface FilterData {
  locations: {
    governorates: FilterOption[];
  };
  types: FilterOption[];
  specialties: FilterOption[];
  services: {
    emergency: { label: string; count: number };
    featured: { label: string; count: number };
  };
  ratings: {
    min: number;
    max: number;
    average: number;
    ranges: Array<{ label: string; value: number; count: number }>;
  };
  sortOptions: Array<{ value: string; label: string; icon: string }>;
}

interface SearchFilters {
  query?: string;
  governorateId?: number;
  cityId?: number;
  typeId?: number;
  specialtyId?: number;
  hasEmergency?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export default function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters
}: AdvancedFiltersProps) {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['location', 'services', 'rating'])
  );

  // تحميل بيانات الفلاتر
  useEffect(() => {
    if (isOpen && !filterData) {
      loadFilterData();
    }
  }, [isOpen]);

  // تحميل المدن عند تغيير المحافظة
  useEffect(() => {
    if (filters.governorateId) {
      loadCities(filters.governorateId);
    } else {
      setCities([]);
    }
  }, [filters.governorateId]);

  const loadFilterData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hospitals-pro/filters');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFilterData(data.filters);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات الفلاتر:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async (governorateId: number) => {
    try {
      const response = await fetch(`/api/hospitals-pro/cities?governorateId=${governorateId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCities(data.cities);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل المدن:', error);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    
    // إعادة تعيين المدينة عند تغيير المحافظة
    if (key === 'governorateId') {
      newFilters.cityId = undefined;
    }
    
    onFiltersChange(newFilters);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.governorateId) count++;
    if (filters.cityId) count++;
    if (filters.typeId) count++;
    if (filters.specialtyId) count++;
    if (filters.hasEmergency) count++;
    if (filters.isFeatured) count++;
    if (filters.isVerified) count++;
    if (filters.minRating) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in">
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FilterIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">فلاتر البحث</h3>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Content */}
        {filterData && !isLoading && (
          <div className="p-6 space-y-6">
            
            {/* Location Filters */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">الموقع</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('location') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('location') && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Governorate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المحافظة
                    </label>
                    <select
                      value={filters.governorateId || ''}
                      onChange={(e) => handleFilterChange('governorateId', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">جميع المحافظات</option>
                      {filterData.locations.governorates.map(gov => (
                        <option key={gov.id} value={gov.id}>
                          {gov.nameAr} ({gov.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  {cities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة
                      </label>
                      <select
                        value={filters.cityId || ''}
                        onChange={(e) => handleFilterChange('cityId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">جميع المدن</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {city.nameAr} ({city.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">نوع المستشفى</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('type') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('type') && (
                <div className="p-4 border-t border-gray-200">
                  <select
                    value={filters.typeId || ''}
                    onChange={(e) => handleFilterChange('typeId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">جميع الأنواع</option>
                    {filterData.types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.nameAr} ({type.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Specialty Filter */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('specialty')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">التخصص</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('specialty') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('specialty') && (
                <div className="p-4 border-t border-gray-200">
                  <select
                    value={filters.specialtyId || ''}
                    onChange={(e) => handleFilterChange('specialtyId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">جميع التخصصات</option>
                    {filterData.specialties.map(specialty => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.nameAr} ({specialty.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Services Filter */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('services')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">الخدمات</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('services') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('services') && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasEmergency || false}
                      onChange={(e) => handleFilterChange('hasEmergency', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-3 text-sm text-gray-700">
                      خدمات طوارئ ({filterData.services.emergency.count})
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured || false}
                      onChange={(e) => handleFilterChange('isFeatured', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-3 text-sm text-gray-700">
                      مستشفيات مميزة ({filterData.services.featured.count})
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isVerified || false}
                      onChange={(e) => handleFilterChange('isVerified', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-3 text-sm text-gray-700">
                      موثق
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('rating')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">التقييم</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('rating') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('rating') && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  {filterData.ratings.ranges.map(range => (
                    <label key={range.value} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.minRating === range.value}
                        onChange={() => handleFilterChange('minRating', range.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="mr-3 flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: range.value }).map((_, i) => (
                            <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </div>
                    </label>
                  ))}
                  
                  {filters.minRating && (
                    <button
                      onClick={() => handleFilterChange('minRating', undefined)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      إزالة فلتر التقييم
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('sort')}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">ترتيب النتائج</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedSections.has('sort') ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections.has('sort') && (
                <div className="p-4 border-t border-gray-200 space-y-2">
                  {filterData.sortOptions.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="sort"
                        checked={filters.sortBy === option.value}
                        onChange={() => handleFilterChange('sortBy', option.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-3 text-sm text-gray-700">
                        {option.icon} {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClearFilters}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              مسح الفلاتر
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}