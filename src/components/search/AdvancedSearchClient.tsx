'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { buildSearchTerms, normalizeArabic } from '@/lib/search/arabic-normalization';
import { cn } from '@/lib/utils/cn';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PhotoIcon,
  PlayCircleIcon,
  Squares2X2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
  searchTime?: number;
};

type LoadingContext = 'search' | 'pagination' | 'filters' | 'sorting';

const ENTITY_ORDER = ['section', 'guide', 'hospital', 'clinic', 'lab', 'pharmacy', 'doctor', 'article', 'video', 'tool', 'drug', 'medical_info'];

const ENTITY_LABELS: Record<string, string> = {
  section: 'صفحات الموقع',
  guide: 'الأدلة الطبية',
  hospital: 'المستشفيات',
  clinic: 'العيادات',
  lab: 'المعامل',
  pharmacy: 'الصيدليات',
  doctor: 'الأطباء',
  article: 'المقالات',
  video: 'الفيديوهات',
  tool: 'الأدوات',
  drug: 'الأدوية',
  medical_info: 'المعلومات الطبية',
};

const ENTITY_STYLES: Record<string, { icon: typeof BuildingOffice2Icon; className: string }> = {
  section: { icon: GlobeAltIcon, className: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300' },
  guide: { icon: BookOpenIcon, className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' },
  hospital: { icon: BuildingOffice2Icon, className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
  clinic: { icon: BuildingStorefrontIcon, className: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' },
  lab: { icon: BeakerIcon, className: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300' },
  pharmacy: { icon: ClipboardDocumentListIcon, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' },
  doctor: { icon: UserGroupIcon, className: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300' },
  article: { icon: DocumentTextIcon, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' },
  video: { icon: PlayCircleIcon, className: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300' },
  tool: { icon: WrenchScrewdriverIcon, className: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300' },
  drug: { icon: Squares2X2Icon, className: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300' },
  medical_info: { icon: BookOpenIcon, className: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300' },
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الأكثر صلة' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'popularity', label: 'الأكثر شهرة' },
  { value: 'date', label: 'الأحدث' },
];

const FALLBACK_IMAGE = '/images/hospitals/hospital.jpg';
const RECENT_SEARCHES_STORAGE_KEY = 'mostshfa.recent-searches';
const RECENT_SEARCHES_LIMIT = 8;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeImageFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(img|image|photo|scan|dsc|whatsapp|camera)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildHighlightTerms(queryText: string) {
  return Array.from(
    new Set([
      queryText,
      ...queryText.split(/\s+/),
      ...buildSearchTerms(queryText, 24),
    ])
  )
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
}

function renderNormalizedFallbackHighlight(text: string, queryText: string, className = ''): ReactNode {
  const normalizedTerms = Array.from(
    new Set(
      buildHighlightTerms(queryText)
        .flatMap((term) => normalizeArabic(term).split(' '))
        .filter(Boolean)
    )
  );

  if (normalizedTerms.length === 0) {
    return <>{text}</>;
  }

  return text.split(/(\s+)/).map((part, index) => {
    const normalizedPart = normalizeArabic(part);
    const isMatch =
      normalizedPart.length > 0 &&
      normalizedTerms.some((term) => normalizedPart === term || normalizedPart.includes(term));

    if (!isMatch) {
      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className={cn('rounded-md bg-emerald-100/80 px-1 text-inherit dark:bg-emerald-500/20', className)}
      >
        {part}
      </mark>
    );
  });
}

function renderHighlightedText(text: string | undefined, queryText: string, className = ''): ReactNode {
  if (!text) {
    return null;
  }

  const trimmedQuery = queryText.trim();
  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const terms = buildHighlightTerms(trimmedQuery);
  if (terms.length === 0) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  const hasExactMatch = parts.some((part) =>
    terms.some((term) => part.localeCompare(term, 'ar', { sensitivity: 'accent' }) === 0 || part.toLowerCase() === term.toLowerCase())
  );

  if (!hasExactMatch) {
    return renderNormalizedFallbackHighlight(text, trimmedQuery, className);
  }

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => part.localeCompare(term, 'ar', { sensitivity: 'accent' }) === 0 || part.toLowerCase() === term.toLowerCase());

    if (isMatch) {
      return (
        <mark
          key={`${part}-${index}`}
          className={cn('rounded-md bg-emerald-100/80 px-1 text-inherit dark:bg-emerald-500/20', className)}
        >
          {part}
        </mark>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export default function AdvancedSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const entityParam = searchParams.get('entityTypes') ?? '';
  const sortByParam = searchParams.get('sortBy') ?? 'relevance';
  const sortOrderParam = searchParams.get('sortOrder') ?? 'desc';
  const pageParam = Number(searchParams.get('page') ?? 1);

  const [draftQuery, setDraftQuery] = useState(query);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(entityParam ? entityParam.split(',').filter(Boolean) : []);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [sortOrder, setSortOrder] = useState(sortOrderParam);
  const [page, setPage] = useState(pageParam);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState<LoadingContext>('search');
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [imageSearchStatus, setImageSearchStatus] = useState('');
  const recentSearchesRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToResultsRef = useRef(false);
  const resultsRequestIdRef = useRef(0);

  const persistRecentSearches = useCallback((items: string[]) => {
    setRecentSearches(items);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(items));
    }
  }, []);

  const registerRecentSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      const next = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, RECENT_SEARCHES_LIMIT);
      persistRecentSearches(next);
    },
    [persistRecentSearches, recentSearches]
  );

  const syncUrl = useCallback(
    (
      nextValues?: Partial<{
        q: string;
        entityTypes: string[];
        sortBy: string;
        sortOrder: string;
        page: number;
      }>,
      method: 'push' | 'replace' = 'push'
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQuery = nextValues?.q ?? query;
      const nextEntityTypes = nextValues?.entityTypes ?? selectedEntityTypes;
      const nextSortBy = nextValues?.sortBy ?? sortBy;
      const nextSortOrder = nextValues?.sortOrder ?? sortOrder;
      const nextPage = nextValues?.page ?? page;

      if (nextQuery) {
        params.set('q', nextQuery);
      } else {
        params.delete('q');
      }

      if (nextEntityTypes.length > 0) {
        params.set('entityTypes', nextEntityTypes.join(','));
      } else {
        params.delete('entityTypes');
      }

      if (nextSortBy && nextSortBy !== 'relevance') {
        params.set('sortBy', nextSortBy);
      } else {
        params.delete('sortBy');
      }

      if (nextSortOrder && nextSortOrder !== 'desc') {
        params.set('sortOrder', nextSortOrder);
      } else {
        params.delete('sortOrder');
      }

      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const href = params.toString() ? `/search?${params.toString()}` : '/search';
      if (method === 'replace') {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [page, query, router, searchParams, selectedEntityTypes, sortBy, sortOrder]
  );

  const scrollToResults = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior, block: 'start' });
    });
  }, []);

  const applySearch = useCallback(
    (
      nextQuery: string,
      options?: {
        method?: 'push' | 'replace';
        shouldScrollToResults?: boolean;
        resetFilters?: boolean;
      }
    ) => {
      const method = options?.method ?? 'push';
      const shouldScroll = options?.shouldScrollToResults ?? true;
      const trimmed = nextQuery.trim();
      const shouldResetFilters = options?.resetFilters ?? normalizeArabic(trimmed) !== normalizeArabic(query);
      const nextEntityTypes = shouldResetFilters ? [] : selectedEntityTypes;
      setDraftQuery(trimmed);
      setPage(1);
      setSelectedEntityTypes(nextEntityTypes);
      setShowRecentSearches(false);
      setLoadingContext('search');
      setLoadingElapsedMs(0);
      setLoadingProgress(0);
      setShowLoadingOverlay(true);
      registerRecentSearch(trimmed);
      setRefreshToken((current) => current + 1);
      setSearchTrigger((current) => current + 1);
      shouldScrollToResultsRef.current = false;
      if (shouldScroll) {
        scrollToResults('smooth');
      }
      syncUrl(
        {
          q: trimmed,
          entityTypes: nextEntityTypes,
          page: 1,
        },
        method
      );
    },
    [query, registerRecentSearch, scrollToResults, selectedEntityTypes, syncUrl]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, RECENT_SEARCHES_LIMIT));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    setDraftQuery(query);
    setSelectedEntityTypes(entityParam ? entityParam.split(',').filter(Boolean) : []);
    setSortBy(sortByParam);
    setSortOrder(sortOrderParam);
    setPage(pageParam);
  }, [entityParam, pageParam, query, sortByParam, sortOrderParam]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const requestId = ++resultsRequestIdRef.current;

    const loadResults = async () => {
      if (!query) {
        if (!cancelled && requestId === resultsRequestIdRef.current) {
          setData(null);
          setLoading(false);
          setError('');
        }
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
        params.set('pageSize', '12');
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('refreshToken', String(refreshToken));
        const res = await fetch(`/api/search/universal?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || 'تعذر تحميل نتائج البحث حالياً.');
        }
        if (!cancelled && requestId === resultsRequestIdRef.current) {
          setData(json);
        }
      } catch (fetchError) {
        if (
          !cancelled &&
          requestId === resultsRequestIdRef.current &&
          !(fetchError instanceof DOMException && fetchError.name === 'AbortError')
        ) {
          setError(fetchError instanceof Error ? fetchError.message : 'تعذر تحميل نتائج البحث حالياً.');
        }
      } finally {
        if (!cancelled && requestId === resultsRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void loadResults();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, query, refreshToken, searchTrigger, selectedEntityTypes, sortBy, sortOrder]);

  useEffect(() => {
    if (loading) {
      setShowLoadingOverlay(true);
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setLoadingElapsedMs(elapsed);
        setLoadingProgress((previous) => {
          const target = Math.min(94, 18 + elapsed / 32);
          return target > previous ? target : previous;
        });
      }, 120);

      return () => {
        window.clearInterval(timer);
      };
    }

    setLoadingElapsedMs(0);
    if (!showLoadingOverlay) {
      setLoadingProgress(0);
      return;
    }

    setLoadingProgress(100);
    const timer = window.setTimeout(() => {
      setShowLoadingOverlay(false);
      setLoadingProgress(0);
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loading, showLoadingOverlay]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentSearchesRef.current && !recentSearchesRef.current.contains(event.target as Node)) {
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (imageSearchPreview) {
        URL.revokeObjectURL(imageSearchPreview);
      }
    };
  }, [imageSearchPreview]);

  useEffect(() => {
    if (!loading && data && shouldScrollToResultsRef.current) {
      scrollToResults('smooth');
      shouldScrollToResultsRef.current = false;
    }
  }, [data, loading, scrollToResults]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    (data?.results ?? []).forEach((result) => {
      const current = groups.get(result.entityType) ?? [];
      current.push(result);
      groups.set(result.entityType, current);
    });

    return ENTITY_ORDER.filter((entityType) => groups.has(entityType)).map((entityType) => ({
      key: entityType,
      label: ENTITY_LABELS[entityType] ?? entityType,
      items: groups.get(entityType) ?? [],
    }));
  }, [data?.results]);

  const totalResults = data?.pagination.total ?? 0;
  const suggestionItems = data?.suggestions ?? [];
  const facetItems = data?.facets.entityTypes ?? [];
  const activeFilterCount = selectedEntityTypes.length;
  const activeQuery = query;
  const hasRenderedResults = Boolean(activeQuery) && (Boolean(data) || loading || Boolean(error));
  const loadingSeconds = Math.max(0.1, loadingElapsedMs / 1000).toFixed(1);
  const loadingLabel =
    loadingContext === 'pagination'
      ? 'نحمّل الصفحة التالية من النتائج...'
      : loadingContext === 'filters'
        ? 'نحدّث النتائج حسب التصفية...'
        : loadingContext === 'sorting'
          ? 'نرتب النتائج من جديد...'
          : 'نجلب نتائج البحث الحالية...';
  const filteredRecentSearches = recentSearches.filter((item) => {
    const trimmedDraft = draftQuery.trim();
    if (!trimmedDraft) {
      return true;
    }

    return item.includes(trimmedDraft);
  });

  const toggleEntityType = (type: string) => {
    const next = new Set(selectedEntityTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }

    const nextValues = Array.from(next);
    setSelectedEntityTypes(nextValues);
    setPage(1);
    setLoadingContext('filters');
    setLoadingElapsedMs(0);
    setLoadingProgress(0);
    setShowLoadingOverlay(true);
    shouldScrollToResultsRef.current = false;
    scrollToResults('smooth');
    syncUrl({
      q: query,
      entityTypes: nextValues,
      page: 1,
    });
  };

  const clearFilters = () => {
    setSelectedEntityTypes([]);
    setPage(1);
    setLoadingContext('filters');
    setLoadingElapsedMs(0);
    setLoadingProgress(0);
    setShowLoadingOverlay(true);
    shouldScrollToResultsRef.current = false;
    scrollToResults('smooth');
    syncUrl({
      q: query,
      entityTypes: [],
      page: 1,
    });
  };

  const handleVoiceResult = useCallback(
    (spokenQuery: string) => {
      const normalizedQuery = spokenQuery.trim();
      if (!normalizedQuery) {
        return;
      }

      setDraftQuery(normalizedQuery);
      setShowRecentSearches(false);
    },
    []
  );

  const { isListening, isSupported: supportsVoiceSearch, transcript, startListening, stopListening } = useVoiceSearch({
    onResult: handleVoiceResult,
    language: 'ar-EG',
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch(draftQuery, { method: 'push' });
  };

  const handleImageSearch = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setShowRecentSearches(false);
      setIsImageSearching(true);
      setImageSearchStatus('نقرأ الصورة الآن...');

      setImageSearchPreview((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return URL.createObjectURL(file);
      });

      const fallbackQuery = sanitizeImageFileName(file.name);
      let extractedQuery = '';

      try {
        const BarcodeDetectorCtor = (window as Window & { BarcodeDetector?: any }).BarcodeDetector;
        if (BarcodeDetectorCtor && typeof createImageBitmap === 'function') {
          const bitmap = await createImageBitmap(file);
          try {
            const detector = new BarcodeDetectorCtor({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
            });
            const barcodes = await detector.detect(bitmap);
            extractedQuery = String(barcodes?.[0]?.rawValue || '').trim();
          } finally {
            bitmap.close();
          }
        }
      } catch {
        extractedQuery = '';
      }

      if (!extractedQuery && fallbackQuery.length >= 3) {
        extractedQuery = fallbackQuery;
      }

      if (extractedQuery) {
        setDraftQuery(extractedQuery);
        setImageSearchStatus(`تم استخراج: ${extractedQuery}. اضغط بحث لعرض النتائج.`);
      } else {
        setImageSearchStatus('تعذر استخراج باركود أو اسم واضح من الصورة، جرّب صورة أوضح أو اكتب الاسم.');
      }

      event.target.value = '';
      setIsImageSearching(false);
    },
    []
  );

  return (
    <section className="relative space-y-5">
      <div className="relative rounded-[32px] border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/90 to-sky-50/85 shadow-xl shadow-emerald-100/60 transition-colors dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 dark:shadow-none">
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-56 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)] sm:block dark:bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),_transparent_70%)]" />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-5 h-24 w-24 text-emerald-200/80 sm:left-8 sm:top-8 sm:h-40 sm:w-40 dark:text-white/5" />
        <div className="relative z-10 p-5 md:p-8">
          <div className="flex justify-center">
            <div className="space-y-2 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-emerald-200">
                <MagnifyingGlassIcon className="h-4 w-4" />
                البحث العام
              </span>
              <h2 className="text-3xl font-black md:text-5xl">
                <span className="text-sky-600 dark:text-sky-300">مستشفى</span>{' '}
                <span className="text-rose-500 dark:text-rose-300">دوت</span>{' '}
                <span className="text-emerald-600 dark:text-emerald-300">كوم</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 md:text-base dark:text-slate-300">
                الدليل الاول لجميع الخدمات الطبية في مصر والوطن العربي
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSearch}
            />
            <div ref={recentSearchesRef} className="relative z-30">
              <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/75 p-2 shadow-lg shadow-emerald-100/50 backdrop-blur md:flex-row dark:border-white/10 dark:bg-slate-950/50 dark:shadow-none">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500 dark:text-emerald-300" />
                  <input
                    value={draftQuery}
                    onChange={(event) => setDraftQuery(event.target.value)}
                    onFocus={() => setShowRecentSearches(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setShowRecentSearches(false);
                      }
                    }}
                    placeholder="ابحث هنا"
                    inputMode="search"
                    enterKeyHint="search"
                    className="h-14 w-full rounded-[22px] border border-white/70 bg-white pr-12 pl-24 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100/80 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10"
                  />
                  <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    {supportsVoiceSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isListening) {
                            stopListening();
                          } else {
                            startListening();
                            setShowRecentSearches(false);
                          }
                        }}
                        className={cn(
                          'inline-flex h-9 w-9 items-center justify-center rounded-full border transition',
                          isListening
                            ? 'border-red-200 bg-red-50 text-red-600 shadow-sm shadow-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                            : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
                        )}
                        aria-label={isListening ? 'إيقاف البحث الصوتي' : 'تشغيل البحث الصوتي'}
                      >
                        <MicrophoneIcon className={cn('h-4 w-4', isListening && 'animate-pulse')} />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isImageSearching}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-600 transition hover:border-sky-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                      aria-label="بحث بالصورة"
                    >
                      {isImageSearching ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PhotoIcon className="h-4 w-4" />}
                    </button>

                    {draftQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftQuery('');
                          setData(null);
                          setShowRecentSearches(false);
                          syncUrl({ q: '', page: 1 }, 'replace');
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label="مسح البحث"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-14 items-center justify-center rounded-[22px] bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 md:min-w-[140px]"
                >
                  بحث
                </button>
              </div>

              {supportsVoiceSearch && (isListening || transcript) ? (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur dark:border-emerald-500/20 dark:bg-slate-950/60">
                  <span className={cn('inline-flex h-2.5 w-2.5 rounded-full', isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')} />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {isListening ? 'جاري الاستماع…' : 'تم التقاط النص الصوتي'}
                  </span>
                  {transcript ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                      {transcript}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {imageSearchStatus ? (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur dark:border-sky-500/20 dark:bg-slate-950/60">
                  {imageSearchPreview ? (
                    <img src={imageSearchPreview} alt="معاينة الصورة" className="h-10 w-10 rounded-xl object-cover" />
                  ) : null}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{imageSearchStatus}</span>
                </div>
              ) : null}

              {showRecentSearches && filteredRecentSearches.length > 0 ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-full overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-2xl md:max-w-[760px] dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">آخر ما بحثت عنه</p>
                    <button
                      type="button"
                      onClick={() => persistRecentSearches([])}
                      className="text-xs font-semibold text-slate-500 transition hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
                    >
                      مسح السجل
                    </button>
                  </div>
                  <div className="px-3 py-3.5">
                    <div className="grid gap-2">
                      {filteredRecentSearches.map((recentSearch) => (
                        <button
                          key={`recent-search-${recentSearch}`}
                          type="button"
                          onClick={() => applySearch(recentSearch, { method: 'push' })}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-right transition hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-700 dark:hover:border-emerald-500/40 dark:hover:bg-slate-800/70"
                        >
                          <span className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                            <span className="line-clamp-1">{recentSearch}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">بحث سابق</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div ref={resultsRef} className="relative space-y-4 scroll-mt-24">
        {showLoadingOverlay && hasRenderedResults ? (
          <div className="pointer-events-none absolute inset-0 z-20 rounded-[28px] bg-white/65 backdrop-blur-[2px] dark:bg-slate-950/65">
            <div className="sticky top-24 mx-auto flex w-full justify-center px-4 pt-6">
              <div className="pointer-events-none flex min-w-[280px] max-w-md items-center gap-3 rounded-3xl border border-emerald-200/80 bg-white/95 px-5 py-4 shadow-2xl shadow-emerald-100/60 dark:border-emerald-500/20 dark:bg-slate-900/95 dark:shadow-none">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">{loadingLabel}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    البحث عن: {activeQuery || draftQuery || '...'} · {loading ? loadingSeconds : 'اكتمل'}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {activeQuery ? `${totalResults} نتيجة` : 'ابدأ بالبحث'}
              </span>
              {typeof data?.searchTime === 'number' && activeQuery ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {data.searchTime} ms
                </span>
              ) : null}
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:text-slate-200"
                >
                  مسح التصفية
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={sortBy}
                onChange={(event) => {
                  const next = event.target.value;
                  setSortBy(next);
                  setPage(1);
                  setLoadingContext('sorting');
                  setLoadingElapsedMs(0);
                  setLoadingProgress(0);
                  setShowLoadingOverlay(true);
                  shouldScrollToResultsRef.current = false;
                  scrollToResults('smooth');
                  syncUrl({ q: query, sortBy: next, page: 1 });
                }}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const next = sortOrder === 'asc' ? 'desc' : 'asc';
                  setSortOrder(next);
                  setPage(1);
                  setLoadingContext('sorting');
                  setLoadingElapsedMs(0);
                  setLoadingProgress(0);
                  setShowLoadingOverlay(true);
                  shouldScrollToResultsRef.current = false;
                  scrollToResults('smooth');
                  syncUrl({ q: query, sortOrder: next, page: 1 });
                }}
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:text-slate-100"
              >
                {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
              </button>
            </div>
          </div>

          {facetItems.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-bold transition',
                  activeFilterCount === 0
                    ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                )}
              >
                الكل
              </button>
              {facetItems.map((facet) => {
                const active = selectedEntityTypes.includes(facet.type);
                return (
                  <button
                    key={facet.type}
                    type="button"
                    onClick={() => toggleEntityType(facet.type)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-bold transition',
                      active
                        ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-300'
                        : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                    )}
                  >
                    {facet.label} {facet.count}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {!activeQuery ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">ابدأ البحث</h3>
          </div>
        ) : loading ? (
          <SearchResultsSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">تعذر تحميل النتائج</h3>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">لا توجد نتائج</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">جرّب عبارة أبسط أو اختر اقتراحًا قريبًا.</p>
          </div>
        ) : (
          groupedResults.map((group) => {
            const GroupIcon = ENTITY_STYLES[group.key]?.icon ?? BuildingOffice2Icon;

            return (
              <div key={group.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', ENTITY_STYLES[group.key]?.className ?? 'bg-slate-100 text-slate-600')}>
                    <GroupIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{group.label}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{group.items.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {group.items.map((result) => {
                    const style = ENTITY_STYLES[result.entityType];
                    const Icon = style?.icon ?? BuildingOffice2Icon;

                    return (
                      <Link
                        key={`${result.entityType}-${result.entityId}`}
                        href={result.url}
                        className="group flex gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-primary-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-slate-800">
                          {result.image && result.entityType !== 'guide' && result.entityType !== 'section' ? (
                            <img
                              src={result.image}
                              alt={result.title}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (!target.src.includes(FALLBACK_IMAGE)) {
                                  target.src = FALLBACK_IMAGE;
                                }
                              }}
                            />
                          ) : (
                            <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', style?.className ?? 'bg-slate-100 text-slate-600')}>
                              <Icon className="h-5 w-5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-black leading-7 text-slate-900 transition group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-300">
                              {renderHighlightedText(result.title, activeQuery)}
                            </h4>
                            {result.isFeatured ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                مميز
                              </span>
                            ) : null}
                          </div>

                          {result.excerpt ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                              {renderHighlightedText(result.excerpt, activeQuery)}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              {result.category ?? ENTITY_LABELS[result.entityType] ?? result.entityType}
                            </span>
                            {typeof result.rating === 'number' && result.rating > 0 ? <span>{result.rating.toFixed(1)}</span> : null}
                            {result.ratingCount ? <span>{result.ratingCount}</span> : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {activeQuery && data?.pagination.totalPages && data.pagination.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              disabled={!data.pagination.hasPrev}
              onClick={() => {
                const nextPage = Math.max(1, page - 1);
                setPage(nextPage);
                setLoadingContext('pagination');
                setLoadingElapsedMs(0);
                setLoadingProgress(0);
                setShowLoadingOverlay(true);
                shouldScrollToResultsRef.current = false;
                scrollToResults('smooth');
                syncUrl({ q: query, page: nextPage });
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"
            >
              السابقة
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {data.pagination.page} / {data.pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!data.pagination.hasNext}
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                setLoadingContext('pagination');
                setLoadingElapsedMs(0);
                setLoadingProgress(0);
                setShowLoadingOverlay(true);
                shouldScrollToResultsRef.current = false;
                scrollToResults('smooth');
                syncUrl({ q: query, page: nextPage });
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"
            >
              التالية
            </button>
          </div>
        ) : null}

        {activeQuery && suggestionItems.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap gap-2">
              {suggestionItems.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySearch(suggestion, { method: 'push' })}
                  className="max-w-full rounded-full border border-slate-200 px-3 py-2 text-right text-xs font-bold leading-5 text-slate-700 transition hover:border-primary-200 hover:text-primary-700 whitespace-normal break-words dark:border-slate-700 dark:text-slate-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
