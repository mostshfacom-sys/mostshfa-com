'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  author: string | null;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  category: {
    id: number;
    nameAr: string;
    slug: string;
    color: string | null;
  } | null;
}

interface Category {
  id: number;
  nameAr: string;
  slug: string;
  count: number;
}

interface ArticlesClientProps {
  initialArticles: Article[];
  initialCategories: Category[];
  initialTotal: number;
  initialOverallTotal: number;
  initialSelectedCategoryId?: number | null;
  initialSearch?: string;
}

const ARTICLES_PER_PAGE = 15;

export default function ArticlesClient({
  initialArticles,
  initialCategories,
  initialTotal,
  initialOverallTotal,
  initialSelectedCategoryId = null,
  initialSearch,
}: ArticlesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialArticles.length < initialTotal);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialSelectedCategoryId);
  const [total, setTotal] = useState(initialTotal);
  const [searchTerm, setSearchTerm] = useState(initialSearch ?? '');

  useEffect(() => {
    setArticles(initialArticles);
    setTotal(initialTotal);
    setHasMore(initialArticles.length < initialTotal);
    setSelectedCategory(initialSelectedCategoryId ?? null);
    setPage(1);
    setSearchTerm(initialSearch ?? '');
  }, [initialArticles, initialTotal, initialSelectedCategoryId, initialSearch]);

  const categories = [
    { id: 0, nameAr: 'الكل', slug: 'all', count: initialOverallTotal },
    ...initialCategories,
  ];

  const fetchArticles = useCallback(async (pageNum: number, categoryId: number | null, reset: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ARTICLES_PER_PAGE.toString(),
      });
      
      if (categoryId) {
        params.set('categoryId', categoryId.toString());
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();

      if (reset) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleCategoryChange = (categoryId: number | null) => {
    const newCategoryId = categoryId === 0 ? null : categoryId;
    setSelectedCategory(newCategoryId);
    setPage(1);
    updateQuery({
      category: newCategoryId ? newCategoryId.toString() : undefined,
    });
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage, selectedCategory, false);
    }
  };

  const getDefaultImage = () => '/images/defaults/article.svg';

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Sidebar - على اليمين */}
      <aside className="w-full lg:w-64 flex-shrink-0 order-2 lg:order-1">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-5 lg:sticky lg:top-24">
          <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4">التصنيفات</h3>
          <div className="flex flex-wrap gap-2 lg:block lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:scrollbar-thin lg:scrollbar-thumb-gray-300 lg:scrollbar-track-gray-100">
            <ul className="flex flex-wrap gap-2 lg:block lg:space-y-1.5 w-full">
              {categories.map((cat) => (
                <li key={cat.id} className="lg:w-full">
                  <button
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap lg:w-full ${
                      (selectedCategory === null && cat.id === 0) || selectedCategory === cat.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-primary-50 text-gray-600 hover:text-primary-600 bg-gray-50 lg:bg-transparent'
                    }`}
                  >
                    <span>{cat.nameAr}</span>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 mr-2 lg:mr-0">
                      {cat.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Articles Grid */}
      <div className="flex-1 order-1 lg:order-2">
        {/* Results count */}
        <div className="mb-4 text-gray-600">
          عرض {articles.length} من {total} مقال
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-500">لا توجد مقالات في هذا التصنيف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.slug}`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer h-full overflow-hidden group">
                  {/* Image */}
                  <div className="relative aspect-video">
                    <Image
                      src={article.image || getDefaultImage()}
                      alt={article.title}
                      fill
                      className="object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {article.category && (
                      <span className="absolute top-3 right-3 z-10 inline-flex items-center px-2.5 py-0.5 text-sm font-medium rounded-full bg-primary-100 text-primary-800">
                        {article.category.nameAr}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{article.author || 'فريق التحرير'}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {article.views}
                        </span>
                        <span>
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري التحميل...
                </>
              ) : (
                'تحميل المزيد'
              )}
            </button>
          </div>
        )}

        {/* End message */}
        {!hasMore && articles.length > 0 && (
          <div className="text-center mt-8 text-gray-500">
            تم عرض جميع المقالات ({total} مقال)
          </div>
        )}
      </div>
    </div>
  );
}
