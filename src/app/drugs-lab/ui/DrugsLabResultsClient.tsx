'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { EntityThumbnail } from '@/components/ui/EntityImage';
import { Pagination } from '@/components/ui/Pagination';
import {
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  CurrencyPoundIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { DRUGS_LAB_QUERY_CHANGE_EVENT } from '@/lib/search/drugs-lab';

type DrugRow = {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  activeIngredient?: string | null;
  category?: string | null;
  categoryId?: number | null;
  priceText?: string | null;
  updatedAt?: string | Date | null;
  image?: string | null;
};

type ResultsPayload = {
  total: number;
  totalPages: number;
  page: number;
  drugs: DrugRow[];
};

function buildQueryString(sp: URLSearchParams, extra?: Record<string, string | undefined>) {
  const allowedKeys = ['page', 'search', 'category', 'hasPrice', 'hasImage', 'hasIngredient', 'sort', 'form'];
  const out = new URLSearchParams();
  for (const key of allowedKeys) {
    const v = sp.get(key);
    if (v && v.trim()) out.set(key, v);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v && v.trim()) out.set(k, v);
    }
  }
  if (!out.get('limit')) out.set('limit', '24');
  if (!out.get('page')) out.set('page', '1');
  return out.toString();
}

export default function DrugsLabResultsClient({
  initial,
  initialViewMode,
}: {
  initial: ResultsPayload;
  initialViewMode: 'grid' | 'list';
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [data, setData] = useState<ResultsPayload>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const currentSearch = (searchParams?.get('search') || '').trim();

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const didMountRef = useRef(false);
  const lastQueryRef = useRef(buildQueryString(new URLSearchParams(searchParams?.toString() || '')));

  const syncViewMode = (params: URLSearchParams) => {
    const nextView = (params.get('view') || '').trim() === 'list' ? 'list' : 'grid';
    setViewMode(nextView);
  };

  const fetchNow = async (qs: string) => {
    if (qs === lastQueryRef.current) {
      return;
    }

    lastQueryRef.current = qs;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/drugs-lab/search?${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'فشل في جلب نتائج البحث');
      }

      const payload = (await res.json()) as ResultsPayload;
      if (reqId === requestIdRef.current) {
        setData(payload);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'حدث خطأ غير متوقع');
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const syncFromQueryString = (rawQueryString?: string) => {
    const params = new URLSearchParams(rawQueryString || '');
    syncViewMode(params);
    const qs = buildQueryString(params);
    void fetchNow(qs);
  };

  const updatePage = (page: number) => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : searchParams?.toString() || ''
    );
    params.set('page', String(page));
    const qs = params.toString();
    const nextUrl = qs ? `${pathname}?${qs}` : pathname;

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', nextUrl);
      window.dispatchEvent(new CustomEvent(DRUGS_LAB_QUERY_CHANGE_EVENT, { detail: { queryString: qs } }));
      return;
    }

    syncFromQueryString(qs);
  };

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      syncViewMode(new URLSearchParams(searchParams?.toString() || ''));
      return;
    }
    syncFromQueryString(searchParams?.toString() || '');
  }, [pathname, searchParams]);

  useEffect(() => {
    const handler = (event: Event) => {
      const queryString =
        event instanceof CustomEvent && typeof event.detail?.queryString === 'string'
          ? event.detail.queryString
          : typeof window !== 'undefined'
            ? window.location.search
            : searchParams?.toString() || '';
      syncFromQueryString(queryString);
    };
    const handlePopState = () => {
      syncFromQueryString(typeof window !== 'undefined' ? window.location.search : '');
    };
    window.addEventListener(DRUGS_LAB_QUERY_CHANGE_EVENT, handler as EventListener);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener(DRUGS_LAB_QUERY_CHANGE_EVENT, handler as EventListener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [searchParams]);

  return (
    <div className="relative">
      {(loading || error) && (
        <div className="absolute inset-0 z-20 rounded-[2.5rem] bg-white/70 dark:bg-slate-950/55 backdrop-blur-md border border-slate-100/60 dark:border-slate-800/60 flex items-center justify-center">
          <div className="w-full max-w-lg flex flex-col items-center gap-4 px-6 py-6 rounded-[2rem] bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-2xl">
            {loading && (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900/40 border-t-primary-500 animate-spin" />
                <div className="text-center space-y-2">
                  <div className="text-lg font-black text-primary-700 dark:text-primary-300">جاري البحث الآن</div>
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    نرتب النتائج الأقرب أولاً ونمنح الأدوية المصوّرة أولوية أعلى
                  </div>
                </div>
              </>
            )}
            {error && <div className="text-sm font-black text-rose-700 dark:text-rose-300">{error}</div>}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">نتائج البحث</h2>
            <p className="text-xs text-slate-500 font-bold">
              تم العثور على {data.total.toLocaleString('ar-EG')} دواء
              {currentSearch ? ' مع ترتيب المطابقة الأفضل أولاً' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2" />
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {data.drugs.map((drug, index) => (
            <Link key={drug.id} href={`/drugs/${encodeURIComponent(drug.slug)}`} className="group block">
              <Card
                variant="hover"
                className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm hover:shadow-md transition"
                padding="none"
              >
                <div className="grid grid-cols-[72px_1fr] lg:grid-cols-[72px_2fr_1.5fr_1fr_1fr] gap-4 items-center">
                  <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <EntityThumbnail
                      src={drug.image}
                      alt={drug.nameAr}
                      entityType="drug"
                      entityId={drug.id}
                      size="md"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      {currentSearch && index < 3 && (
                        <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full text-[10px] font-black">
                          مطابقة قوية
                        </span>
                      )}
                      {drug.category && (
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2.5 py-1 rounded-full text-[10px] font-black">
                          {drug.category}
                        </span>
                      )}
                      {drug.image && !String(drug.image).startsWith('/images/defaults/') ? (
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold">
                          <PhotoIcon className="w-3 h-3" />
                          مصور
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold">
                          بدون صورة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                        {drug.nameAr}
                      </h3>
                      <span className="hidden lg:inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-extrabold text-sm">
                        التفاصيل
                        <ChevronRightIcon className="w-4 h-4 rotate-180" />
                      </span>
                    </div>
                  </div>

                  <div className="hidden lg:block min-w-0">
                    <div className="flex items-start gap-2">
                      <BeakerIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-bold leading-relaxed">
                        {drug.activeIngredient || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden lg:block" />

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold lg:hidden">السعر</p>
                    <div className="flex items-center gap-2 justify-end lg:justify-start">
                      <CurrencyPoundIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {drug.priceText ? (
                          drug.priceText
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 font-bold italic">غير متوفر</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.drugs.map((drug, index) => (
            <Link key={drug.id} href={`/drugs/${encodeURIComponent(drug.slug)}`} className="group">
              <Card
                variant="hover"
                className="h-full border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 group-hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
                padding="none"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-colors group-hover:bg-primary-500/10" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-sm group-hover:border-primary-100 dark:group-hover:border-primary-900/50 transition-all">
                        <EntityThumbnail
                          src={drug.image}
                          alt={drug.nameAr}
                          entityType="drug"
                          entityId={drug.id}
                          size="md"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {currentSearch && index < 3 && (
                          <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full text-[10px] font-black">
                            أفضل تطابق
                          </span>
                        )}
                        {drug.category && (
                          <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {drug.category}
                          </span>
                        )}
                        {drug.image && !String(drug.image).startsWith('/images/defaults/') ? (
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold">
                            <PhotoIcon className="w-3 h-3" />
                            مصور
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold">
                            صورة افتراضية
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {drug.nameAr}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {drug.activeIngredient && (
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/10 transition-colors">
                        <BeakerIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0 group-hover:text-primary-500 transition-colors" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-bold leading-relaxed">
                          {drug.activeIngredient}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <CurrencyPoundIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {drug.priceText ? (
                            drug.priceText
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500 font-bold italic">غير متوفر</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-extrabold text-sm translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                        <span>التفاصيل</span>
                        <ChevronRightIcon className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data.drugs.length === 0 && !loading && !error && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <MagnifyingGlassIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">لا توجد نتائج مطابقة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">جرّب كلمات مختلفة أو قلّل الفلاتر</p>
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
            صفحة {data.page.toLocaleString('ar-EG')} من {data.totalPages.toLocaleString('ar-EG')}
          </div>
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={updatePage}
            className="rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900"
          />
        </div>
      )}
    </div>
  );
}
