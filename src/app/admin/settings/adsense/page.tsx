'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminAdSenseSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config');
      if (res.ok) {
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <p className="text-sm text-gray-500">تحكم في تفعيل/إيقاف الإعلانات على صفحات الموقع العامة</p>
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
            <h3 className="font-semibold text-blue-800 mb-1">ملاحظة</h3>
            <p className="text-blue-700 text-sm">
              هذا الإعداد يتحكم في تحميل سكربت AdSense على صفحات الموقع العامة فقط.
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-1">أمان أدسنس</h3>
            <p className="text-amber-700 text-sm">
              صفحات لوحة التحكم /admin لا يتم تحميل أي سكربت إعلاني عليها نهائياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
