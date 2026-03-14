'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

type PlacementKey =
  | 'home_between_tips'
  | 'home_footer'
  | 'article_after_excerpt'
  | 'article_mid'
  | 'article_bottom'
  | 'drug_after_usage'
  | 'hospital_overview'
  | 'articles_list'
  | 'medical_videos_list';

type PlacementConfig = {
  enabled: boolean;
  slot: string;
  format: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive: 'true' | 'false';
};

type AdSenseConfig = {
  clientId: string;
  placements: Record<PlacementKey, PlacementConfig>;
};

const defaultConfig: AdSenseConfig = {
  clientId: 'ca-pub-5755672349927118',
  placements: {
    home_between_tips: { enabled: true, slot: '1234567890', format: 'auto', responsive: 'true' },
    home_footer: { enabled: true, slot: '9876543210', format: 'horizontal', responsive: 'true' },
    article_after_excerpt: { enabled: true, slot: '7841529630', format: 'auto', responsive: 'true' },
    article_mid: { enabled: true, slot: '', format: 'fluid', responsive: 'true' },
    article_bottom: { enabled: true, slot: '8952147361', format: 'auto', responsive: 'true' },
    drug_after_usage: { enabled: true, slot: '5678901234', format: 'auto', responsive: 'true' },
    hospital_overview: { enabled: true, slot: '1234567891', format: 'auto', responsive: 'true' },
    articles_list: { enabled: false, slot: '', format: 'auto', responsive: 'true' },
    medical_videos_list: { enabled: false, slot: '', format: 'auto', responsive: 'true' },
  },
};

const placementsMeta: { key: PlacementKey; label: string; description: string }[] = [
  { key: 'home_between_tips', label: 'الرئيسية - بين النصائح والمقالات', description: 'موضع مرئي قبل المحتوى النصي المقروء' },
  { key: 'home_footer', label: 'الرئيسية - قبل الفوتر', description: 'مساحة ختامية واضحة بدون إزعاج المستخدم' },
  { key: 'article_after_excerpt', label: 'المقال - بعد المقدمة', description: 'موضع مناسب قبل بداية المحتوى التفصيلي' },
  { key: 'article_mid', label: 'المقال - منتصف النص', description: 'يظهر داخل المحتوى الطويل بشكل طبيعي' },
  { key: 'article_bottom', label: 'المقال - بعد التقييم', description: 'موضع متأخر لزيادة مدة التفاعل' },
  { key: 'drug_after_usage', label: 'الأدوية - بعد دواعي الاستعمال', description: 'موضع داخل المحتوى المعلوماتي' },
  { key: 'hospital_overview', label: 'المستشفيات - داخل نظرة عامة', description: 'موضع بجانب معلومات المستشفى' },
  { key: 'articles_list', label: 'قائمة المقالات', description: 'بعد شبكة المقالات في صفحة المقالات' },
  { key: 'medical_videos_list', label: 'مكتبة الفيديو', description: 'بعد قسم الفيديوهات الرئيسية' },
];

export default function AdminAdSenseSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<AdSenseConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config');
      if (res.ok) {
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
        if (data.config) {
          setConfig(data.config);
        }
      } else {
        toast.error('تعذر تحميل حالة الإعلانات');
      }
    } catch (e) {
      toast.error('تعذر تحميل حالة الإعلانات');
    } finally {
      setLoading(false);
    }
  };

  const onToggle = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/adsense-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
        toast.success(!enabled ? 'تم تفعيل الإعلانات' : 'تم إيقاف الإعلانات');
      } else {
        toast.error('فشل تحديث حالة الإعلانات');
      }
    } catch (e) {
      toast.error('فشل تحديث حالة الإعلانات');
    } finally {
      setUpdating(false);
    }
  };

  const updatePlacement = (key: PlacementKey, patch: Partial<PlacementConfig>) => {
    setConfig((prev) => ({
      ...prev,
      placements: {
        ...prev.placements,
        [key]: {
          ...prev.placements[key],
          ...patch,
        },
      },
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/adsense-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        toast.success('تم حفظ إعدادات الإعلانات');
      } else {
        toast.error('فشل حفظ إعدادات الإعلانات');
      }
    } catch {
      toast.error('فشل حفظ إعدادات الإعلانات');
    } finally {
      setSaving(false);
    }
  };

  const formatOptions = useMemo(() => ['auto', 'fluid', 'rectangle', 'vertical', 'horizontal'] as const, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">إعدادات الإعلانات (AdSense)</h1>
              <p className="text-sm text-gray-500">تحكم في تفعيل الإعلانات وإدارة جميع الوحدات</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
              {enabled ? 'مفعل الآن' : 'متوقف حالياً'}
            </span>
            <button
              onClick={onToggle}
              disabled={updating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                enabled ? 'bg-green-600' : 'bg-gray-200'
              } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="تفعيل/إيقاف الإعلانات"
            >
              <span
                className={`${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-1">تحميل السكربت</h3>
            <p className="text-blue-700 text-sm">هذا الزر يتحكم فقط في تحميل السكربت داخل الصفحات العامة.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-1">الإعلانات التلقائية</h3>
            <p className="text-amber-700 text-sm">يمكنك التحكم فيها من لوحة AdSense مباشرة دون إجبار عبر الكود.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">معرف الناشر</h2>
          <input
            value={config.clientId}
            onChange={(e) => setConfig((prev) => ({ ...prev, clientId: e.target.value.trim() }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="ca-pub-xxxxxxxxxxxxxxxx"
          />
        </div>

        <div className="grid gap-4">
          {placementsMeta.map((placement) => {
            const data = config.placements[placement.key];
            return (
              <div key={placement.key} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{placement.label}</p>
                    <p className="text-sm text-gray-500">{placement.description}</p>
                  </div>
                  <button
                    onClick={() => updatePlacement(placement.key, { enabled: !data.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      data.enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`${
                        data.enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">معرف الوحدة</label>
                    <input
                      value={data.slot}
                      onChange={(e) => updatePlacement(placement.key, { slot: e.target.value.trim() })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="مثال: 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">نوع الإعلان</label>
                    <select
                      value={data.format}
                      onChange={(e) =>
                        updatePlacement(placement.key, { format: e.target.value as PlacementConfig['format'] })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {formatOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">استجابة العرض</label>
                    <select
                      value={data.responsive}
                      onChange={(e) =>
                        updatePlacement(placement.key, { responsive: e.target.value as PlacementConfig['responsive'] })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="true">متجاوب</option>
                      <option value="false">ثابت</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
}
