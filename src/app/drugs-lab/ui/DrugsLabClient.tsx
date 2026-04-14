'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityThumbnail } from '@/components/ui/EntityImage';

type Category = {
  id: number;
  name: string;
  _count?: {
    drugs: number;
  };
};

type DrugRow = {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  activeIngredient?: string | null;
  category?: string;
  priceText?: string | null;
  updatedAt?: string;
  image?: string | null;
};

type ApiResponse = {
  total: number;
  totalPages: number;
  page: number;
  drugs: DrugRow[];
};

type SortKey = 'nameAsc' | 'nameDesc' | 'updatedDesc';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'nameAsc', label: 'الاسم (أ - ي)' },
  { value: 'nameDesc', label: 'الاسم (ي - أ)' },
  { value: 'updatedDesc', label: 'الأحدث تحديثاً' },
];

function toBool(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) sp.set(key, value);
  });
  return sp.toString();
}

function formatPriceLabel(value: string | null | undefined) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return 'بدون سعر';
  if (trimmed === '0' || trimmed === '0.0' || trimmed === '0.00') return 'بدون سعر';
  return trimmed;
}

export default function DrugsLabClient({
  categories,
  initialSearchParams,
}: {
  categories: Category[];
  initialSearchParams: {
    page?: string;
    search?: string;
    category?: string;
    hasPrice?: string;
    hasImage?: string;
    sort?: string;
  };
}) {
  const router = useRouter();
  const urlParams = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState(initialSearchParams.search ?? '');
  const [categoryId, setCategoryId] = useState(initialSearchParams.category ?? '');
  const [hasPrice, setHasPrice] = useState(toBool(initialSearchParams.hasPrice));
  const [hasImage, setHasImage] = useState(toBool(initialSearchParams.hasImage));
  const [sort, setSort] = useState<SortKey>((initialSearchParams.sort as SortKey) || 'nameAsc');

  const debouncedSearch = useDebounce(search, 250);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = useMemo(() => {
    const pageValue = urlParams.get('page') || initialSearchParams.page || '1';
    const parsed = Number(pageValue);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
  }, [urlParams, initialSearchParams.page]);

  const activeCategory = useMemo(() => {
    const id = Number(categoryId);
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  }, [categoryId, categories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (b._count?.drugs ?? 0) - (a._count?.drugs ?? 0));
  }, [categories]);

  const queryString = useMemo(() => {
    return buildQueryString({
      page: String(page),
      limit: '24',
      search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      category: categoryId || undefined,
      hasPrice: hasPrice ? '1' : undefined,
      hasImage: hasImage ? '1' : undefined,
      sort,
    });
  }, [page, debouncedSearch, categoryId, hasPrice, hasImage, sort]);

  useEffect(() => {
    let canceled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/drugs?${queryString}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'فشل في جلب الأدوية');
        }

        const payload = (await res.json()) as ApiResponse;
        if (!canceled) setData(payload);
      } catch (e: any) {
        if (!canceled) setError(e?.message || 'حدث خطأ غير متوقع');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void run();

    return () => {
      canceled = true;
    };
  }, [queryString]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFiltersOpen]);

  const pushUrl = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(urlParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) sp.set(key, value);
      else sp.delete(key);
    });

    router.push(sp.toString() ? `/drugs-lab?${sp.toString()}` : '/drugs-lab');
  };

  const resetToFirstPage = () => {
    pushUrl({ page: '1' });
  };

  const applyFilters = (patch: Partial<{ categoryId: string; hasPrice: boolean; hasImage: boolean; sort: SortKey }>) => {
    if (typeof patch.categoryId === 'string') setCategoryId(patch.categoryId);
    if (typeof patch.hasPrice === 'boolean') setHasPrice(patch.hasPrice);
    if (typeof patch.hasImage === 'boolean') setHasImage(patch.hasImage);
    if (typeof patch.sort === 'string') setSort(patch.sort);

    pushUrl({
      page: '1',
      search: search.trim() ? search.trim() : undefined,
      category: typeof patch.categoryId === 'string' ? patch.categoryId : categoryId || undefined,
      hasPrice: (typeof patch.hasPrice === 'boolean' ? patch.hasPrice : hasPrice) ? '1' : undefined,
      hasImage: (typeof patch.hasImage === 'boolean' ? patch.hasImage : hasImage) ? '1' : undefined,
      sort: typeof patch.sort === 'string' ? patch.sort : sort,
    });
  };

  const applySearch = (value: string) => {
    setSearch(value);
    pushUrl({
      page: '1',
      search: value.trim() ? value.trim() : undefined,
    });
  };

  const canPrev = (data?.page ?? 1) > 1;
  const canNext = (data?.page ?? 1) < (data?.totalPages ?? 1);

  const FiltersContent = (
    <>
      <Card className="mb-4" padding="lg">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">التصنيفات</h2>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => applyFilters({ categoryId: '' })}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm border transition-colors ${
              !categoryId
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white/70 text-slate-700 border-slate-200 hover:border-primary-200 hover:text-primary-700 dark:bg-slate-900/50 dark:text-slate-200 dark:border-white/10 dark:hover:border-primary-400/30'
            }`}
          >
            <span>كل الأدوية</span>
            <span className={`${!categoryId ? 'text-primary-100' : 'text-slate-400 dark:text-slate-400'}`}>
              {categories.reduce((acc, c) => acc + (c._count?.drugs ?? 0), 0)}
            </span>
          </button>

          {categories.slice(0, 30).map((cat) => {
            const active = categoryId === String(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => applyFilters({ categoryId: String(cat.id) })}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm border transition-colors ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white/70 text-slate-700 border-slate-200 hover:border-primary-200 hover:text-primary-700 dark:bg-slate-900/50 dark:text-slate-200 dark:border-white/10 dark:hover:border-primary-400/30'
                }`}
              >
                <span className="text-right line-clamp-1">{cat.name}</span>
                <span className={`${active ? 'text-primary-100' : 'text-slate-400 dark:text-slate-400'}`}>
                  {cat._count?.drugs ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {categories.length > 30 && (
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">يتم عرض أشهر 30 تصنيفاً فقط في النسخة التجريبية.</div>
        )}
      </Card>

      <Card padding="lg">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">فلترة سريعة</h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
            <span>فقط الأدوية بأسعار</span>
            <input
              type="checkbox"
              checked={hasPrice}
              onChange={(e) => applyFilters({ hasPrice: e.target.checked })}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
            <span>فقط الأدوية بصور</span>
            <input
              type="checkbox"
              checked={hasImage}
              onChange={(e) => applyFilters({ hasImage: e.target.checked })}
              className="h-4 w-4"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">ترتيب النتائج</label>
            <select
              value={sort}
              onChange={(e) => applyFilters({ sort: e.target.value as SortKey })}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryId('');
              setHasPrice(false);
              setHasImage(false);
              setSort('nameAsc');
              setMobileFiltersOpen(false);
              router.push('/drugs-lab');
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 transition-colors dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-primary-400/30"
          >
            مسح الفلاتر
          </button>
        </div>
      </Card>
    </>
  );

  return (
    <>
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="فلاتر دليل الأدوية"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="إغلاق الفلاتر"
          />
          <div className="absolute right-0 top-0 h-full w-[92%] max-w-[380px] bg-slate-50 dark:bg-slate-950 overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">الفلاتر</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                إغلاق
              </button>
            </div>

            {FiltersContent}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-96px)] lg:overflow-auto">
          {FiltersContent}
        </aside>

        <section>
          <Card className="mb-4" padding="lg">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">بحث سريع</label>
                <div className="flex gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applySearch(search);
                    }}
                    placeholder="اكتب اسم الدواء أو المادة الفعالة..."
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => applySearch(search)}
                    className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                  >
                    بحث
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>التصنيف:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{activeCategory ? activeCategory.name : 'الكل'}</span>
                  {hasPrice && <Badge variant="success" size="sm">أسعار</Badge>}
                  {hasImage && <Badge variant="info" size="sm">صور</Badge>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">الفلاتر</span>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 transition-colors dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    المزيد
                  </button>
                </div>

                <select
                  value={categoryId || ''}
                  onChange={(e) => applyFilters({ categoryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200"
                >
                  <option value="">كل التصنيفات</option>
                  {sortedCategories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name} ({cat._count?.drugs ?? 0})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
                    <span>أسعار</span>
                    <input
                      type="checkbox"
                      checked={hasPrice}
                      onChange={(e) => applyFilters({ hasPrice: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
                    <span>صور</span>
                    <input
                      type="checkbox"
                      checked={hasImage}
                      onChange={(e) => applyFilters({ hasImage: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </label>
                </div>

                <select
                  value={sort}
                  onChange={(e) => applyFilters({ sort: e.target.value as SortKey })}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCategoryId('');
                      setHasPrice(false);
                      setHasImage(false);
                      setSort('nameAsc');
                      router.push('/drugs-lab');
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 transition-colors dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    مسح
                  </button>
                  <Link
                    href="/drugs"
                    className="flex-1 text-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 transition-colors dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                  >
                    الصفحة الحالية
                  </Link>
                </div>
              </div>
            </div>
          </Card>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {loading && <span>جاري تحميل النتائج...</span>}
            {!loading && data && (
              <span>
                عرض صفحة {data.page} من {data.totalPages} — إجمالي {data.total.toLocaleString('ar-EG')} دواء
              </span>
            )}
            {!loading && !data && !error && <span>جاهز للبحث</span>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!canPrev) return;
                pushUrl({ page: String(page - 1) });
              }}
              disabled={!canPrev || loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canNext) return;
                pushUrl({ page: String(page + 1) });
              }}
              disabled={!canNext || loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
            >
              التالي
            </button>
          </div>
        </div>

        {error && (
          <Card padding="lg" className="mb-4 border border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="text-sm text-rose-700 dark:text-rose-200">{error}</div>
            <button
              type="button"
              onClick={() => resetToFirstPage()}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading &&
            Array.from({ length: 9 }).map((_, idx) => (
              <Card key={idx} className="h-full animate-pulse" padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200/80 dark:bg-slate-800" />
                    <div className="h-3 w-2/3 rounded bg-slate-200/80 dark:bg-slate-800" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800" />
                      <div className="h-5 w-20 rounded-full bg-slate-200/80 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

          {!loading &&
            (data?.drugs ?? []).map((drug) => (
              <Link key={drug.id} href={`/drugs/${encodeURIComponent(drug.slug)}`}>
                <Card variant="hover" className="h-full" padding="lg">
                  <div className="flex items-start gap-4">
                    <EntityThumbnail
                      src={drug.image}
                      alt={drug.nameAr}
                      entityType="drug"
                      entityId={drug.id}
                      size="md"
                      className="flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                          {drug.nameAr}
                        </h3>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300 whitespace-nowrap">
                          {formatPriceLabel(drug.priceText)}
                        </span>
                      </div>

                      {drug.activeIngredient && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                          المادة الفعالة: <span className="font-semibold">{drug.activeIngredient}</span>
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {drug.category && <Badge variant="secondary" size="sm">{drug.category}</Badge>}
                        {drug.nameEn && (
                          <Badge variant="default" size="sm">
                            <span dir="ltr" className="truncate max-w-[140px]">{drug.nameEn}</span>
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">تفاصيل وبدائل</span>
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-300">فتح</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
        </div>

        {!loading && data && data.drugs.length === 0 && !error && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            لا توجد نتائج مطابقة. جرّب تغيير البحث أو الفلاتر.
          </div>
        )}
        </section>
      </div>
    </>
  );
}
