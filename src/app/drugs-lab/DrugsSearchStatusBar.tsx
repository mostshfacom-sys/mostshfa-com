'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  buildDrugsLabUrl,
  DRUGS_LAB_QUERY_CHANGE_EVENT,
  sanitizeDrugSearchInput,
} from '@/lib/search/drugs-lab'

interface DrugCategoryOption {
  id: number
  name: string
}

interface Props {
  searchValue: string
  resultsCount: number
  categories: DrugCategoryOption[]
  mobileFilters?: React.ReactNode
}

interface StatusTag {
  key: string
  label: string
  value?: string
}

export default function DrugsSearchStatusBar({
  searchValue,
  resultsCount,
  categories,
  mobileFilters,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const syncedSearchValue = sanitizeDrugSearchInput((searchParams?.get('search') || '').trim())
  const [searchInput, setSearchInput] = useState(syncedSearchValue)
  const lastSyncedRef = useRef(syncedSearchValue)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const viewMode = ((searchParams?.get('view') || '').trim() === 'list' ? 'list' : 'grid') as
    | 'grid'
    | 'list'

  const tags = useMemo(() => {
    const t: StatusTag[] = []

    const hasPrice = (searchParams?.get('hasPrice') || '').trim()
    const hasImage = (searchParams?.get('hasImage') || '').trim()
    const hasIngredient = (searchParams?.get('hasIngredient') || '').trim()
    const category = (searchParams?.get('category') || '').trim()
    const form = (searchParams?.get('form') || '').trim()
    const sort = (searchParams?.get('sort') || '').trim()
    const view = (searchParams?.get('view') || '').trim()

    if (hasPrice === '1') t.push({ key: 'hasPrice', label: 'بالسعر', value: '1' })
    if (hasImage === '1') t.push({ key: 'hasImage', label: 'بالصور', value: '1' })
    if (hasIngredient === '1') t.push({ key: 'hasIngredient', label: 'بمادة فعالة', value: '1' })

    if (category) {
      const cat = categories.find(x => String(x.id) === category)
      if (cat) t.push({ key: 'category', label: cat.name, value: category })
    }

    if (form) {
      t.push({ key: 'form', label: form, value: form })
    }

    if (sort === 'updatedDesc') t.push({ key: 'sort', label: 'الأحدث', value: sort })
    if (sort === 'nameDesc') t.push({ key: 'sort', label: 'الاسم (ي-أ)', value: sort })
    if (sort === 'nameAsc') t.push({ key: 'sort', label: 'الاسم (أ-ي)', value: sort })
    if (view === 'list') t.push({ key: 'view', label: 'عرض قائمة', value: view })

    return t
  }, [categories, searchParams])

  const hasSearch = !!syncedSearchValue
  const hasFilters = tags.length > 0
  const mobileSummaryTags = useMemo(() => {
    const items: StatusTag[] = []
    if (syncedSearchValue) {
      items.push({ key: 'search', label: `بحث: ${syncedSearchValue}`, value: syncedSearchValue })
    }
    return [...items, ...tags]
  }, [syncedSearchValue, tags])

  const updateQuery = (updates: Record<string, string | null>) => {
    const { queryString, nextUrl } = buildDrugsLabUrl(pathname, searchParams?.toString() || '', updates)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', nextUrl)
      window.dispatchEvent(new CustomEvent(DRUGS_LAB_QUERY_CHANGE_EVENT, { detail: { queryString } }))
    } else {
      router.replace(nextUrl)
    }
  }

  const onClearSearch = () => updateQuery({ search: null })

  useEffect(() => {
    if (syncedSearchValue !== lastSyncedRef.current) {
      lastSyncedRef.current = syncedSearchValue
      if (document.activeElement !== inputRef.current) {
        setSearchInput(syncedSearchValue)
      }
    }
  }, [syncedSearchValue])

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = sanitizeDrugSearchInput(searchInput || '')
      const current = sanitizeDrugSearchInput((searchParams?.get('search') || '').trim())
      if (next !== current) {
        updateQuery({ search: next || null, page: '1' })
      }
    }, 350)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const onClearFilters = () =>
    updateQuery({
      hasPrice: null,
      hasImage: null,
      hasIngredient: null,
      category: null,
      form: null,
      sort: null,
      view: null,
    })

  const onShowAll = () =>
    (() => {
      const { params } = buildDrugsLabUrl(
        pathname,
        searchParams?.toString() || '',
        {
          search: null,
          hasPrice: null,
          hasImage: null,
          hasIngredient: null,
          category: null,
          form: null,
          sort: null,
          filterSearch: null,
          page: null,
        },
        { resetPage: false }
      )
      const queryString = params.toString()
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', nextUrl)
        window.dispatchEvent(new CustomEvent(DRUGS_LAB_QUERY_CHANGE_EVENT, { detail: { queryString } }))
      } else {
        router.replace(nextUrl)
      }
    })()

  const removeFilter = (tag: StatusTag) => {
    if (tag.key === 'search') {
      updateQuery({ search: null })
      return
    }

    if (
      tag.key === 'hasPrice' ||
      tag.key === 'hasImage' ||
      tag.key === 'hasIngredient' ||
      tag.key === 'category' ||
      tag.key === 'form' ||
      tag.key === 'sort' ||
      tag.key === 'view'
    ) {
      updateQuery({ [tag.key]: null })
    }
  }

  return (
    <>
      <div id="drugs-lab-search" className="sticky top-16 z-40 mb-4 lg:hidden">
        <div className="w-full rounded-2xl bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-lg p-3">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                id="drugs-lab-search-input"
                ref={inputRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث عن دواء..."
                className="w-full rounded-xl border border-neutral-200 bg-white pr-10 pl-9 py-2 text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('')
                    updateQuery({ search: null, page: '1' })
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  aria-label="مسح البحث"
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="min-w-[44px] flex items-center justify-end">
              {mobileFilters}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <span>نتائج: {resultsCount}</span>
            {hasFilters ? <span>{tags.length} فلاتر</span> : <span>بدون فلاتر</span>}
          </div>

          {mobileSummaryTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mobileSummaryTags.map((tag, index) => (
                <span
                  key={`${tag.key}-${tag.value || index}`}
                  className={`group flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    tag.key === 'search'
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                      : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
                  }`}
                >
                  <span>{tag.label}</span>
                  <button
                    onClick={() => removeFilter(tag)}
                    className={`rounded-full p-0.5 transition-colors ${
                      tag.key === 'search'
                        ? 'hover:bg-teal-200 dark:hover:bg-teal-800/60'
                        : 'hover:bg-cyan-200 dark:hover:bg-cyan-800/60'
                    }`}
                    aria-label={`إزالة ${tag.label}`}
                    type="button"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-20 z-30 mb-4 hidden lg:block">
        <div className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
              <span className="font-semibold">نطاق البحث</span>
              <span className="text-neutral-400">|</span>
              {hasSearch ? (
                <span className="group flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs">
                  <span>{syncedSearchValue}</span>
                  <button
                    onClick={onClearSearch}
                    className="hover:bg-teal-200 dark:hover:bg-teal-800/60 rounded-full p-0.5 transition-colors"
                    aria-label="إزالة البحث"
                    title="إزالة البحث"
                    type="button"
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
                  <span
                    key={`${t.key}-${i}`}
                    className="group flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-medium"
                  >
                    <span>{t.label}</span>
                    <button
                      onClick={() => removeFilter(t)}
                      className="hover:bg-cyan-200 dark:hover:bg-cyan-800/60 rounded-full p-0.5 transition-colors"
                      aria-label={`إزالة ${t.label}`}
                      type="button"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1">
              <button
                onClick={() => updateQuery({ view: 'grid' })}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                aria-label="عرض شبكي"
                title="عرض شبكي"
                type="button"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateQuery({ view: 'list' })}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                aria-label="عرض قائمة"
                title="عرض قائمة"
                type="button"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onShowAll}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold shadow-md hover:from-teal-700 hover:to-cyan-700"
              type="button"
            >
              عرض الجميع
            </button>

            <button
              onClick={onClearFilters}
              disabled={!hasFilters}
              className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold disabled:opacity-50"
              type="button"
            >
              مسح الفلاتر
            </button>

            <button
              onClick={onClearSearch}
              disabled={!hasSearch}
              className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold disabled:opacity-50"
              type="button"
            >
              إلغاء البحث
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
