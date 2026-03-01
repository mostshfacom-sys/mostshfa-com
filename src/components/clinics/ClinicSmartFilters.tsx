
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
import type { ClinicFilters, FilterOption } from '@/types/clinic';
import { filterBySearch } from '@/lib/utils/searchNormalize';

interface ClinicSmartFiltersProps {
  filters: ClinicFilters;
  onFiltersChange: (filters: ClinicFilters) => void;
  governorates: FilterOption[];
  cities: FilterOption[];
  specialties: FilterOption[];
  filterSearch: string;
  onFilterSearchChange: (value: string) => void;
  onClearFilterSearch: () => void;
}

export function ClinicSmartFilters({
  filters,
  onFiltersChange,
  governorates,
  cities,
  specialties,
  filterSearch,
  onFilterSearchChange,
  onClearFilterSearch,
}: ClinicSmartFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchGov, setSearchGov] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSpec, setSearchSpec] = useState('');
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    location: false,
    city: false,
    specialty: false,
  });

  const activeFiltersCount = [
    filters.governorate,
    filters.city,
    filters.isOpen,
    filters.isFeatured,
    ...(filters.specialties || []),
  ].filter(Boolean).length;

  const handleToggle = (key: keyof ClinicFilters, value: any) => {
    const nextValue = filters[key] === value ? undefined : value;
    const nextFilters: ClinicFilters = {
      ...filters,
      [key]: nextValue,
    };

    if (key === 'governorate') {
      nextFilters.city = undefined;
    }

    onFiltersChange(nextFilters);
  };

  const handleMultiSelect = (key: 'specialties', id: number) => {
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

  // Filter governorates
  const filteredGovernorates = useMemo(() => {
    return filterBySearch(governorates, searchGov);
  }, [governorates, searchGov]);

  // Filter cities
  const filteredCities = useMemo(() => {
    const baseCities = filters.governorate
      ? cities.filter(city => String((city as any).governorateId ?? (city as any).governorate_id ?? '') === String(filters.governorate))
      : cities;
    return filterBySearch(baseCities, searchCity);
  }, [cities, filters.governorate, searchCity]);

  // Filter specialties
  const filteredSpecialties = useMemo(() => {
    return filterBySearch(specialties, searchSpec);
  }, [specialties, searchSpec]);

  // Get active filters for tags
  const activeFilterTags = useMemo(() => {
    const tags: Array<{ label: string; key: string; value: any }> = [];
    
    if (filters.isOpen) tags.push({ label: 'مفتوح الآن', key: 'isOpen', value: true });
    if (filters.isFeatured) tags.push({ label: 'مميز', key: 'isFeatured', value: true });
    
    if (filters.governorate) {
      const gov = governorates.find(g => g.id === filters.governorate);
      if (gov) tags.push({ label: gov.nameAr, key: 'governorate', value: gov.id });
    }
    if (filters.city) {
      const city = cities.find(c => c.id === filters.city);
      if (city) tags.push({ label: city.nameAr, key: 'city', value: city.id });
    }
    
    if (filters.specialties) {
      filters.specialties.forEach(id => {
        const spec = specialties.find(s => s.id === id);
        if (spec) tags.push({ label: spec.nameAr, key: 'specialties', value: id });
      });
    }
    
    return tags;
  }, [filters, governorates, cities, specialties]);

  const removeFilter = (tag: { key: string; value: any }) => {
    if (tag.key === 'specialties') {
      handleMultiSelect('specialties', tag.value);
    } else {
      handleToggle(tag.key as keyof ClinicFilters, tag.value);
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
                placeholder={
                  activeFiltersCount > 0
                    ? 'ابحث في النتائج المفلترة...'
                    : 'ابحث عن عيادة...'
                }
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
            {activeFiltersCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
                <SparklesIcon className="w-4 h-4" />
                <span>البحث في {activeFiltersCount} فلتر نشط</span>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500/20 scrollbar-track-transparent"
            >
              {/* Status Section */}
              <FilterSection
                title="حالة العيادة"
                icon={<ClockIcon className="w-4 h-4" />}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
                isExpanded={expandedSections.status}
                onToggle={() => toggleSection('status')}
                count={[filters.isOpen, filters.isFeatured].filter(Boolean).length}
              >
                <div className="space-y-2">
                  <FilterCheckbox
                    label="مفتوح الآن"
                    checked={filters.isOpen === true}
                    onChange={() => handleToggle('isOpen', true)}
                    icon={<ClockIcon className="w-4 h-4 text-emerald-600" />}
                  />
                  <FilterCheckbox
                    label="عيادات مميزة"
                    checked={filters.isFeatured === true}
                    onChange={() => handleToggle('isFeatured', true)}
                    icon={<SparklesIcon className="w-4 h-4 text-amber-500" />}
                  />
                </div>
              </FilterSection>

              {/* Specialties Section */}
              <FilterSection
                title="التخصصات"
                icon={<HeartIcon className="w-4 h-4" />}
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
                isExpanded={expandedSections.specialty}
                onToggle={() => toggleSection('specialty')}
                count={filters.specialties?.length || 0}
              >
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchSpec}
                    onChange={(e) => setSearchSpec(e.target.value)}
                    placeholder="ابحث عن تخصص..."
                    className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredSpecialties.map(spec => (
                    <FilterCheckbox
                      key={spec.id}
                      label={spec.nameAr}
                      checked={filters.specialties?.includes(spec.id) || false}
                      onChange={() => handleMultiSelect('specialties', spec.id)}
                      count={spec.count}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Location Section */}
              <FilterSection
                title="المحافظة"
                icon={<MapPinIcon className="w-4 h-4" />}
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
                isExpanded={expandedSections.location}
                onToggle={() => toggleSection('location')}
                count={filters.governorate ? 1 : 0}
              >
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchGov}
                    onChange={(e) => setSearchGov(e.target.value)}
                    placeholder="ابحث عن محافظة..."
                    className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredGovernorates.map(gov => (
                    <FilterCheckbox
                      key={gov.id}
                      label={gov.nameAr}
                      checked={filters.governorate === gov.id}
                      onChange={() => handleToggle('governorate', gov.id)}
                      count={gov.count}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* City Section */}
              {filters.governorate && (
                <FilterSection
                  title="المدينة / المنطقة"
                  icon={<MapPinIcon className="w-4 h-4" />}
                  iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                  iconColor="text-indigo-600 dark:text-indigo-400"
                  isExpanded={expandedSections.city}
                  onToggle={() => toggleSection('city')}
                  count={filters.city ? 1 : 0}
                >
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="ابحث عن مدينة..."
                      className="w-full px-3 py-2 pr-9 pl-9 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredCities.map(city => (
                      <FilterCheckbox
                        key={city.id}
                        label={city.nameAr}
                        checked={filters.city === city.id}
                        onChange={() => handleToggle('city', city.id)}
                        count={city.count}
                      />
                    ))}
                  </div>
                </FilterSection>
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

function FilterSection({
  title,
  icon,
  iconBg,
  iconColor,
  isExpanded,
  onToggle,
  children,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <div className="border-b border-neutral-100 dark:border-neutral-700 last:border-0">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg} ${iconColor} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {title}
          </span>
          {count > 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${iconBg} ${iconColor}`}>
              {count}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  icon,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border-2 ${
        checked
          ? 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-500 shadow-sm'
          : 'bg-white dark:bg-neutral-800 border-transparent hover:border-neutral-200 dark:hover:border-neutral-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            checked
              ? 'bg-teal-500 border-teal-500'
              : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
          }`}
        >
          {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
        </div>
        <div className="flex items-center gap-2">
          {icon}
          <span
            className={`text-xs font-medium ${
              checked ? 'text-teal-700 dark:text-teal-300' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {label}
          </span>
        </div>
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-md">
          {count}
        </span>
      )}
    </button>
  );
}
