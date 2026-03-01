
'use client'

import React, { useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import type { ClinicFilters, FilterOption } from '@/types/clinic'

interface Props {
  searchValue: string
  filters: ClinicFilters
  governorates: FilterOption[]
  cities: FilterOption[]
  specialties: FilterOption[]
  resultsCount: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onClearSearch: () => void
  onClearFilters: () => void
  onShowAll: () => void
  onFiltersChange: (filters: ClinicFilters) => void
}

export default function ClinicSearchStatusBar({
  searchValue,
  filters,
  governorates,
  cities,
  specialties,
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
    if (filters.isOpen) t.push({ key: 'isOpen', label: 'مفتوح الآن', value: true })
    if (filters.isFeatured) t.push({ key: 'isFeatured', label: 'مميز', value: true })
    
    if (filters.governorate) {
      const gov = governorates.find(x => x.id === Number(filters.governorate))
      if (gov) t.push({ key: 'governorate', label: gov.nameAr, value: filters.governorate })
    }
    if (filters.city) {
      const city = cities.find(x => x.id === Number(filters.city))
      if (city) t.push({ key: 'city', label: city.nameAr, value: filters.city })
    }
    if (Array.isArray(filters.specialties)) {
      filters.specialties.slice(0, 5).forEach(id => {
        const s = specialties.find(x => x.id === id)
        if (s) t.push({ key: 'specialties', label: s.nameAr, value: id })
      })
      const extra = (filters.specialties.length || 0) - 5
      if (extra > 0) t.push({ key: 'specialty_more', label: `+${extra}` })
    }
    return t
  }, [filters, governorates, cities, specialties])

  const hasSearch = !!searchValue
  const hasFilters = tags.length > 0

  const removeFilter = (tag: { key: string; value?: any }) => {
    if (tag.key === 'specialties' && tag.value !== undefined) {
      const current = filters.specialties || []
      const updated = current.filter(id => id !== tag.value)
      onFiltersChange({ ...filters, specialties: updated.length > 0 ? updated : undefined, page: 1 })
    } else if (tag.key === 'isOpen' || tag.key === 'isFeatured' || tag.key === 'governorate' || tag.key === 'city') {
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
                  {t.key !== 'specialty_more' && (
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
