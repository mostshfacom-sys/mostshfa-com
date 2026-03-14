'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  BeakerIcon,
  BookOpenIcon,
  BoltIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  SunIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export interface ArticleCategoryCard {
  id: number;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
  color?: string | null;
  parentId?: number | null;
  parentName?: string | null;
  order?: number | null;
  count: number;
  children: Array<{
    id: number;
    nameAr: string;
    slug: string;
    count: number;
  }>;
}

export interface CategoryStats {
  totalCategories: number;
  totalArticles: number;
  topLevelCategories: number;
  categoriesWithArticles: number;
}

interface ArticlesCategoriesClientProps {
  categories: ArticleCategoryCard[];
  stats: CategoryStats;
  initialQuery?: string;
  onFilteredCountChange?: (count: number) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  nutrition: SparklesIcon,
  mind: HeartIcon,
  heart: HeartIcon,
  woman: UserGroupIcon,
  kids: UserGroupIcon,
  fitness: BoltIcon,
  chronic: ShieldCheckIcon,
  shield: ShieldCheckIcon,
  lab: BeakerIcon,
  medicine: BeakerIcon,
  sun: SunIcon,
  wellness: SparklesIcon,
  article: BookOpenIcon,
};

const resolveIcon = (icon?: string | null) => {
  if (!icon) return BookOpenIcon;
  const key = icon.toLowerCase();
  return iconMap[key] ?? BookOpenIcon;
};

const formatNumber = (value: number) => value.toLocaleString('ar-EG');

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '').trim();
  const isHex = /^[0-9a-fA-F]+$/.test(normalized);
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (!isHex || expanded.length !== 6) {
    return `rgba(245, 158, 11, ${alpha})`;
  }

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getCategoryDescription = (category: ArticleCategoryCard) => {
  if (category.count > 0) {
    return `استكشف ${formatNumber(category.count)} مقالة موثوقة في مجال ${category.nameAr} مع نصائح عملية.`;
  }
  return `تصنيف جديد في ${category.nameAr} بانتظار أحدث المقالات الطبية المتخصصة قريباً.`;
};

const scopeOptions = [
  { id: 'all', label: 'جميع التصنيفات' },
  { id: 'parent', label: 'التصنيفات الرئيسية' },
  { id: 'child', label: 'التصنيفات الفرعية' },
] as const;

const sortOptions = [
  { id: 'order', label: 'الترتيب الافتراضي' },
  { id: 'count', label: 'الأكثر قراءة' },
  { id: 'name', label: 'أبجدي' },
] as const;

