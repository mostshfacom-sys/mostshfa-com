'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// ==================== Types ====================

interface FilterOption {
  id: number;
  name: string;
}

interface HospitalFilters {
  governorate?: number[];
  city?: number[];
  type?: number[];
  specialty?: number[];
  hasEmergency?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  ratingMin?: number;
  isOpen?: boolean;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
}

export interface UniversalFiltersProps {
  filters: HospitalFilters;
  onFiltersChange: (filters: HospitalFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  isOpen: boolean;
}

// ==================== Helper Components ====================

const FilterSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-200 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
    >
      <span className="font-medium text-gray-900">{title}</span>
      <ChevronDownIcon 
        className={`w-5 h-5 text-gray-500 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-0">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const SearchableSelect: React.FC<{
  options: FilterOption[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  placeholder: string;
  multiple?: boolean;
}> = ({ options, selectedIds, onSelectionChange, placeholder, multiple = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOptionToggle = (id: number) => {
    if (multiple) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedIds.includes(id) ? [] : [id]);
      setIsOpen(false);
    }
  };

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white text-right"
      >
        <span className="text-gray-900">
          {selectedOptions.length > 0 
            ? `${selectedOptions.length} محدد` 
            : placeholder
          }
        </span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionToggle(option.id)}
                  className="w-full flex items-center gap-3 p-3 text-right hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedIds.includes(option.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(option.id) && (
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option.name}</span>
                </button>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RatingFilter: React.FC<{
  value: number;
  onChange: (rating: number) => void;
}> = ({ value, onChange }) => (
  <div className="space-y-3">
    {[5, 4, 3, 2, 1].map((rating) => (
      <button
        key={rating}
        onClick={() => onChange(rating === value ? 0 : rating)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
          value === rating
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              className={`w-4 h-4 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-gray-900">
          {rating} نجوم فأكثر
        </span>
      </button>
    ))}
  </div>
);

// ==================== Main Component ====================

