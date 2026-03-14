'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: number;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
  order: number;
  isActive: boolean;
  _count?: { articles: number };
}

export default function AdminArticleCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<{ id?: number; nameAr: string; nameEn: string; slug: string; icon: string; color: string; parentId: string; order: string; isActive: boolean; }>(
    { nameAr: '', nameEn: '', slug: '', icon: '', color: '', parentId: '', order: '0', isActive: true }
  );

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', '1');
      params.set('limit', '200');

      const res = await fetch(`/api/admin/article-categories?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'فشل في جلب التصنيفات');
      }
      setCategories(data.categories || []);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ nameAr: '', nameEn: '', slug: '', icon: '', color: '', parentId: '', order: '0', isActive: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.nameAr.trim()) {
      setMessage({ type: 'error', text: 'اسم التصنيف بالعربي مطلوب' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || null,
        slug: form.slug.trim() || undefined,
        icon: form.icon.trim() || null,
        color: form.color.trim() || null,
        parentId: form.parentId ? Number(form.parentId) : null,
        order: Number(form.order || '0'),
        isActive: form.isActive,
      };

      const endpoint = form.id ? `/api/admin/article-categories/${form.id}` : '/api/admin/article-categories';
      const method = form.id ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'فشل في حفظ التصنيف');
      }

      setMessage({ type: 'success', text: 'تم حفظ التصنيف بنجاح' });
      resetForm();
      await load();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const edit = (cat: Category) => {
    setMessage(null);
    setForm({
      id: cat.id,
      nameAr: cat.nameAr || '',
      nameEn: cat.nameEn || '',
      slug: cat.slug || '',
      icon: cat.icon || '',
      color: cat.color || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      order: String(cat.order ?? 0),
      isActive: !!cat.isActive,
    });
  };

  const remove = async (cat: Category) => {
    if (!confirm(`هل أنت متأكد من حذف التصنيف: ${cat.nameAr}؟`)) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/article-categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'فشل في حذف التصنيف');
      }
      setMessage({ type: 'success', text: 'تم حذف التصنيف' });
      await load();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setMessage({ type: 'error', text });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تصنيفات المقالات</h1>
          <p className="text-gray-600 mt-1">إنشاء/تعديل/حذف تصنيفات المقالات</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMessage(null);
          }}
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          تصنيف جديد
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="بحث في التصنيفات..."
            />
            <button
              type="button"
              onClick={() => load()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              بحث
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">لا توجد تصنيفات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2">الاسم</th>
                    <th className="text-right py-2">Slug</th>
                    <th className="text-right py-2">الحالة</th>
                    <th className="text-right py-2">الترتيب</th>
                    <th className="text-right py-2">مقالات</th>
                    <th className="text-right py-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b">
                      <td className="py-2">
                        <div className="font-medium text-gray-900">{cat.nameAr}</div>
                        {cat.nameEn ? <div className="text-xs text-gray-500" dir="ltr">{cat.nameEn}</div> : null}
                      </td>
                      <td className="py-2 text-sm text-gray-700" dir="ltr">{cat.slug}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${
                            cat.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {cat.isActive ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </td>
                      <td className="py-2">{cat.order}</td>
                      <td className="py-2">{cat._count?.articles ?? '-'}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => edit(cat)} className="text-blue-600">
                            تعديل
                          </button>
                          <button type="button" onClick={() => remove(cat)} className="text-red-600">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
            {form.id ? 'تعديل التصنيف' : 'إضافة تصنيف'}
          </h2>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">الاسم بالعربي</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الاسم بالإنجليزي (اختياري)</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Slug (اختياري)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الأيقونة (اختياري)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">اللون (اختياري)</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
                placeholder="#10B981"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">التصنيف الأب (اختياري)</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">بدون</option>
                {categories
                  .filter((c) => !form.id || c.id !== form.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الترتيب</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">مفعل</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                مسح
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
