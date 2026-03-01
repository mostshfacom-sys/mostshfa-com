'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckIcon,
  SparklesIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  HeartIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { useState, useMemo } from 'react';
import type { HospitalFilters, FilterOption } from '@/types/hospital';
import { filterBySearch } from '@/lib/utils/searchNormalize';

interface SmartFiltersProps {
  filters: HospitalFilters;
  onFiltersChange: (filters: HospitalFilters) => void;
  hospitalTypes: FilterOption[];
  governorates: FilterOption[];
  cities: FilterOption[];
  specialties: FilterOption[];
  services: FilterOption[];
  filterSearch: string;
  onFilterSearchChange: (value: string) => void;
  onClearFilterSearch: () => void;
}

export function SmartFilters({
  filters,
  onFiltersChange,
  hospitalTypes,
  governorates,
  cities,
  specialties,
  services,
  filterSearch,
  onFilterSearchChange,
  onClearFilterSearch,
}: SmartFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchType, setSearchType] = useState('');
  const [searchGov, setSearchGov] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSpec, setSearchSpec] = useState('');
  const [searchService, setSearchService] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    type: true,
    location: false,
    city: false,
    specialty: false,
    service: false,
  });

  const activeFiltersCount = [
    filters.hospital_type,
    filters.governorate,
    filters.city,
    filters.has_emergency,
    filters.has_ambulance,
    filters.is_open,
    ...(filters.specialties || []),
    ...(filters.services || []),
  ].filter(Boolean).length;

  const handleToggle = (key: keyof HospitalFilters, value: any) => {
    const nextValue = filters[key] === value ? undefined : value;
    const nextFilters: HospitalFilters = {
      ...filters,
      [key]: nextValue,
    };

    if (key === 'governorate') {
      nextFilters.city = undefined;
    }

    onFiltersChange(nextFilters);
  };

  const handleMultiSelect = (key: 'specialties' | 'services', id: number) => {
    const current = filters[key] || [];
    const newValue = current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id];
    
    onFiltersChange({
      ...filters,
      [key]: newValue.length > 0 ? newValue : undefined,
    });
  };

  const clearAll = () => {
    onFiltersChange({
      search: filters.search,
      ordering: filters.ordering,
      page: 1,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter hospital types based on search
  const filteredHospitalTypes = useMemo(() => {
    return filterBySearch(hospitalTypes, searchType);
  }, [hospitalTypes, searchType]);

  // Filter governorates based on search (normalized)
  const filteredGovernorates = useMemo(() => {
    return filterBySearch(governorates, searchGov);
  }, [governorates, searchGov]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    const baseCities = filters.governorate
      ? cities.filter(city => String(city.governorate_id ?? '') === String(filters.governorate))
      : cities;
    return filterBySearch(baseCities, searchCity);
  }, [cities, filters.governorate, searchCity]);

  // Filter specialties based on search (normalized)
  const filteredSpecialties = useMemo(() => {
    return filterBySearch(specialties, searchSpec);
  }, [specialties, searchSpec]);

  // Filter services based on search (normalized)
  const filteredServices = useMemo(() => {
    return filterBySearch(services, searchService);
  }, [services, searchService]);

  // Get active filters for tags
  const activeFilterTags = useMemo(() => {
    const tags: Array<{ label: string; key: string; value: any }> = [];
    
    if (filters.is_open) tags.push({ label: 'مفتوح الآن', key: 'is_open', value: true });
    if (filters.has_emergency) tags.push({ label: 'طوارئ', key: 'has_emergency', value: true });
    if (filters.has_ambulance) tags.push({ label: 'سيارة إسعاف', key: 'has_ambulance', value: true });
    if (filters.hospital_type) {
      const type = hospitalTypes.find(t => t.id === filters.hospital_type);
      if (type) tags.push({ label: type.name_ar, key: 'hospital_type', value: type.id });
    }
    if (filters.governorate) {
      const gov = governorates.find(g => g.id === filters.governorate);
      if (gov) tags.push({ label: gov.name_ar, key: 'governorate', value: gov.id });
    }
    if (filters.city) {
      const city = cities.find(c => c.id === filters.city);
      if (city) tags.push({ label: city.name_ar, key: 'city', value: city.id });
    }
    if (filters.specialties) {
      filters.specialties.forEach(id => {
        const spec = specialties.find(s => s.id === id);
        if (spec) tags.push({ label: spec.name_ar, key: 'specialties', value: id });
      });
    }
    if (filters.services) {
      filters.services.forEach(id => {
        const service = services.find(s => s.id === id);
        if (service) tags.push({ label: service.name_ar, key: 'services', value: id });
      });
    }
    
    return tags;
  }, [filters, hospitalTypes, governorates, cities, specialties, services]);

  const removeFilter = (tag: { key: string; value: any }) => {
    if (tag.key === 'specialties' || tag.key === 'services') {
      handleMultiSelect(tag.key, tag.value);
    } else {
      handleToggle(tag.key as keyof HospitalFilters, tag.value);
    }
  };

  return (
    <div className="sticky top-24 z-20">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-850 dark:to-neutral-800 rounded-2xl shadow-xl border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <FunnelIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  فلاتر البحث
                </h2>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-white/80">
                    {activeFiltersCount} فلتر نشط
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <motion.div
                animate={{ rotate: isOpen ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-white" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Active Filter Tags - Separated Section */}
        {activeFilterTags.length > 0 && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-900/20 dark:to-cyan-900/20 px-4 py-3 border-b border-teal-200/30 dark:border-teal-700/30"
          >
            <div className="flex flex-wrap gap-2">
              {activeFilterTags.map((tag, i) => (
                <motion.div
                  key={`${tag.key}-${tag.value}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-full text-xs text-teal-700 dark:text-teal-300 font-medium border border-teal-200 dark:border-teal-700 shadow-sm"
                >
                  <span>{tag.label}</span>
                  <button
                    onClick={() => removeFilter(tag)}
                    className="hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-full p-0.5 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Bar Section - Sticky/Fixed */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700"
          >
            {/* Smart Search Bar - Filter Context Search */}
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => onFilterSearchChange(e.target.value)}
                  placeholder={
                    activeFiltersCount > 0
                      ? 'ابحث في النتائج المفلترة...'
                      : 'ابحث عن مستشفى...'
                  }
                  className="w-full pr-10 pl-4 py-3 text-sm border-2 border-teal-200 dark:border-teal-800 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                />
                {filterSearch && (
                  <button
                    onClick={onClearFilterSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                    aria-label="مسح البحث"
                  >
                    <XMarkIcon className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
                  <SparklesIcon className="w-4 h-4" />
                  <span>
                    البحث في {activeFiltersCount} فلتر نشط
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Content - Scrollable Filters */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                
                {/* Quick Filters - Status */}
                <FilterSection
                  title="حالة المستشفى"
                  icon={<ClockIcon className="w-4 h-4" />}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  isExpanded={expandedSections.status}
                  onToggle={() => toggleSection('status')}
                  count={[filters.is_open, filters.has_emergency].filter(Boolean).length}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="مفتوح الآن"
                      checked={filters.is_open === true}
                      onChange={() => handleToggle('is_open', true)}
                      icon={<ClockIcon className="w-4 h-4 text-emerald-600" />}
                    />
                    <FilterCheckbox
                      label="طوارئ 24 ساعة"
                      checked={filters.has_emergency === true}
                      onChange={() => handleToggle('has_emergency', true)}
                      icon={<HeartIcon className="w-4 h-4 text-red-600" />}
                    />
                    <FilterCheckbox
                      label="سيارة إسعاف"
                      checked={filters.has_ambulance === true}
                      onChange={() => handleToggle('has_ambulance', true)}
                      icon={<HeartIcon className="w-4 h-4 text-blue-600" />}
                    />
                  </div>
                </FilterSection>

                {/* Hospital Type */}
                {hospitalTypes && hospitalTypes.length > 0 && (
                  <FilterSection
                    title="نوع المستشفى"
                    icon={<BuildingOffice2Icon className="w-4 h-4" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                    isExpanded={expandedSections.type}
                    onToggle={() => toggleSection('type')}
                    count={filters.hospital_type ? 1 : 0}
                  >
                    {/* Search */}
                    {hospitalTypes.length > 5 && (
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          placeholder="ابحث في الأنواع..."
                          className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        {searchType && (
                          <button
                            onClick={() => setSearchType('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                            aria-label="مسح البحث"
                          >
                            <XMarkIcon className="w-3.5 h-3.5 text-neutral-500" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredHospitalTypes.map((type) => (
                        <FilterCheckbox
                          key={type.id}
                          label={type.name_ar}
                          checked={filters.hospital_type === type.id}
                          onChange={() => handleToggle('hospital_type', type.id)}
                          icon={<BuildingOffice2Icon className="w-4 h-4 text-blue-600" />}
                        />
                      ))}
                      {filteredHospitalTypes.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                          لا توجد نتائج
                        </p>
                      )}
                    </div>
                  </FilterSection>
                )}

                {/* Governorate */}
                {governorates && governorates.length > 0 && (
                  <FilterSection
                    title="المحافظة"
                    icon={<MapPinIcon className="w-4 h-4" />}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                    iconColor="text-purple-600 dark:text-purple-400"
                    isExpanded={expandedSections.location}
                    onToggle={() => toggleSection('location')}
                    count={filters.governorate ? 1 : 0}
                  >
                    {/* Search */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={searchGov}
                        onChange={(e) => setSearchGov(e.target.value)}
                        placeholder="ابحث عن محافظة..."
                        className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      {searchGov && (
                        <button
                          onClick={() => setSearchGov('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                          aria-label="مسح البحث"
                        >
                          <XMarkIcon className="w-3.5 h-3.5 text-neutral-500" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredGovernorates.map((gov) => (
                        <FilterCheckbox
                          key={gov.id}
                          label={gov.name_ar}
                          checked={filters.governorate === gov.id}
                          onChange={() => handleToggle('governorate', gov.id)}
                          icon={<MapPinIcon className="w-4 h-4 text-purple-600" />}
                        />
                      ))}
                      {filteredGovernorates.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                          لا توجد نتائج
                        </p>
                      )}
                    </div>
                  </FilterSection>
                )}

                {/* City */}
                {cities && cities.length > 0 && (
                  <FilterSection
                    title="المدينة"
                    icon={<MapPinIcon className="w-4 h-4" />}
                    iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    isExpanded={expandedSections.city}
                    onToggle={() => toggleSection('city')}
                    count={filters.city ? 1 : 0}
                  >
                    {/* Search */}
                    {cities.length > 5 && (
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={searchCity}
                          onChange={(e) => setSearchCity(e.target.value)}
                          placeholder="ابحث عن مدينة..."
                          className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        {searchCity && (
                          <button
                            onClick={() => setSearchCity('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                            aria-label="مسح البحث"
                          >
                            <XMarkIcon className="w-3.5 h-3.5 text-neutral-500" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <FilterCheckbox
                          key={city.id}
                          label={city.name_ar}
                          checked={filters.city === city.id}
                          onChange={() => handleToggle('city', city.id)}
                          icon={<MapPinIcon className="w-4 h-4 text-indigo-600" />}
                        />
                      ))}
                      {filteredCities.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                          لا توجد نتائج
                        </p>
                      )}
                    </div>
                  </FilterSection>
                )}

                {/* Specialties */}
                {specialties && specialties.length > 0 && (
                  <FilterSection
                    title="التخصصات"
                    icon={<SparklesIcon className="w-4 h-4" />}
                    iconBg="bg-amber-100 dark:bg-amber-900/30"
                    iconColor="text-amber-600 dark:text-amber-400"
                    isExpanded={expandedSections.specialty}
                    onToggle={() => toggleSection('specialty')}
                    count={filters.specialties?.length || 0}
                  >
                    {/* Search */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={searchSpec}
                        onChange={(e) => setSearchSpec(e.target.value)}
                        placeholder="ابحث عن تخصص..."
                        className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      {searchSpec && (
                        <button
                          onClick={() => setSearchSpec('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                          aria-label="مسح البحث"
                        >
                          <XMarkIcon className="w-3.5 h-3.5 text-neutral-500" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredSpecialties.slice(0, 15).map((specialty) => (
                        <FilterCheckbox
                          key={specialty.id}
                          label={specialty.name_ar}
                          checked={filters.specialties?.includes(specialty.id) || false}
                          onChange={() => handleMultiSelect('specialties', specialty.id)}
                          icon={<SparklesIcon className="w-4 h-4 text-amber-600" />}
                        />
                      ))}
                      {filteredSpecialties.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                          لا توجد نتائج
                        </p>
                      )}
                    </div>
                  </FilterSection>
                )}

                {/* Services */}
                {services && services.length > 0 && (
                  <FilterSection
                    title="الخدمات الطبية"
                    icon={<HeartIcon className="w-4 h-4" />}
                    iconBg="bg-rose-100 dark:bg-rose-900/30"
                    iconColor="text-rose-600 dark:text-rose-400"
                    isExpanded={expandedSections.service}
                    onToggle={() => toggleSection('service')}
                    count={filters.services?.length || 0}
                  >
                    {/* Search */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={searchService}
                        onChange={(e) => setSearchService(e.target.value)}
                        placeholder="ابحث عن خدمة..."
                        className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      {searchService && (
                        <button
                          onClick={() => setSearchService('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                          aria-label="مسح البحث"
                        >
                          <XMarkIcon className="w-3.5 h-3.5 text-neutral-500" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredServices.slice(0, 15).map((service) => (
                        <FilterCheckbox
                          key={service.id}
                          label={service.name_ar}
                          checked={filters.services?.includes(service.id) || false}
                          onChange={() => handleMultiSelect('services', service.id)}
                          icon={<HeartIcon className="w-4 h-4 text-rose-600" />}
                        />
                      ))}
                      {filteredServices.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                          لا توجد نتائج
                        </p>
                      )}
                    </div>
                  </FilterSection>
                )}

                {/* Clear All Button */}
                {activeFiltersCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={clearAll}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    مسح جميع الفلاتر ({activeFiltersCount})
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Filter Section Component
function FilterSection({
  title,
  icon,
  iconBg,
  iconColor,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>
            {icon}
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white">
            {title}
          </span>
          {count > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5 text-neutral-500" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Checkbox Component
function FilterCheckbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group ${
      checked 
        ? 'bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500' 
        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700/50 border-2 border-transparent'
    }`}>
      <div className="relative flex items-center justify-center flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border-2 transition-all ${
            checked
              ? 'bg-teal-600 border-teal-600 shadow-md'
              : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 group-hover:border-teal-500'
          }`}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <CheckIcon className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </div>
      </div>
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
    </label>
  );
}
