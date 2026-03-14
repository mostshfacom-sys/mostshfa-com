'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CategoryInfo {
  id: number;
  nameAr: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  views: number;
  isPublished: boolean;
  isFeatured: boolean;
  updatedAt: string;
  createdAt: string;
  category: CategoryInfo | null;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setArticles(data.articles || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setArticles([]);
        setTotalPages(1);
      }
    } catch {
      setArticles([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'حدث خطأ أثناء الحذف');
        return;
      }
      fetchArticles();
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const togglePublished = async (article: Article) => {
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'فشل تحديث حالة النشر');
        return;
      }
      fetchArticles();
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المقالات</h1>
        <Link href="/admin/articles/new" className="bg-primary-600 text-white px-4 py-2 rounded-lg">
          مقال جديد
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">الكل</option>
            <option value="published">منشور</option>
            <option value="draft">غير منشور</option>
          </select>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => fetchArticles()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              تحديث
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد مقالات</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">العنوان</th>
                <th className="text-right py-2">التصنيف</th>
                <th className="text-right py-2">المشاهدات</th>
                <th className="text-right py-2">الحالة</th>
                <th className="text-right py-2">آخر تعديل</th>
                <th className="text-right py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b">
                  <td className="py-2">
                    <div className="font-medium text-gray-900">{article.title}</div>
                    <div className="text-xs text-gray-500" dir="ltr">/{article.slug}</div>
                  </td>
                  <td className="py-2 text-gray-700">{article.category?.nameAr || '-'}</td>
                  <td className="py-2">{article.views}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => togglePublished(article)}
                      className={`px-2 py-1 rounded-full text-xs border ${
                        article.isPublished
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {article.isPublished ? 'منشور' : 'غير منشور'}
                    </button>
                  </td>
                  <td className="py-2 text-sm text-gray-600">
                    {new Date(article.updatedAt || article.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/articles/${article.id}`} className="text-blue-600">تعديل</Link>
                      <Link href={`/articles/${encodeURIComponent(article.slug)}`} target="_blank" className="text-green-600">
                        عرض
                      </Link>
                      <button type="button" onClick={() => handleDelete(article.id)} className="text-red-600">
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            السابق
          </button>
          <span className="text-gray-600">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

