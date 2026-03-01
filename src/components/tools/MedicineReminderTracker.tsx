'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellAlertIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

interface MedicineDose {
  id: number;
  scheduled_time?: string;
  scheduledTime?: string;
  date?: string | null;
}

interface MedicineReminder {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  start_date?: string | null;
  startDate?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  notes?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  days_left?: number | null;
  is_expired?: boolean;
  doses?: MedicineDose[];
  doses_taken_count?: number;
  compliance_rate?: number;
}

interface FormState {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  duration: string;
  notes: string;
}

const frequencyOptions = [
  'مرة يومياً',
  'مرتين يومياً',
  'ثلاث مرات يومياً',
  'أربع مرات يومياً',
  'كل 12 ساعة',
  'كل 8 ساعات',
];

const statusStyles: Record<'active' | 'inactive', string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function MedicineReminderTracker() {
  const today = new Date().toISOString().split('T')[0];
  const [medicines, setMedicines] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    dosage: '',
    frequency: 'مرة يومياً',
    times: ['08:00'],
    startDate: today,
    duration: '7',
    notes: '',
  });

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/health-tools/medicines', { cache: 'no-store' });
      if (response.status === 401) {
        setAuthRequired(true);
        setMedicines([]);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل تحميل الأدوية');
      }
      setMedicines(data.results || []);
      setAuthRequired(false);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الأدوية';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      dosage: '',
      frequency: 'مرة يومياً',
      times: ['08:00'],
      startDate: today,
      duration: '7',
      notes: '',
    });
  };

  const updateTime = (index: number, value: string) => {
    setForm((prev) => {
      const times = [...prev.times];
      times[index] = value;
      return { ...prev, times };
    });
  };

  const addTimeField = () => {
    setForm((prev) => ({ ...prev, times: [...prev.times, ''] }));
  };

  const removeTimeField = (index: number) => {
    setForm((prev) => {
      const times = prev.times.filter((_, idx) => idx !== index);
      return { ...prev, times: times.length ? times : ['08:00'] };
    });
  };

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);

    if (!form.name.trim() || !form.dosage.trim()) {
      setError('يرجى إدخال اسم الدواء والجرعة');
      return;
    }

    const durationDays = Number(form.duration);
    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      setError('مدة العلاج غير صالحة');
      return;
    }

    const times = form.times.map((time) => time.trim()).filter(Boolean);
    if (!times.length) {
      setError('يرجى تحديد وقت جرعة واحد على الأقل');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/health-tools/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          dosage: form.dosage.trim(),
          frequency: form.frequency,
          times,
          start_date: form.startDate,
          duration_days: durationDays,
          notes: form.notes.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حفظ الدواء');
      }

      setMedicines((prev) => [data, ...prev]);
      setMessage('تمت إضافة الدواء بنجاح');
      setShowForm(false);
      resetForm();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الدواء';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicine = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدواء؟')) return;

    try {
      const response = await fetch(`/api/health-tools/medicines/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'فشل حذف الدواء');
      }
      setMedicines((prev) => prev.filter((medicine) => medicine.id !== id));
      setMessage('تم حذف الدواء');
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الدواء';
      setError(messageText);
    }
  };

  const markAsTaken = async (medicineId: number, time: string) => {
    try {
      const response = await fetch(`/api/health-tools/medicines/${medicineId}/mark-taken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_time: time,
          date: today,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'فشل تسجيل الجرعة');
      }

      await loadMedicines();
      setMessage('تم تسجيل الجرعة');
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الجرعة';
      setError(messageText);
    }
  };

  const stats = useMemo(() => {
    const activeMedicines = medicines.filter((medicine) => {
      const isActive = medicine.isActive ?? medicine.is_active ?? false;
      const daysLeft = medicine.days_left ?? 0;
      return isActive && daysLeft > 0;
    });

    const dosesToday = medicines.reduce((sum, medicine) => {
      const doses = medicine.doses || [];
      const todayCount = doses.filter((dose) => dose.date === today).length;
      return sum + todayCount;
    }, 0);

    const totalDoses = medicines.reduce((sum, medicine) => sum + (medicine.doses?.length ?? 0), 0);

    return {
      activeMedicines: activeMedicines.length,
      dosesToday,
      totalDoses,
    };
  }, [medicines, today]);

  if (authRequired) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-4">
          <BellAlertIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">سجل الأدوية يتطلب تسجيل الدخول</h3>
        <p className="text-sm text-gray-600 mb-4">سجل أدويتك وتابع الجرعات بعد تسجيل الدخول.</p>
        <Link href="/login?redirect=/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-500 text-white">
          تسجيل الدخول
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <BellAlertIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">تذكير الأدوية</h2>
            <p className="text-sm text-gray-500">إدارة جدول الأدوية والتنبيهات اليومية.</p>
          </div>
        </div>
        <Button type="button" onClick={() => setShowForm((prev) => !prev)}>
          <PlusIcon className="w-4 h-4 ml-2" />
          إضافة دواء
        </Button>
      </div>

      {message && (
        <Card className="bg-green-50 border border-green-200 text-green-700">{message}</Card>
      )}
      {error && (
        <Card className="bg-red-50 border border-red-200 text-red-700">{error}</Card>
      )}

      {showForm && (
        <Card className="border border-primary-100 bg-primary-50/40">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة دواء جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدواء *</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="مثال: باراسيتامول"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجرعة *</label>
              <input
                type="text"
                value={form.dosage}
                onChange={(event) => setForm((prev) => ({ ...prev, dosage: event.target.value }))}
                placeholder="مثال: 500 ملجم"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التكرار</label>
              <select
                value={form.frequency}
                onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {frequencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدة (أيام)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <input
                type="text"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="مثال: بعد الأكل"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">مواعيد الجرعات</label>
            <div className="space-y-2">
              {form.times.map((time, index) => (
                <div key={`${index}-${time}`} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => updateTime(index, event.target.value)}
                    className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {form.times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeField(index)}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTimeField}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + إضافة وقت آخر
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" onClick={handleSubmit} isLoading={saving}>
              حفظ الدواء
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-semibold text-primary-600">{stats.activeMedicines}</div>
          <div className="text-sm text-gray-500">أدوية نشطة</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-green-600">{stats.dosesToday}</div>
          <div className="text-sm text-gray-500">جرعات اليوم</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-gray-700">{stats.totalDoses}</div>
          <div className="text-sm text-gray-500">إجمالي الجرعات</div>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : medicines.length === 0 ? (
          <div className="py-12 text-center text-gray-500">لا توجد أدوية مسجلة بعد.</div>
        ) : (
          <div className="space-y-4">
            {medicines.map((medicine) => {
              const isActive = medicine.isActive ?? medicine.is_active ?? false;
              const daysLeft = medicine.days_left ?? 0;
              const startDate = medicine.start_date ?? medicine.startDate;
              const endDate = medicine.end_date ?? null;
              const statusKey = isActive && daysLeft > 0 ? 'active' : 'inactive';
              const takenToday = new Set(
                (medicine.doses || [])
                  .filter((dose) => dose.date === today)
                  .map((dose) => dose.scheduled_time ?? dose.scheduledTime)
              );

              return (
                <div
                  key={medicine.id}
                  className={cn(
                    'p-5 rounded-xl border transition-colors',
                    statusKey === 'active'
                      ? 'bg-white border-primary-100'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{medicine.name}</h4>
                      <p className="text-sm text-gray-500">
                        {medicine.dosage} • {medicine.frequency}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMedicine(medicine.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                    <span className={cn('px-2 py-1 rounded-full', statusStyles[statusKey])}>
                      {statusKey === 'active' ? `متبقي ${daysLeft} يوم` : 'غير نشط'}
                    </span>
                    {startDate && (
                      <span className="text-gray-500">
                        من {startDate} {endDate ? `إلى ${endDate}` : ''}
                      </span>
                    )}
                    {medicine.compliance_rate !== undefined && (
                      <span className="text-gray-500">نسبة الالتزام: {medicine.compliance_rate}%</span>
                    )}
                  </div>

                  {medicine.notes && (
                    <p className="text-sm text-gray-500 mt-2">📝 {medicine.notes}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {medicine.times.map((time) => {
                      const isTaken = takenToday.has(time);
                      return (
                        <button
                          key={`${medicine.id}-${time}`}
                          type="button"
                          onClick={() => !isTaken && markAsTaken(medicine.id, time)}
                          disabled={isTaken}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            isTaken
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-primary-500 text-white hover:bg-primary-600'
                          )}
                        >
                          {isTaken ? `✓ ${time}` : `⏰ ${time}`}
                        </button>
                      );
                    })}
                  </div>

                  {medicine.doses && medicine.doses.length > 0 && (
                    <div className="mt-4">
                      <Badge variant="success" size="sm">
                        تم تسجيل {medicine.doses.length} جرعة حتى الآن
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
