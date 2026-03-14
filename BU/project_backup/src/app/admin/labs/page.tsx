'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lab {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  rating: number;
  isActive: boolean;
  homeService: boolean;
}

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLabs();
  }, [currentPage, searchTerm]);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/labs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLabs(data.labs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المعامل</h1>
          <p className="text-gray-600">إدارة وتعديل بيانات المعامل والمختبرات</p>
        </div>
        <Link
          href="/admin/labs/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>➕</span>
          <span>إضافة معمل</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="البحث عن معمل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : labs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد معامل
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التقييم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">خدمة منزلية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {labs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/labs/${lab.slug}`} className="text-primary hover:underline font-medium">
                        {lab.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{lab.address}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        {lab.rating?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lab.homeService ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lab.homeService ? 'متاح' : 'غير متاح'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lab.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {lab.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/labs/${lab.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          تعديل
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-gray-600">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
