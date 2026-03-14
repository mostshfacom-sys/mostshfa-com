'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MoonIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SleepRecord {
  id: number;
  bed_time?: string;
  bedTime?: string;
  wake_time?: string;
  wakeTime?: string;
  hours: number;
  quality: string;
  date: string;
  notes?: string | null;
}

interface SleepStats {
  average_hours: number;
  average_quality_score: number;
  total_records: number;
  quality_breakdown: Record<string, number>;
  best_sleep?: {
    date: string;
    hours: number;
    quality: string;
  };
  worst_sleep?: {
    date: string;
    hours: number;
    quality: string;
  };
}

interface SleepFormState {
  bedTime: string;
  wakeTime: string;
  quality: string;
  date: string;
  notes: string;
}

const qualityOptions = [
  { value: 'ممتاز', label: '😊 ممتاز' },
  { value: 'جيد', label: '🙂 جيد' },
  { value: 'متوسط', label: '😐 متوسط' },
  { value: 'سيء', label: '😔 سيء' },
];

const resolveQualityVariant = (quality?: string | null) => {
  if (!quality) return 'secondary';
  if (quality.includes('ممتاز')) return 'success';
  if (quality.includes('جيد')) return 'info';
  if (quality.includes('متوسط')) return 'warning';
  if (quality.includes('سيء')) return 'danger';
  return 'secondary';
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ar-EG');
};

const calculateHoursPreview = (bedTime: string, wakeTime: string) => {
  if (!bedTime || !wakeTime) return null;
  const [bedHours, bedMinutes] = bedTime.split(':').map(Number);
  const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
  if ([bedHours, bedMinutes, wakeHours, wakeMinutes].some((value) => Number.isNaN(value))) {
    return null;
  }
  let minutes = wakeHours * 60 + wakeMinutes - (bedHours * 60 + bedMinutes);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
};

