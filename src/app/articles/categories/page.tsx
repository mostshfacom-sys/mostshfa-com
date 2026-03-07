import { Metadata } from 'next';
import { Header, Footer } from '@/components/shared';
import { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import prisma from '@/lib/db/prisma';
import type { ArticleCategoryCard } from './ArticlesCategoriesClient';
import ArticlesCategoriesShell from './ArticlesCategoriesShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'تصنيفات المقالات الطبية | مستشفى.كوم',
  description:
    'استكشف جميع تصنيفات المقالات الطبية الموثوقة مع فلترة وبحث سريع للوصول إلى المحتوى الصحي المناسب.',
};

async function getCategoriesData() {
  const categories = await prisma.articleCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      icon: true,
      color: true,
      parentId: true,
      order: true,
      parent: {
        select: { id: true, nameAr: true },
      },
      children: {
        where: { isActive: true },
        select: {
          id: true,
          nameAr: true,
          slug: true,
          _count: {
            select: { articles: { where: { isPublished: true } } },
          },
        },
        orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
      },
      _count: {
        select: { articles: { where: { isPublished: true } } },
      },
    },
    orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
  });

  const mapped: ArticleCategoryCard[] = categories.map((category) => ({
    id: category.id,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    parentId: category.parentId,
    parentName: category.parent?.nameAr ?? null,
    order: category.order,
    count: category._count.articles,
    children: category.children.map((child) => ({
      id: child.id,
      nameAr: child.nameAr,
      slug: child.slug,
      count: child._count.articles,
    })),
  }));

  const totalArticles = await prisma.article.count({ where: { isPublished: true } });
  const totalCategories = mapped.length;
  const topLevelCategories = mapped.filter((category) => !category.parentId).length;
  const categoriesWithArticles = mapped.filter((category) => category.count > 0).length;

  return {
    categories: mapped,
    stats: {
      totalCategories,
      totalArticles,
      topLevelCategories,
      categoriesWithArticles,
    },
  };
}

interface PageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function ArticlesCategoriesPage({ searchParams }: PageProps) {
  const { categories, stats } = await getCategoriesData();
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'total-articles',
      label: 'إجمالي المقالات',
      value: stats.totalArticles,
      icon: 'star',
      color: '#f59e0b',
    },
    {
      id: 'total-categories',
      label: 'عدد التصنيفات',
      value: stats.totalCategories,
      icon: 'building',
      color: '#3b82f6',
    },
    {
      id: 'top-level',
      label: 'تصنيفات رئيسية',
      value: stats.topLevelCategories,
      icon: 'shield',
      color: '#10b981',
    },
    {
      id: 'active-categories',
      label: 'تصنيفات نشطة',
      value: stats.categoriesWithArticles,
      icon: 'check',
      color: '#ec4899',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <ArticlesCategoriesShell
          categories={categories}
          stats={stats}
          initialQuery={query}
          headerCounters={headerCounters}
        />
      </main>
      <Footer />
    </>
  );
}
