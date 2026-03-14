'use client';

import { useMemo, useState } from 'react';
import UniversalHeaderClient, {
  type HeaderCounterConfig,
} from '@/components/shared/UniversalHeaderClient';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import ArticlesCategoriesClient, {
  type ArticleCategoryCard,
  type CategoryStats,
} from './ArticlesCategoriesClient';

interface ArticlesCategoriesShellProps {
  categories: ArticleCategoryCard[];
  stats: CategoryStats;
  initialQuery: string;
  headerCounters: HeaderCounterConfig[];
}

export default function ArticlesCategoriesShell({
  categories,
  stats,
  initialQuery,
  headerCounters,
}: ArticlesCategoriesShellProps) {
  const [filteredCount, setFilteredCount] = useState(categories.length);
  const quickFilters = useMemo(() => {
    const normalizedQuery = initialQuery.trim();
    const popularCategories = categories
      .filter((category) => category.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    return [
      {
        id: 'all',
        label: 'كل التصنيفات',
        active: normalizedQuery.length === 0,
        href: '/articles/categories',
      },
      ...popularCategories.map((category) => ({
        id: `category-${category.slug}`,
        label: category.nameAr,
        active: normalizedQuery === category.nameAr,
        href: `/articles/categories?q=${encodeURIComponent(category.nameAr)}`,
      })),
    ];
  }, [categories, initialQuery]);

  return (
    <>
      <UniversalHeaderClient
        prefix="articlesCategories"
        title="تصنيفات المقالات الطبية"
        subtitle="استكشف مكتبة متنامية من المقالات الطبية المصنفة بعناية لتجد الإجابة الصحيحة بسرعة."
        counters={headerCounters}
        quickFilters={quickFilters}
        resultsCount={filteredCount}
        showResultsCount
        searchPlaceholder="ابحث عن تصنيف أو موضوع..."
        searchParamKey="q"
        searchAction="/articles/categories"
        resetPageOnSearch={false}
        showViewToggle={false}
        showVoiceSearch
        showMapButton={false}
        useBannerText={false}
        titleClassName="whitespace-nowrap tracking-tight text-[clamp(1.2rem,4.2vw,1.8rem)] sm:text-3xl lg:text-4xl sm:truncate"
        className="mb-8"
      />

      <section className="container-custom pb-16">
        <Breadcrumb
          className="mb-6"
          items={[
            { label: 'المقالات الطبية', href: '/articles' },
            { label: 'تصنيفات المقالات' },
          ]}
        />
        <ArticlesCategoriesClient
          categories={categories}
          stats={stats}
          initialQuery={initialQuery}
          onFilteredCountChange={setFilteredCount}
        />
      </section>
    </>
  );
}
