'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Drug {
  id: number;
  nameAr: string;
  nameEn?: string;
  slug: string;
  activeIngredient?: string;
  category: string;
  priceText?: string;
  updatedAt?: string;
}

export default function AdminDrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceUrl, setSourceUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    fetchDrugs();
  }, [currentPage, searchTerm]);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/drugs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDrugs(data.drugs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const importDrugs = async (useDefault: boolean) => {
    setImporting(true);
    setImportMessage('');
    try {
      const payload = useDefault ? {} : { sourceUrl: sourceUrl.trim() };
      const response = await fetch('/api/admin/drugs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setImportMessage(result?.error || 'فشل الاستيراد');
      } else {
        setImportMessage(`تم استيراد ${result.imported} عنصر`);
        fetchDrugs();
      }
    } catch (error) {
      setImportMessage('حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الأدوية</h1>
          <p className="text-gray-600">إدارة وتعديل بيانات الأدوية</p>
        </div>
        <Link
          href="/admin/drugs/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>➕</span>
          <span>إضافة دواء</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="البحث عن دواء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">تحديث بيانات الأدوية</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            placeholder="رابط مصدر البيانات (JSON)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => importDrugs(false)}
            disabled={importing || !sourceUrl.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-60"
          >
            استيراد من الرابط
          </button>
          <button
            type="button"
            onClick={() => importDrugs(true)}
            disabled={importing}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-primary/30"
          >
            استيراد افتراضي
          </button>
        </div>
        {importMessage && <p className="text-sm text-gray-600">{importMessage}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : drugs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد أدوية
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم التجاري</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم الإنجليزي</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التصنيف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المادة الفعالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">آخر تحديث</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {drugs.map((drug) => (
                  <tr key={drug.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/drugs/${drug.slug}`} className="text-primary hover:underline font-medium">
                        {drug.nameAr}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{drug.nameEn || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{drug.category}</td>
                    <td className="px-4 py-3 text-gray-600">{drug.activeIngredient || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {drug.priceText || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {drug.updatedAt
                        ? new Date(drug.updatedAt).toLocaleDateString('ar-EG')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/drugs/${drug.id}`}
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
