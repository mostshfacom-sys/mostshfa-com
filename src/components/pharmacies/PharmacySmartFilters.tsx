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
  TruckIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { useState, useMemo } from 'react';
import type { PharmacyFilters, FilterOption } from '@/types/pharmacy';
import { filterBySearch } from '@/lib/utils/searchNormalize';

interface PharmacySmartFiltersProps {
  filters: PharmacyFilters;
  onFiltersChange: (filters: PharmacyFilters) => void;
  governorates: FilterOption[];
  cities: FilterOption[];
  filterSearch: string;
  onFilterSearchChange: (value: string) => void;
  onClearFilterSearch: () => void;
}

export function PharmacySmartFilters({
  filters,
  onFiltersChange,
  governorates,
  cities,
  filterSearch,
  onFilterSearchChange,
  onClearFilterSearch,
}: PharmacySmartFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchGov, setSearchGov] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    location: false,
    city: false,
  });

  const activeFiltersCount = [
    filters.governorate,
    filters.city,
    filters.hasDelivery,
    filters.hasNursing,
    filters.is24h,
    filters.isOpen,
  ].filter(Boolean).length;

  const handleToggle = (key: keyof PharmacyFilters, value: any) => {
    const nextValue = filters[key] === value ? undefined : value;
    const nextFilters: PharmacyFilters = {
      ...filters,
      [key]: nextValue,
    };

    if (key === 'governorate') {
      nextFilters.city = undefined;
    }

    onFiltersChange(nextFilters);
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

  // Filter governorates based on search (normalized)
  const filteredGovernorates = useMemo(() => {
    return filterBySearch(governorates, searchGov);
  }, [governorates, searchGov]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    const baseCities = filters.governorate
      ? cities.filter(city => String((city as any).governorateId ?? (city as any).governorate_id ?? '') === String(filters.governorate))
      : cities;
    return filterBySearch(baseCities, searchCity);
  }, [cities, filters.governorate, searchCity]);

  // Get active filters for tags
  const activeFilterTags = useMemo(() => {
    const tags: Array<{ label: string; key: string; value: any }> = [];
    
    if (filters.isOpen) tags.push({ label: 'مفتوح الآن', key: 'isOpen', value: true });
    if (filters.is24h) tags.push({ label: '24 ساعة', key: 'is24h', value: true });
    if (filters.hasDelivery) tags.push({ label: 'خدمة توصيل', key: 'hasDelivery', value: true });
    if (filters.hasNursing) tags.push({ label: 'خدمات تمريضية', key: 'hasNursing', value: true });
    
    if (filters.governorate) {
      const gov = governorates.find(g => g.id === filters.governorate);
      if (gov) tags.push({ label: gov.nameAr, key: 'governorate', value: gov.id });
    }
    if (filters.city) {
      const city = cities.find(c => c.id === filters.city);
      if (city) tags.push({ label: city.nameAr, key: 'city', value: city.id });
    }
    
    return tags;
  }, [filters, governorates, cities]);

  const removeFilter = (tag: { key: string; value: any }) => {
    handleToggle(tag.key as keyof PharmacyFilters, tag.value);
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
                  فلاتر الصيدليات
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

        {/* Active Filter Tags */}
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

        {/* Search Bar Section */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => onFilterSearchChange(e.target.value)}
                placeholder="ابحث عن صيدلية..."
                className="w-full pr-10 pl-4 py-3 text-sm border-2 border-teal-200 dark:border-teal-800 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
              />
              {filterSearch && (
                <button
                  onClick={onClearFilterSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-neutral-500" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent"
            >
              {/* Status Section */}
              <div className="p-4">
                <button 
                  onClick={() => toggleSection('status')}
                  className="flex items-center justify-between w-full text-sm font-bold text-neutral-900 dark:text-white mb-4"
                >
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-teal-500" />
                    <span>حالة الخدمة</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedSections.status ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {expandedSections.status && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <FilterToggle
                        label="مفتوح الآن"
                        active={filters.isOpen === true}
                        onClick={() => handleToggle('isOpen', true)}
                      />
                      <FilterToggle
                        label="خدمة 24 ساعة"
                        active={filters.is24h === true}
                        onClick={() => handleToggle('is24h', true)}
                        icon={<ClockIcon className="w-4 h-4" />}
                      />
                      <FilterToggle
                        label="خدمة التوصيل"
                        active={filters.hasDelivery === true}
                        onClick={() => handleToggle('hasDelivery', true)}
                        icon={<TruckIcon className="w-4 h-4" />}
                      />
                      <FilterToggle
                        label="خدمات تمريضية"
                        active={filters.hasNursing === true}
                        onClick={() => handleToggle('hasNursing', true)}
                        icon={<UserPlusIcon className="w-4 h-4" />}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location Section */}
              <div className="p-4">
                <button 
                  onClick={() => toggleSection('location')}
                  className="flex items-center justify-between w-full text-sm font-bold text-neutral-900 dark:text-white mb-4"
                >
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-teal-500" />
                    <span>المحافظة</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {expandedSections.location && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={searchGov}
                          onChange={(e) => setSearchGov(e.target.value)}
                          placeholder="ابحث عن محافظة..."
                          className="w-full pr-8 pl-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                        />
                        <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {filteredGovernorates.map(gov => (
                          <FilterOptionItem
                            key={gov.id}
                            label={gov.nameAr}
                            active={filters.governorate === gov.id}
                            onClick={() => handleToggle('governorate', gov.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* City Section */}
              {filters.governorate && (
                <div className="p-4">
                  <button 
                    onClick={() => toggleSection('city')}
                    className="flex items-center justify-between w-full text-sm font-bold text-neutral-900 dark:text-white mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-teal-500" />
                      <span>المدينة / المنطقة</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedSections.city ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.city && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="relative mb-3">
                          <input
                            type="text"
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            placeholder="ابحث عن مدينة..."
                            className="w-full pr-8 pl-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                          />
                          <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {filteredCities.map(city => (
                            <FilterOptionItem
                              key={city.id}
                              label={city.nameAr}
                              active={filters.city === city.id}
                              onClick={() => handleToggle('city', city.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {activeFiltersCount > 0 && isOpen && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
            <button
              onClick={clearAll}
              className="w-full py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FilterToggle({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-xl border-2 transition-all ${
        active 
          ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' 
          : 'bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-teal-500/50'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
        active ? 'bg-white border-white' : 'border-neutral-200 dark:border-neutral-600'
      }`}>
        {active && <CheckIcon className="w-3.5 h-3.5 text-teal-600" />}
      </div>
    </button>
  );
}

function FilterOptionItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
        active 
          ? 'bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold' 
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
      }`}
    >
      <span>{label}</span>
      {active && <CheckIcon className="w-4 h-4" />}
    </button>
  );
}
