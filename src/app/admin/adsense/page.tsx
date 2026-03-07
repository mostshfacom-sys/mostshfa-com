'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdSenseConfigPage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAdSenseStatus();
  }, []);

  const fetchAdSenseStatus = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config');
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching AdSense status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdSense = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/adsense-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isEnabled }),
      });
      if (res.ok) {
        setIsEnabled(!isEnabled);
        toast.success(!isEnabled ? 'تم تفعيل أدسينس' : 'تم إيقاف أدسينس مؤقتاً');
      } else {
        toast.error('فشل في تحديث حالة أدسينس');
      }
    } catch (error) {
      console.error('Error toggling AdSense:', error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إعدادات جوجل أدسينس</h1>
              <p className="text-gray-500">تحكم في ظهور الإعلانات على الموقع بشكل فوري</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-medium ${isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {isEnabled ? 'مفعل الآن' : 'متوقف حالياً'}
            </span>
            <button
              onClick={toggleAdSense}
              disabled={isUpdating}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isEnabled ? 'bg-green-600' : 'bg-gray-300'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`${
                  isEnabled ? 'translate-x-7' : 'translate-x-1'
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
              />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>ℹ️</span> متى تستخدم هذا الخيار؟
            </h3>
            <ul className="text-blue-700 text-sm space-y-2 list-disc list-inside">
              <li>عندما تقوم بتصفح الموقع بكثرة للتأكد من المحتوى.</li>
              <li>أثناء القيام بتعديلات برمجية على واجهة المستخدم.</li>
              <li>إذا لاحظت نشاطاً غير معتاد في حساب أدسينس الخاص بك.</li>
            </ul>
          </div>

          <div className="p-6 bg-amber-50 rounded-xl border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <span>⚠️</span> تنبيهات هامة
            </h3>
            <p className="text-amber-700 text-sm">
              هذا الخيار يتحكم في "تحميل سكريبت أدسينس" نفسه. الإيقاف هنا يمنع أي طلبات تخرج من موقعك إلى سيرفرات جوجل، مما يحمي حسابك تماماً من النقرات غير الشرعية أثناء تطويرك للموقع.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
