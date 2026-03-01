'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChartBarIcon, PlusIcon, ScaleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

interface WeightRecord {
  id: number;
  weight: number;
  date: string;
  notes?: string | null;
  weight_change?: number;
  weightChange?: number;
}

interface WeightStats {
  total_records: number;
  starting_weight: number;
  current_weight: number;
  total_change: number;
  average_weight: number;
  highest_weight: number;
  lowest_weight: number;
}

interface WeightFormState {
  weight: string;
  date: string;
  notes: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ar-EG');
};

export default function WeightTracker() {
  const today = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [form, setForm] = useState<WeightFormState>({
    weight: '',
    date: today,
    notes: '',
  });

  const handleUnauthorized = () => {
    setAuthRequired(true);
    setRecords([]);
    setStats(null);
  };

  const loadRecords = async () => {
    const response = await fetch('/api/health-tools/weight-records', { cache: 'no-store' });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'فشل تحميل السجلات');
    }
    setRecords(data.results || []);
  };

  const loadStats = async () => {
    const response = await fetch('/api/health-tools/weight-records/stats', { cache: 'no-store' });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'فشل تحميل الإحصائيات');
    }
    if (data?.message) {
      setStats(null);
      return;
    }
    setStats(data as WeightStats);
  };

  const loadAll = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await Promise.all([loadRecords(), loadStats()]);
      setAuthRequired(false);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل السجلات';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    const weightValue = Number(form.weight);

    if (!weightValue || weightValue <= 0) {
      setError('يرجى إدخال وزن صحيح');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/health-tools/weight-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: weightValue,
          date: form.date,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حفظ الوزن');
      }
      setForm({ weight: '', date: today, notes: '' });
      setMessage('تم تسجيل الوزن بنجاح');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الوزن';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;
    try {
      const response = await fetch(`/api/health-tools/weight-records/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حذف السجل');
      }
      setMessage('تم حذف السجل');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف';
      setError(messageText);
    }
  };

  const formattedRecords = useMemo(
    () =>
      records.map((record) => {
        const change = record.weight_change ?? record.weightChange ?? 0;
        return { ...record, change };
      }),
    [records]
  );

  if (authRequired) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
          <ScaleIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">متابعة الوزن تتطلب تسجيل الدخول</h3>
        <p className="text-sm text-gray-600 mb-4">سجل قياساتك اليومية بعد تسجيل الدخول.</p>
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
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ScaleIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">متتبع الوزن</h2>
            <p className="text-sm text-gray-500">راقب وزنك وتطورك بمرور الوقت.</p>
          </div>
        </div>
        <Badge variant="info" size="sm">
          تحديث تلقائي للسجلات
        </Badge>
      </div>

      {message && (
        <Card className="bg-green-50 border border-green-200 text-green-700">{message}</Card>
      )}
      {error && (
        <Card className="bg-red-50 border border-red-200 text-red-700">{error}</Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-semibold text-emerald-600">{stats?.current_weight ?? '--'}</div>
          <div className="text-sm text-gray-500">الوزن الحالي (كجم)</div>
        </Card>
        <Card className="text-center">
          <div
            className={cn(
              'text-2xl font-semibold',
              stats && stats.total_change > 0
                ? 'text-red-600'
                : stats && stats.total_change < 0
                  ? 'text-green-600'
                  : 'text-gray-700'
            )}
          >
            {stats ? `${stats.total_change > 0 ? '+' : ''}${stats.total_change.toFixed(1)}` : '--'}
          </div>
          <div className="text-sm text-gray-500">التغير الإجمالي (كجم)</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-gray-700">{stats?.average_weight?.toFixed(1) ?? '--'}</div>
          <div className="text-sm text-gray-500">متوسط الوزن (كجم)</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة قياس جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوزن (كجم)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
              placeholder="70"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <input
              type="text"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="مثال: بعد التمرين"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={handleSubmit} isLoading={saving}>
            <PlusIcon className="w-4 h-4 ml-2" />
            إضافة القياس
          </Button>
          <span className="text-xs text-gray-500">احرص على القياس في نفس التوقيت يومياً.</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">سجل القياسات</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ChartBarIcon className="w-4 h-4" />
            {records.length} قياس
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : formattedRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-500">لا توجد قياسات مسجلة بعد.</div>
        ) : (
          <div className="space-y-3">
            {formattedRecords.map((record) => {
              const changeValue = Number(record.change || 0);
              const changeLabel = changeValue === 0 ? 'ثابت' : `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)} كجم`;
              const badgeVariant =
                changeValue > 0 ? 'danger' : changeValue < 0 ? 'success' : 'secondary';

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="text-xl font-semibold text-gray-900">{record.weight} كجم</div>
                    <div className="text-sm text-gray-500">{formatDate(record.date)}</div>
                    {record.notes && <div className="text-xs text-gray-400 mt-1">📝 {record.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={badgeVariant} size="sm">
                      {changeLabel}
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