const UniversalFilters: React.FC<UniversalFiltersProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
  className = ''
}) => {
  // ==================== State ====================
  
  const [sections, setSections] = useState<FilterSection[]>([
    { id: 'location', title: 'الموقع', isOpen: true },
    { id: 'type', title: 'نوع المستشفى', isOpen: false },
    { id: 'rating', title: 'التقييم', isOpen: false },
    { id: 'features', title: 'المميزات', isOpen: false },
    { id: 'specialties', title: 'التخصصات', isOpen: false },
    { id: 'accessibility', title: 'إمكانية الوصول', isOpen: false },
  ]);

  const [governorates, setGovernorates] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [hospitalTypes, setHospitalTypes] = useState<FilterOption[]>([]);
  const [specialties, setSpecialties] = useState<FilterOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // ==================== Effects ====================

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    if (filters.governorate && filters.governorate.length > 0) {
      loadCities(filters.governorate[0]);
    } else {
      setCities([]);
    }
  }, [filters.governorate]);

  // ==================== Data Loading ====================

  const loadFilterData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      const mockGovernorates = [
        { id: 1, name: 'القاهرة' },
        { id: 2, name: 'الجيزة' },
        { id: 3, name: 'الإسكندرية' },
        { id: 4, name: 'الشرقية' },
        { id: 5, name: 'البحيرة' },
      ];

      const mockHospitalTypes = [
        { id: 1, name: 'مستشفى حكومي' },
        { id: 2, name: 'مستشفى خاص' },
        { id: 3, name: 'مستشفى تعليمي' },
        { id: 4, name: 'مستشفى تخصصي' },
      ];

      const mockSpecialties = [
        { id: 1, name: 'الباطنة' },
        { id: 2, name: 'الجراحة' },
        { id: 3, name: 'النساء والتوليد' },
        { id: 4, name: 'الأطفال' },
        { id: 5, name: 'القلب' },
        { id: 6, name: 'العظام' },
      ];

      setGovernorates(mockGovernorates);
      setHospitalTypes(mockHospitalTypes);
      setSpecialties(mockSpecialties);
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async (governorateId: number) => {
    try {
      // Simulate API call - replace with actual API call
      const mockCities = [
        { id: 1, name: 'مدينة نصر' },
        { id: 2, name: 'المعادي' },
        { id: 3, name: 'الزمالك' },
        { id: 4, name: 'مصر الجديدة' },
      ];
      setCities(mockCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  // ==================== Handlers ====================

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };

  const updateFilters = (newFilters: Partial<HospitalFilters>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.governorate?.length) count++;
    if (filters.city?.length) count++;
    if (filters.type?.length) count++;
    if (filters.specialty?.length) count++;
    if (filters.ratingMin) count++;
    if (filters.hasEmergency) count++;
    if (filters.isFeatured) count++;
    if (filters.isVerified) count++;
    if (filters.isOpen) count++;
    if (filters.parkingAvailable) count++;
    if (filters.wheelchairAccessible) count++;
    return count;
  };

  // ==================== Render ====================

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-hidden ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                فلاتر البحث
              </h2>
              {getActiveFiltersCount() > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-blue-600">
                  {getActiveFiltersCount()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  مسح الكل
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري التحميل...</p>
              </div>
            ) : (
              <>
                {/* Location Section */}
                <FilterSection
                  title="الموقع"
                  isOpen={sections.find(s => s.id === 'location')?.isOpen || false}
                  onToggle={() => toggleSection('location')}
                >
                  <div className="space-y-4">
                    {/* Governorate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المحافظة
                      </label>
                      <SearchableSelect
                        options={governorates}
                        selectedIds={filters.governorate || []}
                        onSelectionChange={(ids) => updateFilters({ governorate: ids, city: [] })}
                        placeholder="اختر المحافظة"
                        multiple={false}
                      />
                    </div>

                    {/* City */}
                    {cities.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          المدينة
                        </label>
                        <SearchableSelect
                          options={cities}
                          selectedIds={filters.city || []}
                          onSelectionChange={(ids) => updateFilters({ city: ids })}
                          placeholder="اختر المدينة"
                          multiple={false}
                        />
                      </div>
                    )}
                  </div>
                </FilterSection>

                {/* Hospital Type Section */}
                <FilterSection
                  title="نوع المستشفى"
                  isOpen={sections.find(s => s.id === 'type')?.isOpen || false}
                  onToggle={() => toggleSection('type')}
                >
                  <SearchableSelect
                    options={hospitalTypes}
                    selectedIds={filters.type || []}
                    onSelectionChange={(ids) => updateFilters({ type: ids })}
                    placeholder="اختر نوع المستشفى"
                  />
                </FilterSection>

                {/* Rating Section */}
                <FilterSection
                  title="التقييم"
                  isOpen={sections.find(s => s.id === 'rating')?.isOpen || false}
                  onToggle={() => toggleSection('rating')}
                >
                  <RatingFilter
                    value={filters.ratingMin || 0}
                    onChange={(rating) => updateFilters({ ratingMin: rating || undefined })}
                  />
                </FilterSection>

                {/* Features Section */}
                <FilterSection
                  title="المميزات"
                  isOpen={sections.find(s => s.id === 'features')?.isOpen || false}
                  onToggle={() => toggleSection('features')}
                >
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.isOpen || false}
                        onChange={(e) => updateFilters({ isOpen: e.target.checked || undefined })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-900">مفتوح الآن</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.isFeatured || false}
                        onChange={(e) => updateFilters({ isFeatured: e.target.checked || undefined })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <StarIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-900">مميز</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.isVerified || false}
                        onChange={(e) => updateFilters({ isVerified: e.target.checked || undefined })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-900">محقق</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasEmergency || false}
                        onChange={(e) => updateFilters({ hasEmergency: e.target.checked || undefined })}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                        <span className="text-gray-900">خدمات طوارئ</span>
                      </div>
                    </label>
                  </div>
                </FilterSection>

                {/* Specialties Section */}
                <FilterSection
                  title="التخصصات"
                  isOpen={sections.find(s => s.id === 'specialties')?.isOpen || false}
                  onToggle={() => toggleSection('specialties')}
                >
                  <SearchableSelect
                    options={specialties}
                    selectedIds={filters.specialty || []}
                    onSelectionChange={(ids) => updateFilters({ specialty: ids })}
                    placeholder="اختر التخصصات"
                  />
                </FilterSection>

                {/* Accessibility Section */}
                <FilterSection
                  title="إمكانية الوصول"
                  isOpen={sections.find(s => s.id === 'accessibility')?.isOpen || false}
                  onToggle={() => toggleSection('accessibility')}
                >
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.parkingAvailable || false}
                        onChange={(e) => updateFilters({ parkingAvailable: e.target.checked || undefined })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <BuildingOffice2Icon className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-900">مواقف متاحة</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.wheelchairAccessible || false}
                        onChange={(e) => updateFilters({ wheelchairAccessible: e.target.checked || undefined })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-green-500" />
                        <span className="text-gray-900">مناسب للكراسي المتحركة</span>
                      </div>
                    </label>
                  </div>
                </FilterSection>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UniversalFilters;