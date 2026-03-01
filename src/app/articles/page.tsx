import { Metadata } from 'next';
import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import ArticlesClient from './ArticlesClient';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export const metadata: Metadata = {
  title: 'المقالات الطبية | مستشفى.كوم',
  description: 'مقالات طبية موثوقة ومعلومات صحية شاملة من أطباء متخصصين.',
};

const ARTICLES_PER_PAGE = 15;

function buildArticlesWhere(categoryId?: number | null, search?: string) {
  const where: any = {
    isPublished: true,
    ...(categoryId ? { categoryId } : {}),
  };

  if (search && search.trim()) {
    const trimmed = search.trim();
    const normalizedSearch = normalizeArabic(trimmed);
    where.OR = [
      { title: { contains: normalizedSearch } },
      { excerpt: { contains: normalizedSearch } },
      { content: { contains: normalizedSearch } },
      { title: { contains: trimmed } },
      { excerpt: { contains: trimmed } },
    ];
  }

  return where;
}

async function getInitialArticles(where: any) {
  try {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          author: true,
          views: true,
          publishedAt: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              nameAr: true,
              slug: true,
              color: true,
            }
          }
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: ARTICLES_PER_PAGE,
      }),
      prisma.article.count({ where }),
    ]);
    return { articles, total };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], total: 0 };
  }
}

async function getCategories() {
  try {
    const categories = await prisma.articleCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameAr: true,
        slug: true,
        _count: {
          select: { articles: { where: { isPublished: true } } }
        },
      },
      orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
    });
    return categories.map(cat => ({
      id: cat.id,
      nameAr: cat.nameAr,
      slug: cat.slug,
      count: cat._count.articles
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getSelectedCategory(categoryParam?: string | string[]) {
  const raw = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  if (!raw || raw === 'all') return null;

  const parsedId = Number.parseInt(raw, 10);
  if (!Number.isNaN(parsedId)) {
    return prisma.articleCategory.findFirst({
      where: { id: parsedId, isActive: true },
      select: { id: true, slug: true, nameAr: true },
    });
  }

  return prisma.articleCategory.findFirst({
    where: { slug: raw, isActive: true },
    select: { id: true, slug: true, nameAr: true },
  });
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { category?: string | string[]; search?: string };
}) {
  const selectedCategory = await getSelectedCategory(searchParams?.category);
  const selectedCategoryId = selectedCategory?.id ?? null;
  const searchQuery = typeof searchParams?.search === 'string' ? searchParams.search : undefined;
  const where = buildArticlesWhere(selectedCategoryId, searchQuery);

  const [{ articles, total }, categories, overallTotal, featuredCount, viewsAggregate] = await Promise.all([
    getInitialArticles(where),
    getCategories(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.article.count({ where: { ...where, isFeatured: true } }),
    prisma.article.aggregate({ where, _sum: { views: true } }),
  ]);
  const viewsTotal = viewsAggregate._sum.views ?? 0;

  // تحويل البيانات لكائنات بسيطة قابلة للتسلسل
  const safeArticles = articles.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    image: article.image,
    author: article.author,
    views: article.views,
    publishedAt: article.publishedAt?.toISOString() || null,
    createdAt: article.createdAt.toISOString(),
    category: article.category ? {
      id: article.category.id,
      nameAr: article.category.nameAr,
      slug: article.category.slug,
      color: article.category.color,
    } : null,
  }));

  const headerSubtitle =
    total > 0 ? `عرض ${safeArticles.length} من ${total} مقال` : 'لا توجد نتائج';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'total',
      label: 'إجمالي المقالات',
      value: total,
      icon: 'building',
      color: '#f97316',
      isHighlighted: true,
    },
    {
      id: 'featured',
      label: 'مقالات مميزة',
      value: featuredCount,
      icon: 'star',
      color: '#f59e0b',
    },
    {
      id: 'categories',
      label: 'التصنيفات',
      value: categories.length,
      icon: 'group',
      color: '#22c55e',
    },
    {
      id: 'views',
      label: 'إجمالي المشاهدات',
      value: viewsTotal,
      icon: 'heart',
      color: '#ec4899',
    },
  ];

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategoryId) params.set('category', selectedCategoryId.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    return params.toString();
  };

  const buildLink = (updates: Record<string, string | undefined>) => {
    const query = buildQuery(updates);
    return query ? `/articles?${query}` : '/articles';
  };

  const quickFilters = [
    {
      id: 'all',
      label: 'كل المقالات',
      count: overallTotal,
      active: !selectedCategoryId,
      href: buildLink({ category: undefined }),
    },
    ...categories.slice(0, 4).map((category) => ({
      id: `category-${category.id}`,
      label: category.nameAr,
      count: category.count,
      active: selectedCategoryId === category.id,
      href: buildLink({ category: String(category.id) }),
    })),
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UniversalHeaderClient
          prefix="articles"
          title="المقالات الطبية"
          subtitle={headerSubtitle}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={total}
          searchPlaceholder="ابحث في المقالات الطبية..."
          searchParamKey="search"
          resetPageOnSearch={false}
          showFilters={false}
          showViewToggle={false}
          gradientFrom="from-rose-500"
          gradientTo="to-amber-500"
          className="mb-8"
        />

        <div className="container-custom pb-8">
          <ArticlesClient
            initialArticles={safeArticles}
            initialCategories={categories}
            initialTotal={total}
            initialOverallTotal={overallTotal}
            initialSelectedCategoryId={selectedCategoryId}
            initialSearch={searchQuery}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
