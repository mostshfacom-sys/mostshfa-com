'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChartBarIcon, HeartIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PressureLog {
  id: number;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  measured_at?: string;
  measuredAt?: string;
  status?: string;
  notes?: string | null;
  date?: string;
}

interface PressureFormState {
  systolic: string;
  diastolic: string;
  pulse: string;
  date: string;
  time: string;
  notes: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ar-EG');
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const resolveStatusVariant = (status?: string | null) => {
  if (!status) return 'secondary';
  if (status.includes('طبيعي')) return 'success';
  if (status.includes('مرتفع')) return 'warning';
  if (status.includes('مرحلة 1')) return 'warning';
  if (status.includes('مرحلة 2')) return 'danger';
  if (status.includes('أزمة')) return 'danger';
  return 'secondary';
};

export default function PressureLogTracker() {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [records, setRecords] = useState<PressureLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [form, setForm] = useState<PressureFormState>({
    systolic: '',
    diastolic: '',
    pulse: '',
    date: today,
    time: nowTime,
    notes: '',
  });

  const handleUnauthorized = () => {
    setAuthRequired(true);
    setRecords([]);
  };

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health-tools/pressure-logs', { cache: 'no-store' });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل سجلات الضغط');
      }
      setRecords(data.results || []);
      setAuthRequired(false);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل السجلات';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    const systolicValue = Number(form.systolic);
    const diastolicValue = Number(form.diastolic);

    if (!systolicValue || !diastolicValue) {
      setError('يرجى إدخال قراءات الضغط بشكل صحيح');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/health-tools/pressure-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systolic: systolicValue,
          diastolic: diastolicValue,
          pulse: form.pulse ? Number(form.pulse) : null,
          date: form.date,
          time: form.time,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حفظ القراءة');
      }
      setForm({ systolic: '', diastolic: '', pulse: '', date: today, time: nowTime, notes: '' });
      setMessage('تم تسجيل قراءة الضغط بنجاح');
      await loadRecords();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ القراءة';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('هل تريد حذف هذه القراءة؟')) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/health-tools/pressure-logs/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حذف السجل');
      }
      setMessage('تم حذف القراءة');
      await loadRecords();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف السجل';
      setError(messageText);
    }
  };

  const summary = useMemo(() => {
    if (!records.length) return null;
    const avgSystolic = Math.round(records.reduce((sum, record) => sum + record.systolic, 0) / records.length);
    const avgDiastolic = Math.round(records.reduce((sum, record) => sum + record.diastolic, 0) / records.length);
    const pulseReadings = records.filter((record) => Number(record.pulse));
    const avgPulse =
      pulseReadings.length > 0
        ? Math.round(pulseReadings.reduce((sum, record) => sum + (record.pulse || 0), 0) / pulseReadings.length)
        : null;
    return { avgSystolic, avgDiastolic, avgPulse, total: records.length };
  }, [records]);

  const latestStatus = records[0]?.status;

  if (authRequired) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
          <HeartIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">سجل الضغط يتطلب تسجيل الدخول</h3>
        <p className="text-sm text-gray-600 mb-4">احتفظ بسجل قراءات الضغط بعد تسجيل الدخول.</p>
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
          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <HeartIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">سجل ضغط الدم</h2>
            <p className="text-sm text-gray-500">تتبع قراءات الضغط والنبض بشكل منتظم.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {latestStatus && (
            <Badge variant={resolveStatusVariant(latestStatus)} size="sm">
              آخر قراءة: {latestStatus}
            </Badge>
          )}
          <Badge variant="info" size="sm">
            أحدث التحديثات
          </Badge>
        </div>
      </div>

      {message && <Card className="bg-green-50 border border-green-200 text-green-700">{message}</Card>}
      {error && <Card className="bg-red-50 border border-red-200 text-red-700">{error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-semibold text-red-600">
            {summary ? `${summary.avgSystolic}/${summary.avgDiastolic}` : '--'}
          </div>
          <div className="text-sm text-gray-500">متوسط القراءة</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-gray-700">{summary?.avgPulse ?? '--'}</div>
          <div className="text-sm text-gray-500">متوسط النبض</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-gray-700">{summary?.total ?? 0}</div>
          <div className="text-sm text-gray-500">عدد القراءات</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة قراءة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الانقباضي (العلوي)</label>
            <input
              type="number"
              value={form.systolic}
              onChange={(event) => setForm((prev) => ({ ...prev, systolic: event.target.value }))}
              placeholder="120"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الانبساطي (السفلي)</label>
            <input
              type="number"
              value={form.diastolic}
              onChange={(event) => setForm((prev) => ({ ...prev, diastolic: event.target.value }))}
              placeholder="80"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النبض (اختياري)</label>
            <input
              type="number"
              value={form.pulse}
              onChange={(event) => setForm((prev) => ({ ...prev, pulse: event.target.value }))}
              placeholder="72"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
            <input
              type="time"
              value={form.time}
              onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <input
              type="text"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="بعد الراحة"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={!form.systolic || !form.diastolic}
          >
            <PlusIcon className="w-4 h-4 ml-2" />
            إضافة القراءة
          </Button>
          <span className="text-xs text-gray-500">حافظ على القياس في توقيت ثابت قدر الإمكان.</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">سجل القراءات</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ChartBarIcon className="w-4 h-4" />
            {records.length} قراءة
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-500">لا توجد قراءات مسجلة بعد.</div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const measuredAt = record.measuredAt ?? record.measured_at;
              const dateLabel = record.date ?? (measuredAt ? measuredAt.split('T')[0] : '');
              const timeLabel = measuredAt ? formatTime(measuredAt) : '';
              const statusLabel = record.status ?? 'غير محدد';
              return (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="text-xl font-semibold text-gray-900">
                      {record.systolic}/{record.diastolic}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(dateLabel)} {timeLabel ? `• ${timeLabel}` : ''}
                    </div>
                    {record.pulse && <div className="text-sm text-gray-500">💓 {record.pulse} نبضة/دقيقة</div>}
                    {record.notes && <div className="text-xs text-gray-400 mt-1">📝 {record.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={resolveStatusVariant(statusLabel)} size="sm">
                      {statusLabel}
                    </Badge>
                    <button type="button" onClick={() => deleteRecord(record.id)} className="text-gray-400 hover:text-red-500">
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
