'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Hospital {
  id: number;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  type: { nameAr: string };
  governorate: { nameAr: string };
  phone: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHospitals();
  }, [currentPage, searchQuery]);

  const fetchHospitals = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/admin/hospitals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستشفى؟')) return;
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('تم الحذف بنجاح');
        fetchHospitals();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      alert('حدث خطأ غير متوقع');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستشفيات</h1>
        <Link
          href="/admin/hospitals/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          ➕ إضافة مستشفى
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="بحث عن مستشفى..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد مستشفيات</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">النوع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المحافظة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الهاتف</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">مميز</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{hospital.nameAr}</p>
                      {hospital.nameEn && (
                        <p className="text-sm text-gray-500">{hospital.nameEn}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{hospital.type?.nameAr}</td>
                  <td className="px-4 py-3 text-gray-600">{hospital.governorate?.nameAr}</td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{hospital.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {hospital.isFeatured ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">مميز</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/hospitals/${hospital.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="تعديل"
                      >
                        ✏️
                      </Link>
                      <Link
                        href={`/hospitals/${hospital.slug}`}
                        target="_blank"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="عرض"
                      >
                        👁️
                      </Link>
                      <button
                        onClick={() => handleDelete(hospital.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-gray-600">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
