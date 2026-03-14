'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Governorate, HospitalType, Specialty } from '@/types';

interface HospitalFiltersProps {
  governorates: Governorate[];
  types: HospitalType[];
  specialties: Specialty[];
  showSearch?: boolean;
}

export function HospitalFilters({
  governorates,
  types,
  specialties,
  showSearch = true,
}: HospitalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [governorate, setGovernorate] = useState(searchParams.get('governorate') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [hasEmergency, setHasEmergency] = useState(searchParams.get('emergency') === 'true');
  const showSearchInput = showSearch !== false;

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (governorate) params.set('governorate', governorate);
    if (type) params.set('type', type);
    if (specialty) params.set('specialty', specialty);
    if (hasEmergency) params.set('emergency', 'true');
    params.set('page', '1');
    
    router.push(`/hospitals?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setGovernorate('');
    setType('');
    setSpecialty('');
    setHasEmergency(false);
    router.push('/hospitals');
  };

  const hasActiveFilters = search || governorate || type || specialty || hasEmergency;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div
        className={`grid gap-4 ${
          showSearchInput ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {/* Search */}
        {showSearchInput && (
          <div className="lg:col-span-2">
            <Input
              placeholder="ابحث عن مستشفى..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Governorate */}
        <select
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          className="input"
        >
          <option value="">كل المحافظات</option>
          {governorates.map((gov) => (
            <option key={gov.id} value={gov.id}>
              {gov.nameAr}
            </option>
          ))}
        </select>

        {/* Type */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input"
        >
          <option value="">كل الأنواع</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameAr}
            </option>
          ))}
        </select>

        {/* Specialty */}
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="input"
        >
          <option value="">كل التخصصات</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameAr}
            </option>
          ))}
        </select>
      </div>

      {/* Second Row */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {/* Emergency Filter */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasEmergency}
            onChange={(e) => setHasEmergency(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">طوارئ 24 ساعة</span>
        </label>

        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={applyFilters}>
            بحث
          </Button>
        </div>
      </div>
    </div>
  );
}
