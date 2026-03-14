'use client';

import { useEffect, useMemo, useState } from 'react';

type VisualTip = {
  id: number;
  titleAr: string;
  contentAr: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

const emptyForm = {
  titleAr: '',
  contentAr: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
};

export default function VisualTipsAdminPage() {
  const [tips, setTips] = useState<VisualTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredTips = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return tips;
    return tips.filter((tip) => {
      const haystack = `${tip.titleAr} ${tip.contentAr ?? ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [tips, searchTerm]);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/visual-tips');
      const data = await res.json();
      setTips(data.tips ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleChange = (field: keyof typeof formState, value: string | boolean | number) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (tip: VisualTip) => {
    setEditingId(tip.id);
    setFormState({
      titleAr: tip.titleAr,
      contentAr: tip.contentAr ?? '',
      imageUrl: tip.imageUrl ?? '',
      isActive: tip.isActive,
      sortOrder: tip.sortOrder,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormState({ ...emptyForm });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.titleAr.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        titleAr: formState.titleAr.trim(),
        contentAr: formState.contentAr.trim() || null,
        imageUrl: formState.imageUrl.trim() || null,
        isActive: formState.isActive,
        sortOrder: Number(formState.sortOrder) || 0,
      };
      if (editingId) {
        await fetch(`/api/admin/visual-tips/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/visual-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await fetchTips();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tipId: number) => {
    if (!window.confirm('هل تريد حذف هذه المعلومة المصورة؟')) return;
    await fetch(`/api/admin/visual-tips/${tipId}`, { method: 'DELETE' });
    await fetchTips();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المعلومات المصورة</h1>
          <p className="text-gray-600">إضافة صور طبية أو نصوص يتم تحويلها لبطاقات مصورة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">عنوان المعلومة</label>
            <input
              value={formState.titleAr}
              onChange={(e) => handleChange('titleAr', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="اكتب عنواناً مختصراً"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رابط الصورة (اختياري)</label>
            <input
              value={formState.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النص المصور (اختياري)</label>
          <textarea
            value={formState.contentAr}
            onChange={(e) => handleChange('contentAr', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
            placeholder="اكتب النص الذي سيظهر داخل الصورة المصورة"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4"
            />
            تفعيل في الصفحة
          </label>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>ترتيب العرض</span>
            <input
              type="number"
              value={formState.sortOrder}
              onChange={(e) => handleChange('sortOrder', Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {editingId ? 'تحديث المعلومة' : 'إضافة معلومة مصورة'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="ابحث عن معلومة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : filteredTips.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد معلومات مصورة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">النوع</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الترتيب</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{tip.titleAr}</div>
                      {tip.contentAr && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{tip.contentAr}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tip.imageUrl ? 'صورة' : 'نص مصور'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tip.sortOrder}</td>
                    <td className="px-4 py-3 text-sm">
                      {tip.isActive ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          مفعلة
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                          معطلة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(tip)} className="text-blue-600 hover:text-blue-800">
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(tip.id)} className="text-red-600 hover:text-red-800">
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
    </div>
  );
}
