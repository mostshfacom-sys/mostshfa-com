'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FireIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface FoodEntry {
  id: number;
  meal: string;
  food: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  date: string;
  time: string;
}

interface DailyStats {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals_count: number;
  breakdown_by_meal?: Record<string, { calories: number; count: number }>;
}

interface FoodFormState {
  meal: string;
  food: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  time: string;
}

const mealOptions = ['فطور', 'غداء', 'عشاء', 'سناك'];

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ar-EG');
};

const resolveMealVariant = (meal?: string) => {
  if (!meal) return 'secondary';
  if (meal.includes('فطور')) return 'warning';
  if (meal.includes('غداء')) return 'success';
  if (meal.includes('عشاء')) return 'info';
  if (meal.includes('سناك')) return 'primary';
  return 'secondary';
};

const parseOptionalNumber = (value: string, label: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`قيمة ${label} غير صالحة`);
  }
  return parsed;
};

export default function FoodDiaryTracker() {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FoodFormState>({
    meal: 'فطور',
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    time: nowTime,
  });

  const handleUnauthorized = () => {
    setAuthRequired(true);
    setEntries([]);
    setStats(null);
  };

  const loadEntries = async () => {
    const response = await fetch(`/api/health-tools/food-entries?date=${selectedDate}`, {
      cache: 'no-store',
    });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'فشل تحميل الوجبات');
    }
    setEntries(data.results || []);
  };

  const loadStats = async () => {
    const response = await fetch(`/api/health-tools/food-entries/daily-stats?date=${selectedDate}`, {
      cache: 'no-store',
    });
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
    setStats(data as DailyStats);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await Promise.all([loadEntries(), loadStats()]);
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
  }, [selectedDate]);

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);

    const foodValue = form.food.trim();
    const caloriesValue = Number(form.calories);

    if (!foodValue) {
      setError('يرجى إدخال اسم الطعام');
      return;
    }

    if (!Number.isFinite(caloriesValue) || caloriesValue <= 0) {
      setError('يرجى إدخال عدد السعرات بشكل صحيح');
      return;
    }

    let proteinValue: number | null = null;
    let carbsValue: number | null = null;
    let fatsValue: number | null = null;

    try {
      proteinValue = parseOptionalNumber(form.protein, 'البروتين');
      carbsValue = parseOptionalNumber(form.carbs, 'الكربوهيدرات');
      fatsValue = parseOptionalNumber(form.fats, 'الدهون');
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'بيانات المغذيات غير صالحة';
      setError(messageText);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/health-tools/food-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: form.meal,
          food: foodValue,
          calories: caloriesValue,
          protein: proteinValue,
          carbs: carbsValue,
          fats: fatsValue,
          date: selectedDate,
          time: form.time || nowTime,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حفظ الوجبة');
      }

      setForm({
        meal: 'فطور',
        food: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        time: nowTime,
      });
      setMessage('تمت إضافة الوجبة بنجاح');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الوجبة';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الوجبة؟')) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/health-tools/food-entries/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'فشل حذف الوجبة');
      }

      setMessage('تم حذف الوجبة');
      await loadAll();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الوجبة';
      setError(messageText);
    }
  };

  const summary = useMemo<DailyStats | null>(() => {
    if (stats) return stats;
    if (!entries.length) return null;

    const breakdown: Record<string, { calories: number; count: number }> = {};
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    entries.forEach((entry) => {
      totalCalories += entry.calories ?? 0;
      totalProtein += entry.protein ?? 0;
      totalCarbs += entry.carbs ?? 0;
      totalFats += entry.fats ?? 0;

      if (!breakdown[entry.meal]) {
        breakdown[entry.meal] = { calories: 0, count: 0 };
      }
      breakdown[entry.meal].calories += entry.calories ?? 0;
      breakdown[entry.meal].count += 1;
    });

    return {
      date: selectedDate,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fats: totalFats,
      meals_count: entries.length,
      breakdown_by_meal: breakdown,
    };
  }, [stats, entries, selectedDate]);

  if (authRequired) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-600 mb-4">
          <FireIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">مفكرة الطعام تتطلب تسجيل الدخول</h3>
        <p className="text-sm text-gray-600 mb-4">سجل وجباتك اليومية بعد تسجيل الدخول.</p>
        <Link
          href="/login?redirect=/tools"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-500 text-white"
        >
          تسجيل الدخول
        </Link>
      </Card>
    );
  }

  const mealsCount = summary?.meals_count ?? 0;
  const breakdownEntries = Object.entries(summary?.breakdown_by_meal ?? {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <FireIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">مفكرة الطعام</h2>
            <p className="text-sm text-gray-500">سجل وجباتك وتابع إجمالي السعرات.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info" size="sm">
            عدد الوجبات: {mealsCount}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>التاريخ</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-left"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {message && <Card className="bg-green-50 border border-green-200 text-green-700">{message}</Card>}
      {error && <Card className="bg-red-50 border border-red-200 text-red-700">{error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-semibold text-orange-600">
            {summary ? summary.total_calories : '--'}
          </div>
          <div className="text-sm text-gray-500">السعرات (ك.س)</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-blue-600">
            {summary ? summary.total_protein : '--'}
          </div>
          <div className="text-sm text-gray-500">بروتين (غ)</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-emerald-600">
            {summary ? summary.total_carbs : '--'}
          </div>
          <div className="text-sm text-gray-500">كربوهيدرات (غ)</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-semibold text-amber-600">
            {summary ? summary.total_fats : '--'}
          </div>
          <div className="text-sm text-gray-500">دهون (غ)</div>
        </Card>
      </div>

      {breakdownEntries.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع السعرات حسب الوجبات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {breakdownEntries.map(([meal, data]) => (
              <div
                key={meal}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={resolveMealVariant(meal)} size="sm">
                    {meal}
                  </Badge>
                  <span className="text-sm text-gray-500">{data.count} وجبة</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{data.calories} ك.س</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة وجبة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوجبة</label>
            <select
              value={form.meal}
              onChange={(event) => setForm((prev) => ({ ...prev, meal: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {mealOptions.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الطعام *</label>
            <input
              type="text"
              value={form.food}
              onChange={(event) => setForm((prev) => ({ ...prev, food: event.target.value }))}
              placeholder="مثال: بيض مسلوق"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السعرات *</label>
            <input
              type="number"
              value={form.calories}
              onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
              placeholder="350"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بروتين (غ)</label>
            <input
              type="number"
              value={form.protein}
              onChange={(event) => setForm((prev) => ({ ...prev, protein: event.target.value }))}
              placeholder="20"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كربوهيدرات (غ)</label>
            <input
              type="number"
              value={form.carbs}
              onChange={(event) => setForm((prev) => ({ ...prev, carbs: event.target.value }))}
              placeholder="45"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دهون (غ)</label>
            <input
              type="number"
              value={form.fats}
              onChange={(event) => setForm((prev) => ({ ...prev, fats: event.target.value }))}
              placeholder="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={handleSubmit} isLoading={saving} disabled={!form.food || !form.calories}>
            <PlusIcon className="w-4 h-4 ml-2" />
            إضافة الوجبة
          </Button>
          <span className="text-xs text-gray-500">اختر التاريخ من الأعلى لتحديد يوم التسجيل.</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">سجل الوجبات</h3>
          <span className="text-sm text-gray-500">{formatDate(selectedDate)}</span>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">لا توجد وجبات مسجلة لهذا اليوم.</div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const macros = [
                entry.protein ? `بروتين ${entry.protein}غ` : null,
                entry.carbs ? `كربوهيدرات ${entry.carbs}غ` : null,
                entry.fats ? `دهون ${entry.fats}غ` : null,
              ].filter(Boolean);

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={resolveMealVariant(entry.meal)} size="sm">
                        {entry.meal}
                      </Badge>
                      <span className="text-lg font-semibold text-gray-900">{entry.food}</span>
                    </div>
                    <div className="text-sm text-gray-500">{entry.time}</div>
                    {macros.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">{macros.join(' • ')}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-orange-600">{entry.calories} ك.س</div>
                      <div className="text-xs text-gray-400">{formatDate(entry.date)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
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