function CategoryCard({ category }: { category: ArticleCategoryCard }) {
  const Icon = resolveIcon(category.icon);
  const accent = category.color || '#f59e0b';
  const accentSoft = hexToRgba(accent, 0.12);
  const accentBorder = hexToRgba(accent, 0.28);
  const accentGlow = hexToRgba(accent, 0.35);
  const isParent = !category.parentId;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/80">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl"
        style={{ backgroundColor: accentGlow }}
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: accentSoft, borderColor: accentBorder, color: accent }}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {isParent ? 'تصنيف رئيسي' : 'تصنيف فرعي'}
              </p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {category.nameAr}
              </h3>
              {category.parentName && (
                <p className="text-xs text-gray-400">ضمن {category.parentName}</p>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            size="sm"
            className="text-xs whitespace-nowrap dark:bg-white/10 dark:text-gray-100"
          >
            {formatNumber(category.count)} مقالة
          </Badge>
        </div>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
          {getCategoryDescription(category)}
        </p>

        {category.children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {category.children.slice(0, 3).map((child) => (
              <Link
                key={child.id}
                href={`/articles?category=${child.slug}`}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              >
                {child.nameAr}
              </Link>
            ))}
            {category.children.length > 3 && (
              <span className="text-xs text-gray-400">
                +{formatNumber(category.children.length - 3)} المزيد
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {category.children.length > 0
              ? `${formatNumber(category.children.length)} تصنيف فرعي`
              : 'محتوى متجدد'}
          </span>
          <Link
            href={`/articles?category=${category.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
          >
            استكشف المقالات
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesCategoriesClient({
  categories,
  stats,
  initialQuery,
  onFilteredCountChange,
}: ArticlesCategoriesClientProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [scope, setScope] = useState<(typeof scopeOptions)[number]['id']>('all');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['id']>('order');
  const [withArticlesOnly, setWithArticlesOnly] = useState(false);

  useEffect(() => {
    if (typeof initialQuery === 'string') {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const normalizedQuery = useMemo(() => normalizeArabic(query.trim()), [query]);

  const indexedCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        searchText: normalizeArabic(
          [category.nameAr, category.nameEn, category.slug, category.parentName]
            .filter((value): value is string => Boolean(value))
            .join(' ')
        ),
      })),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    let list = indexedCategories.slice();

    if (scope === 'parent') {
      list = list.filter((category) => !category.parentId);
    }

    if (scope === 'child') {
      list = list.filter((category) => Boolean(category.parentId));
    }

    if (withArticlesOnly) {
      list = list.filter((category) => category.count > 0);
    }

    if (normalizedQuery) {
      list = list.filter((category) => category.searchText.includes(normalizedQuery));
    }

    list.sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      }
      if (sortBy === 'name') {
        return a.nameAr.localeCompare(b.nameAr, 'ar');
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return list;
  }, [indexedCategories, scope, withArticlesOnly, normalizedQuery, sortBy]);

  useEffect(() => {
    onFilteredCountChange?.(filteredCategories.length);
  }, [filteredCategories.length, onFilteredCountChange]);

  const popularCategories = useMemo(
    () =>
      categories
        .filter((category) => category.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 7),
    [categories]
  );

  const hasFilters =
    query.trim().length > 0 || scope !== 'all' || sortBy !== 'order' || withArticlesOnly;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ابحث عن التصنيف المناسب
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  اختر من بين {formatNumber(stats.totalCategories)} تصنيف طبي متجدد حسب اهتماماتك.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                <SparklesIcon className="h-4 w-4" />
                تحديث يومي للمحتوى
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <Input
                placeholder="ابحث عن تصنيف، موضوع، أو كلمة مفتاحية"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                className="bg-white/80 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setScope('all');
                  setSortBy('order');
                  setWithArticlesOnly(false);
                }}
                className={cn(
                  'inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition',
                  hasFilters
                    ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                    : 'border-gray-200 bg-gray-100 text-gray-400'
                )}
                disabled={!hasFilters}
              >
                إعادة الضبط
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {scopeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScope(option.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    scope === option.id
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  {option.label}
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500">
                <input
                  type="checkbox"
                  checked={withArticlesOnly}
                  onChange={(event) => setWithArticlesOnly(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                تصنيفات بها مقالات فقط
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>
                يعرض {formatNumber(filteredCategories.length)} من{' '}
                {formatNumber(categories.length)} تصنيف
              </span>
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>الترتيب:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortBy(option.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      sortBy === option.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-slate-400 hover:text-slate-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/70">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                التصنيفات الأكثر قراءة
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {popularCategories.length === 0 ? (
                  <span className="text-xs text-gray-400">لا توجد تصنيفات نشطة حتى الآن.</span>
                ) : (
                  popularCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/articles?category=${category.slug}`}
                      className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                    >
                      {category.nameAr}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'إجمالي المقالات',
                value: formatNumber(stats.totalArticles),
                icon: BookOpenIcon,
                color: 'text-primary-600',
                bg: 'bg-primary-50',
              },
              {
                label: 'التصنيفات المتاحة',
                value: formatNumber(stats.totalCategories),
                icon: Squares2X2Icon,
                color: 'text-sky-600',
                bg: 'bg-sky-50',
              },
              {
                label: 'تصنيفات رئيسية',
                value: formatNumber(stats.topLevelCategories),
                icon: SparklesIcon,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                label: 'تصنيفات نشطة',
                value: formatNumber(stats.categoriesWithArticles),
                icon: ShieldCheckIcon,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl',
                        stat.bg,
                        stat.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">كل التصنيفات الطبية</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              اختر المجال الذي يهمك للوصول إلى أحدث المقالات الموثوقة.
            </p>
          </div>
          <Badge variant="info" className="text-xs">
            تحديثات أسبوعية
          </Badge>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-white/10 dark:bg-slate-900/80">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              لم يتم العثور على تصنيفات مطابقة لبحثك.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              جرّب البحث بكلمات مختلفة أو أزل بعض الفلاتر.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-white/10 dark:bg-slate-900/80">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            لماذا تصنيفات مستشفى.كوم مختلفة؟
          </h3>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
            نرتّب المقالات حسب التخصصات الطبية مع مراجعات دورية من أطباء متخصصين، لتصل إلى المعلومة
            الدقيقة بسرعة. يمكنك استخدام أدوات البحث والفلاتر لاختيار المجالات الأكثر أهمية لحياتك.
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
            {[
              'مقالات مدققة وموثوقة',
              'إرشادات عملية يومية',
              'تصنيفات رئيسية وفرعية واضحة',
              'تحديثات مستمرة للمحتوى الطبي',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              تصفح جميع المقالات
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 text-center dark:border-amber-500/30 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-200">
            مساحة إعلانية متجاوبة
          </p>
          <h4 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
            جاهزة لإعلانات Google AdSense
          </h4>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            يتم تخصيص هذه المساحة لعرض إعلانات طبية موثوقة أو حملات توعوية داعمة للمحتوى الصحي.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-6 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-white/5 dark:text-amber-200">
            حجم الإعلان المقترح: 728×90 أو 300×250
          </div>
        </div>
      </section>
    </div>
  );
}