export default function SleepTracker() {
  const today = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [rangeDays, setRangeDays] = useState(30);
  const [form, setForm] = useState<SleepFormState>({
    bedTime: '22:00',
    wakeTime: '06:00',
    quality: 'جيد',
    date: today,
    notes: '',
  });

  const handleUnauthorized = () => {
    setAuthRequired(true);
    setRecords([]);
    setStats(null);
  };

  const loadRecords = async () => {
    const response = await fetch(`/api/health-tools/sleep-records?days=${rangeDays}`, {
      cache: 'no-store',
    });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'فشل تحميل سجلات النوم');
    }
    setRecords(data.results || []);
  };

  const loadStats = async () => {
    const response = await fetch(`/api/health-tools/sleep-records/stats?days=${rangeDays}`, {
      cache: 'no-store',
    });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'فشل تحميل إحصائيات النوم');
    }
    if (data?.message) {
      setStats(null);
      return;
    }
    setStats(data as SleepStats);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await Promise.all([loadRecords(), loadStats()]);
      setAuthRequired(false);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [rangeDays]);

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);

    if (!form.bedTime || !form.wakeTime) {
      setError('يرجى إدخال وقت النوم والاستيقاظ');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/health-tools/sleep-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_time: form.bedTime,
          wake_time: form.wakeTime,
          quality: form.quality,
          date: form.date,
          notes: form.notes.trim() || null,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حفظ سجل النوم');
      }

      setForm({ bedTime: '22:00', wakeTime: '06:00', quality: 'جيد', date: today, notes: '' });
      setMessage('تم تسجيل النوم بنجاح');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ السجل';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/health-tools/sleep-records/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حذف السجل');
      }

      setMessage('تم حذف السجل');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف السجل';
      setError(messageText);
    }
  };

  const previewHours = useMemo(() => calculateHoursPreview(form.bedTime, form.wakeTime), [
    form.bedTime,
    form.wakeTime,
  ]);

  const qualityBreakdown = Object.entries(stats?.quality_breakdown ?? {});

  if (authRequired) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
          <MoonIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">متتبع النوم يتطلب تسجيل الدخول</h3>
        <p className="text-sm text-gray-600 mb-4">سجل نومك اليومي بعد تسجيل الدخول.</p>
        <Link
          href="/login?redirect=/tools"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-500 text-white"
        >
          تسجيل الدخول
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MoonIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">متتبع النوم</h2>
            <p className="text-sm text-gray-500">راقب ساعات نومك وجودته خلال الفترة الأخيرة.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>آخر</span>
          <select
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={7}>7 أيام</option>
            <option value={30}>30 يوم</option>
            <option value={90}>90 يوم</option>
          </select>
        </div>
      </div>

      {message && <Card className="bg-green-50 border border-green-200 text-green-700">{message}</Card>}
      {error && <Card className="bg-red-50 border border-red-200 text-red-700">{error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-semibold text-indigo-600">
            {stats ? stats.average_hours.toFixed(1) : '--'}
          </div>
          <div className="text-sm text-gray-500">متوسط الساعات</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-blue-600">
            {stats ? stats.average_quality_score.toFixed(1) : '--'}
          </div>
          <div className="text-sm text-gray-500">متوسط الجودة</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-gray-700">{stats?.total_records ?? 0}</div>
          <div className="text-sm text-gray-500">إجمالي السجلات</div>
        </Card>
      </div>

      {(stats?.best_sleep || stats?.worst_sleep) && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل وأسوأ ليلة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.best_sleep && (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="text-sm text-emerald-700 mb-1">أفضل نوم</div>
                <div className="text-xl font-semibold text-emerald-700">
                  {stats.best_sleep.hours} ساعة
                </div>
                <div className="text-sm text-gray-500">{formatDate(stats.best_sleep.date)}</div>
                <Badge variant={resolveQualityVariant(stats.best_sleep.quality)} size="sm" className="mt-2">
                  {stats.best_sleep.quality}
                </Badge>
              </div>
            )}
            {stats?.worst_sleep && (
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40">
                <div className="text-sm text-rose-700 mb-1">أقل نوم</div>
                <div className="text-xl font-semibold text-rose-700">
                  {stats.worst_sleep.hours} ساعة
                </div>
                <div className="text-sm text-gray-500">{formatDate(stats.worst_sleep.date)}</div>
                <Badge variant={resolveQualityVariant(stats.worst_sleep.quality)} size="sm" className="mt-2">
                  {stats.worst_sleep.quality}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {qualityBreakdown.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع جودة النوم</h3>
          <div className="flex flex-wrap gap-2">
            {qualityBreakdown.map(([quality, count]) => (
              <Badge key={quality} variant={resolveQualityVariant(quality)} size="sm">
                {quality}: {count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة سجل جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وقت النوم</label>
            <input
              type="time"
              value={form.bedTime}
              onChange={(event) => setForm((prev) => ({ ...prev, bedTime: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وقت الاستيقاظ</label>
            <input
              type="time"
              value={form.wakeTime}
              onChange={(event) => setForm((prev) => ({ ...prev, wakeTime: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">جودة النوم</label>
            <select
              value={form.quality}
              onChange={(event) => setForm((prev) => ({ ...prev, quality: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {qualityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-left"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <input
              type="text"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="مثال: استيقظت مرتين"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={!form.bedTime || !form.wakeTime}
          >
            <PlusIcon className="w-4 h-4 ml-2" />
            إضافة السجل
          </Button>
          <span className="text-xs text-gray-500">
            مدة النوم المتوقعة: {previewHours ? `${previewHours} ساعة` : '--'}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">سجل النوم</h3>
          <span className="text-sm text-gray-500">آخر {rangeDays} يوم</span>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-500">لا توجد سجلات نوم حالياً.</div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const bedTime = record.bedTime ?? record.bed_time ?? '';
              const wakeTime = record.wakeTime ?? record.wake_time ?? '';

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{record.hours} ساعة</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(record.date)} • {bedTime} → {wakeTime}
                    </div>
                    {record.notes && <div className="text-xs text-gray-400 mt-1">📝 {record.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={resolveQualityVariant(record.quality)} size="sm">
                      {record.quality}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
