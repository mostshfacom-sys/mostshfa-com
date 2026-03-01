'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonChart from '@/components/comparison/ComparisonChart';
import { ComparisonItem, EntityType, clearComparisonStorage } from '@/lib/comparison/engine';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const itemsParam = searchParams.get('items');
        if (!itemsParam) {
          setError('لم يتم تحديد عناصر للمقارنة');
          setLoading(false);
          return;
        }

        const parsedItems = JSON.parse(decodeURIComponent(itemsParam)) as { id: number; type: EntityType }[];
        
        if (parsedItems.length < 2) {
          setError('يجب اختيار عنصرين على الأقل للمقارنة');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: parsedItems }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'حدث خطأ في المقارنة');
          setLoading(false);
          return;
        }

        setItems(data.data.items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError('حدث خطأ في تحميل المقارنة');
        setLoading(false);
      }
    };

    fetchComparison();
  }, [searchParams]);

  const handleRemove = (id: number, type: string) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const handleClearAll = () => {
    clearComparisonStorage();
    window.dispatchEvent(new CustomEvent('comparisonUpdated', { detail: [] }));
    setItems([]);
  };

  const typeLabels: Record<EntityType, string> = {
    hospital: 'المستشفيات',
    clinic: 'العيادات',
    lab: 'المعامل',
    pharmacy: 'الصيدليات',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المقارنة...</p>
        </div>
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {error || 'لا توجد عناصر للمقارنة'}
              </h2>
              <p className="text-gray-600 mb-6">
                يمكنك إضافة عناصر للمقارنة من صفحات المستشفيات أو العيادات أو المعامل أو الصيدليات
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/hospitals" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  المستشفيات
                </Link>
                <Link href="/clinics" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  العيادات
                </Link>
                <Link href="/labs" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  المعامل
                </Link>
                <Link href="/pharmacies" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  الصيدليات
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const primaryType = items[0]?.type || 'hospital';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600">الرئيسية</Link>
            <span>/</span>
            <span>المقارنة</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                مقارنة {typeLabels[primaryType]}
              </h1>
              <p className="text-gray-600 mt-1">
                مقارنة {items.length} عناصر
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                مسح الكل
              </button>
              <Link
                href={`/${primaryType === 'hospital' ? 'hospitals' : primaryType === 'clinic' ? 'clinics' : primaryType === 'lab' ? 'labs' : 'pharmacies'}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                إضافة المزيد
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'table'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  جدول المقارنة
                </span>
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'chart'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  نقاط المقارنة
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'table' ? (
              <ComparisonTable items={items} onRemove={handleRemove} />
            ) : (
              <ComparisonChart items={items} />
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-4 md:p-6">
          <h3 className="font-bold text-blue-800 mb-2">💡 نصائح للمقارنة</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• يمكنك مقارنة حتى 4 عناصر في نفس الوقت</li>
            <li>• الخلايا الخضراء تشير إلى القيمة الأفضل في كل صف</li>
            <li>• اضغط على اسم أي عنصر للانتقال إلى صفحته التفصيلية</li>
            <li>• يتم حساب النقاط بناءً على التقييم ومعلومات الاتصال والميزات المتاحة</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
