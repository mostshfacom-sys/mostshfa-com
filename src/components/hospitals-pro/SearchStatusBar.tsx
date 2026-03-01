'use client'

import React, { useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import type { HospitalFilters, FilterOption } from '@/types/hospital'

interface Props {
  searchValue: string
  filters: HospitalFilters
  hospitalTypes: FilterOption[]
  governorates: FilterOption[]
  cities: FilterOption[]
  specialties: FilterOption[]
  services: FilterOption[]
  resultsCount: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onClearSearch: () => void
  onClearFilters: () => void
  onShowAll: () => void
  onFiltersChange: (filters: HospitalFilters) => void
}

export default function SearchStatusBar({
  searchValue,
  filters,
  hospitalTypes,
  governorates,
  cities,
  specialties,
  services,
  resultsCount,
  viewMode,
  onViewModeChange,
  onClearSearch,
  onClearFilters,
  onShowAll,
  onFiltersChange,
}: Props) {
  const tags = useMemo(() => {
    const t: Array<{ key: string; label: string; value?: any }> = []
    if (filters.is_open) t.push({ key: 'is_open', label: 'مفتوح الآن', value: true })
    if (filters.has_emergency) t.push({ key: 'has_emergency', label: 'طوارئ', value: true })
    if (filters.hospital_type) {
      const type = hospitalTypes.find(x => x.id === Number(filters.hospital_type))
      if (type) t.push({ key: 'hospital_type', label: type.name_ar, value: filters.hospital_type })
    }
    if (filters.governorate) {
      const gov = governorates.find(x => x.id === Number(filters.governorate))
      if (gov) t.push({ key: 'governorate', label: gov.name_ar, value: filters.governorate })
    }
    if (filters.city) {
      const city = cities.find(x => x.id === Number(filters.city))
      if (city) t.push({ key: 'city', label: city.name_ar, value: filters.city })
    }
    if (Array.isArray(filters.specialties)) {
      filters.specialties.slice(0, 5).forEach(id => {
        const s = specialties.find(x => x.id === id)
        if (s) t.push({ key: 'specialties', label: s.name_ar, value: id })
      })
      const extra = (filters.specialties.length || 0) - 5
      if (extra > 0) t.push({ key: 'specialty_more', label: `+${extra}` })
    }
    if (Array.isArray(filters.services)) {
      filters.services.slice(0, 5).forEach(id => {
        const s = services.find(x => x.id === id)
        if (s) t.push({ key: 'services', label: s.name_ar, value: id })
      })
      const extra = (filters.services.length || 0) - 5
      if (extra > 0) t.push({ key: 'service_more', label: `+${extra}` })
    }
    return t
  }, [filters, hospitalTypes, governorates, cities, specialties, services])

  const hasSearch = !!searchValue
  const hasFilters = tags.length > 0

  const removeFilter = (tag: { key: string; value?: any }) => {
    if (tag.key === 'specialties' && tag.value !== undefined) {
      const current = filters.specialties || []
      const updated = current.filter(id => id !== tag.value)
      onFiltersChange({ ...filters, specialties: updated.length > 0 ? updated : undefined, page: 1 })
    } else if (tag.key === 'services' && tag.value !== undefined) {
      const current = filters.services || []
      const updated = current.filter(id => id !== tag.value)
      onFiltersChange({ ...filters, services: updated.length > 0 ? updated : undefined, page: 1 })
    } else if (tag.key === 'is_open' || tag.key === 'has_emergency' || tag.key === 'hospital_type' || tag.key === 'governorate' || tag.key === 'city') {
      onFiltersChange({ ...filters, [tag.key]: undefined, page: 1 })
    }
  }

  return (
    <div className="sticky top-20 z-30 mb-4">
      <div className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <span className="font-semibold">نطاق البحث</span>
            <span className="text-neutral-400">|</span>
            {hasSearch ? (
              <span className="group flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs">
                <span>{searchValue}</span>
                <button
                  onClick={onClearSearch}
                  className="hover:bg-teal-200 dark:hover:bg-teal-800/60 rounded-full p-0.5 transition-colors"
                  aria-label="إزالة البحث"
                  title="إزالة البحث"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 text-xs">
                الكل
              </span>
            )}
            <span className="text-neutral-400">•</span>
            <span className="text-xs">نتائج: {resultsCount}</span>
          </div>
          {hasFilters && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <span key={`${t.key}-${i}`} className="group flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-medium">
                  <span>{t.label}</span>
                  {t.key !== 'specialty_more' && t.key !== 'service_more' && (
                    <button
                      onClick={() => removeFilter(t)}
                      className="hover:bg-cyan-200 dark:hover:bg-cyan-800/60 rounded-full p-0.5 transition-colors"
                      aria-label={`إزالة ${t.label}`}
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              aria-label="عرض شبكي"
              title="عرض شبكي"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              aria-label="عرض قائمة"
              title="عرض قائمة"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onShowAll}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold shadow-md hover:from-teal-700 hover:to-cyan-700"
          >
            عرض الجميع
          </button>
          <button
            onClick={onClearFilters}
            disabled={!hasFilters}
            className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold disabled:opacity-50"
          >
            مسح الفلاتر
          </button>
          <button
            onClick={onClearSearch}
            disabled={!hasSearch}
            className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold disabled:opacity-50"
          >
            إلغاء البحث
          </button>
        </div>
      </div>
    </div>
  )
}