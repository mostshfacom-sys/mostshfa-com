'use client';

import { useEffect, useState } from 'react';

type Stats = {
  total: number;
  withPhone: number;
  withWebsite: number;
  withDesc: number;
  withLogo: number;
  withContact: number;
  withAmbulance?: number;
  withEmail?: number;
  withWhatsApp?: number;
  withFacebook?: number;
  withWorkingHours?: number;
  withServices?: number;
  withSpecialties?: number;
  withReviews?: number;
};

function pct(n: number, total: number) {
  if (!total) return '0.0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

export default function EnrichmentDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/enrichment', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError('تعذر تحميل المؤشرات');
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">مؤشر الإثراء الحي</h1>
      {error ? <div className="text-red-600 mb-4">{error}</div> : null}
      {!stats ? (
        <div>جارِ التحديث...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">إجمالي المنشآت</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">سيارة إسعاف</div>
            <div className="text-3xl font-bold">{stats.withAmbulance ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withAmbulance ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">أرقام الهاتف</div>
            <div className="text-3xl font-bold">{stats.withPhone}</div>
            <div className="text-xs text-gray-500">{pct(stats.withPhone, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">المواقع</div>
            <div className="text-3xl font-bold">{stats.withWebsite}</div>
            <div className="text-xs text-gray-500">{pct(stats.withWebsite, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">الأوصاف</div>
            <div className="text-3xl font-bold">{stats.withDesc}</div>
            <div className="text-xs text-gray-500">{pct(stats.withDesc, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">صور</div>
            <div className="text-3xl font-bold">{stats.withLogo}</div>
            <div className="text-xs text-gray-500">{pct(stats.withLogo, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">أي وسيلة تواصل</div>
            <div className="text-3xl font-bold">{stats.withContact}</div>
            <div className="text-xs text-gray-500">{pct(stats.withContact, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">البريد الإلكتروني</div>
            <div className="text-3xl font-bold">{stats.withEmail ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withEmail ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">واتساب</div>
            <div className="text-3xl font-bold">{stats.withWhatsApp ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withWhatsApp ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">فيسبوك</div>
            <div className="text-3xl font-bold">{stats.withFacebook ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withFacebook ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">ساعات العمل</div>
            <div className="text-3xl font-bold">{stats.withWorkingHours ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withWorkingHours ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">الخدمات</div>
            <div className="text-3xl font-bold">{stats.withServices ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withServices ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">التخصصات</div>
            <div className="text-3xl font-bold">{stats.withSpecialties ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withSpecialties ?? 0, stats.total)}</div>
          </div>
          <div className="p-4 border rounded-xl">
            <div className="text-sm text-gray-500 mb-1">التقييمات</div>
            <div className="text-3xl font-bold">{stats.withReviews ?? 0}</div>
            <div className="text-xs text-gray-500">{pct(stats.withReviews ?? 0, stats.total)}</div>
          </div>
        </div>
      )}
      <div className="mt-6 text-sm text-gray-500">يتم التحديث تلقائياً كل 10 ثوانٍ</div>
    </div>
  );
}
