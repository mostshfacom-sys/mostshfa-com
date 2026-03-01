'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import {
  BeakerIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  SparklesIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

type SearchResult = {
  entityId: string;
  title: string;
  excerpt?: string;
  image?: string | null;
  rating?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  slug?: string;
  createdAt?: string;
  views?: number;
  usageCount?: number;
  toolType?: string;
  activeIngredient?: string;
  category?: string;
  entityType: string;
  url: string;
};

type SearchFacets = {
  entityTypes: Array<{ type: string; count: number; label: string }>;
  ratings: Array<{ range: string; count: number }>;
  featured: number;
};

type SearchResponse = {
  results: SearchResult[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  facets: SearchFacets;
  suggestions: string[];
  query: string;
};

const ENTITY_ORDER = ['guide', 'hospital', 'clinic', 'lab', 'pharmacy', 'article', 'tool', 'drug'];

const ENTITY_LABELS: Record<string, string> = {
  hospital: 'المستشفيات',
  clinic: 'العيادات',
  lab: 'المعامل',
  pharmacy: 'الصيدليات',
  article: 'المقالات',
  tool: 'الأدوات',
  drug: 'الأدوية',
  guide: 'الأدلة الطبية',
};

const ENTITY_STYLES: Record<string, { icon: typeof BuildingOffice2Icon; className: string }> = {
  guide: { icon: BookOpenIcon, className: 'bg-emerald-50 text-emerald-600' },
  hospital: { icon: BuildingOffice2Icon, className: 'bg-blue-50 text-blue-600' },
  clinic: { icon: BuildingStorefrontIcon, className: 'bg-indigo-50 text-indigo-600' },
  lab: { icon: BeakerIcon, className: 'bg-purple-50 text-purple-600' },
  pharmacy: { icon: ClipboardDocumentListIcon, className: 'bg-amber-50 text-amber-600' },
  article: { icon: DocumentTextIcon, className: 'bg-rose-50 text-rose-600' },
  tool: { icon: WrenchScrewdriverIcon, className: 'bg-cyan-50 text-cyan-600' },
  drug: { icon: Squares2X2Icon, className: 'bg-slate-50 text-slate-600' },
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الأكثر صلة' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'popularity', label: 'الأكثر شهرة' },
  { value: 'date', label: 'الأحدث' },
];

const FALLBACK_IMAGE = '/images/hospitals/hospital.jpg';

export default function AdvancedSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const entityParam = searchParams.get('entityTypes') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'relevance';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  const minRating = Number(searchParams.get('minRating') ?? 0);
  const featuredOnly = searchParams.get('featured') === 'true';
  const page = Number(searchParams.get('page') ?? 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);

  const selectedEntityTypes = useMemo(() => {
    if (!entityParam) return [];
    return entityParam.split(',').filter(Boolean);
  }, [entityParam]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    const next = params.toString();
    router.push(next ? `/search?${next}` : '/search');
  };

  useEffect(() => {
    const loadResults = async () => {
      if (!query) {
        setData(null);
        setLoading(false);
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('query', query);
        if (selectedEntityTypes.length > 0) {
          params.set('entityTypes', selectedEntityTypes.join(','));
        }
        params.set('page', String(page));
        params.set('pageSize', '20');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        const res = await fetch(`/api/search/universal?${params.toString()}`);
        if (!res.ok) throw new Error('search_failed');
        const json = await res.json();
        setData(json);
      } catch {
        setError('تعذر تحميل نتائج البحث حالياً.');
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [query, selectedEntityTypes, sortBy, sortOrder, page]);

  const filteredResults = useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter((result) => {
      const ratingOk = minRating ? (result.rating ?? 0) >= minRating : true;
      const featuredOk = featuredOnly ? Boolean(result.isFeatured) : true;
      return ratingOk && featuredOk;
    });
  }, [data, minRating, featuredOnly]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    filteredResults.forEach((result) => {
      const key = result.entityType;
      const current = groups.get(key) ?? [];
      current.push(result);
      groups.set(key, current);
    });
    return ENTITY_ORDER.filter((key) => groups.has(key)).map((key) => ({
      key,
      label: ENTITY_LABELS[key] ?? key,
      items: groups.get(key) ?? [],
    }));
  }, [filteredResults]);

  const totalResults = data?.pagination?.total ?? filteredResults.length;
  const suggestionItems = data?.suggestions ?? [];
  const facetItems = data?.facets?.entityTypes ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-fit">
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-900 mb-2">التصنيفات</p>
          <div className="space-y-2">
            {(data?.facets?.entityTypes ?? []).map((facet) => {
              const active = selectedEntityTypes.includes(facet.type);
              const style = ENTITY_STYLES[facet.type];
              const Icon = style?.icon ?? BuildingOffice2Icon;
              return (
                <button
                  key={facet.type}
                  type="button"
                  onClick={() => {
                    const next = new Set(selectedEntityTypes);
                    if (active) {
                      next.delete(facet.type);
                    } else {
                      next.add(facet.type);
                    }
                    updateParams({
                      entityTypes: next.size ? Array.from(next).join(',') : undefined,
                      page: 1,
                    });
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', style?.className ?? 'bg-gray-100 text-gray-600')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{facet.label}</span>
                  </span>
                  <span className="text-xs text-gray-500">{facet.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-900 mb-2">التقييم</p>
          <div className="flex flex-wrap gap-2">
            {[0, 3, 4, 5].map((value) => {
              const label = value === 0 ? 'الكل' : `${value}+`;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateParams({ minRating: value || undefined, page: 1 })}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    minRating === value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <button
            type="button"
            onClick={() => updateParams({ featured: featuredOnly ? undefined : 'true', page: 1 })}
            className={cn(
              'w-full rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              featuredOnly
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            العناصر المميزة
          </button>
        </div>

        {data?.suggestions?.length ? (
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">اقتراحات البحث</p>
            <div className="flex flex-wrap gap-2">
              {data.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => updateParams({ q: suggestion, page: 1 })}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">عدد النتائج</p>
            <p className="text-lg font-semibold text-gray-900">{query ? totalResults : 0}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(event) => updateParams({ sortBy: event.target.value, page: 1 })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc', page: 1 })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
            </button>
          </div>
        </div>

        {query ? (
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => updateParams({ entityTypes: undefined, minRating: undefined, featured: undefined, page: 1 })}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-2',
                selectedEntityTypes.length === 0 && !featuredOnly && minRating === 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200'
              )}
            >
              <Squares2X2Icon className="h-4 w-4" />
              الكل
            </button>
            {(data?.facets?.entityTypes ?? []).map((facet) => {
              const active = selectedEntityTypes.includes(facet.type);
              const style = ENTITY_STYLES[facet.type];
              const Icon = style?.icon ?? BuildingOffice2Icon;
              return (
                <button
                  key={`top-${facet.type}`}
                  type="button"
                  onClick={() => {
                    const next = new Set(selectedEntityTypes);
                    if (active) {
                      next.delete(facet.type);
                    } else {
                      next.add(facet.type);
                    }
                    updateParams({
                      entityTypes: next.size ? Array.from(next).join(',') : undefined,
                      page: 1,
                    });
                  }}
                  className={cn(
                    'px-3 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-2',
                    active
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200'
                  )}
                >
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', style?.className ?? 'bg-gray-100 text-gray-600')}>
                    <Icon className="h-3 w-3" />
                  </span>
                  {facet.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => updateParams({ featured: featuredOnly ? undefined : 'true', page: 1 })}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-2',
                featuredOnly
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-200'
              )}
            >
              <SparklesIcon className="h-4 w-4" />
              مميز
            </button>
            <button
              type="button"
              onClick={() => updateParams({ minRating: minRating === 4 ? undefined : 4, page: 1 })}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-2',
                minRating === 4
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-200'
              )}
            >
              <StarIcon className="h-4 w-4" />
              تقييم 4+
            </button>
          </div>
        ) : null}

        {query && (suggestionItems.length > 0 || facetItems.length > 0) ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
            {suggestionItems.length > 0 ? (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                    <SparklesIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">اقتراحات ذكية</p>
                    <p className="text-xs text-indigo-500">جرّب هذه النتائج المقترحة</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestionItems.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => updateParams({ q: suggestion, page: 1 })}
                      className="px-3 py-2 rounded-full text-xs font-semibold bg-white text-indigo-700 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {facetItems.length > 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-4">استكشف حسب التصنيف</p>
                <div className="grid grid-cols-2 gap-3">
                  {facetItems.slice(0, 6).map((facet) => {
                    const style = ENTITY_STYLES[facet.type];
                    const Icon = style?.icon ?? BuildingOffice2Icon;
                    return (
                      <button
                        key={facet.type}
                        type="button"
                        onClick={() =>
                          updateParams({
                            entityTypes: facet.type,
                            page: 1,
                          })
                        }
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-right hover:border-primary-200 hover:shadow-sm transition"
                      >
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', style?.className ?? 'bg-gray-100 text-gray-600')}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{facet.label}</p>
                          <p className="text-[11px] text-gray-500">{facet.count} نتيجة</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!query ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ابدأ البحث الآن</h3>
            <p className="text-gray-500">اكتب كلمة بحث لتظهر النتائج والتصنيفات المقترحة.</p>
          </div>
        ) : loading ? (
          <SearchResultsSkeleton />
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">تعذر تحميل النتائج</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-500">جرّب كلمات أخرى أو أزل بعض الفلاتر.</p>
          </div>
        ) : (
          groupedResults.map((group) => (
            <div key={group.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{group.label}</h2>
                <span className="text-sm text-gray-500">{group.items.length}</span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {group.items.map((result) => (
                  (() => {
                    const style = ENTITY_STYLES[result.entityType];
                    const Icon = style?.icon ?? BuildingOffice2Icon;
                    return (
                  <Link
                    key={`${result.entityType}-${result.entityId}`}
                    href={result.url}
                    className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {result.image && result.entityType !== 'guide' ? (
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (target.src.includes(FALLBACK_IMAGE)) return;
                            target.src = FALLBACK_IMAGE;
                          }}
                        />
                      ) : (
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', style?.className ?? 'bg-primary-100 text-primary-600')}>
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                          {result.title}
                        </h3>
                        {result.isFeatured ? (
                          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            مميز
                          </span>
                        ) : null}
                      </div>
                      {result.excerpt ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.excerpt}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {result.category ?? ENTITY_LABELS[result.entityType] ?? result.entityType}
                        </span>
                        {typeof result.rating === 'number' && result.rating > 0 ? (
                          <span>التقييم {result.rating.toFixed(1)}</span>
                        ) : null}
                        {result.ratingCount ? <span>{result.ratingCount} تقييم</span> : null}
                      </div>
                    </div>
                  </Link>
                    );
                  })()
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
