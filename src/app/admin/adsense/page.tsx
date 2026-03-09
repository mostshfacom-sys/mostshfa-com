'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface AdSlot {
  id?: number;
  slotName: string;
  adSlot: string;
  isEnabled: boolean;
  description: string;
}

export default function AdSenseAdmin() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettings] = useState({
    adsense_publisher_id: 'ca-pub-5755672349927118',
    adsense_enabled: 'true',
    adsense_auto_ads_enabled: 'true',
  });
  const [configs, setConfigs] = useState<AdSlot[]>([
    { slotName: 'home_middle', adSlot: '1234567890', isEnabled: true, description: 'الصفحة الرئيسية - المنتصف' },
    { slotName: 'home_footer', adSlot: '9876543210', isEnabled: true, description: 'الصفحة الرئيسية - قبل الفوتر' },
    { slotName: 'article_top', adSlot: '7841529630', isEnabled: true, description: 'المقال - بعد المقدمة' },
    { slotName: 'article_middle', adSlot: '4567890123', isEnabled: true, description: 'المقال - منتصف المحتوى' },
    { slotName: 'article_bottom', adSlot: '8952147361', isEnabled: true, description: 'المقال - النهاية' },
    { slotName: 'drug_usage', adSlot: '5678901234', isEnabled: true, description: 'الأدوية - بعد دواعي الاستعمال' },
    { slotName: 'hospital_overview', adSlot: '1234567891', isEnabled: true, description: 'المستشفيات - تبويب نظرة عامة' },
  ]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config');
      const data = await res.json();
      if (data.settings) {
        const newSettings = { ...settings };
        data.settings.forEach((s: any) => {
          if (s.key in newSettings) {
            newSettings[s.key as keyof typeof settings] = s.value;
          }
        });
        setSettings(newSettings);
      }
      if (data.configs && data.configs.length > 0) {
        setConfigs(data.configs);
      }
    } catch (error) {
      toast.error('فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/adsense-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, configs }),
      });
      if (res.ok) {
        toast.success('تم حفظ الإعدادات بنجاح');
      } else {
        toast.error('فشل حفظ الإعدادات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">إدارة إعلانات AdSense</h1>
        <p className="text-gray-500">تحكم كامل في مواضع الإعلانات، أرقام الوحدات، والإعلانات التلقائية.</p>
      </div>

      {/* Global Settings */}
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">الإعدادات العامة</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">معرف الناشر (Publisher ID)</label>
            <Input 
              value={settings.adsense_publisher_id}
              onChange={(e) => setSettings({...settings, adsense_publisher_id: e.target.value})}
              placeholder="ca-pub-xxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="flex gap-8 items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.adsense_enabled === 'true'}
                onChange={(e) => setSettings({...settings, adsense_enabled: e.target.checked ? 'true' : 'false'})}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>تفعيل الإعلانات</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.adsense_auto_ads_enabled === 'true'}
                onChange={(e) => setSettings({...settings, adsense_auto_ads_enabled: e.target.checked ? 'true' : 'false'})}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>الإعلانات التلقائية (Auto Ads)</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Ad Slots */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold border-b pb-4 mb-6">مواضع الوحدات الإعلانية (اليدوية)</h2>
        <div className="space-y-4">
          {configs.map((config, index) => (
            <div key={config.slotName} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border">
              <div className="md:col-span-1">
                <p className="font-medium text-sm">{config.description}</p>
                <code className="text-[10px] text-gray-400">{config.slotName}</code>
              </div>
              <div className="md:col-span-2">
                <Input 
                  value={config.adSlot || ''}
                  onChange={(e) => {
                    const newConfigs = [...configs];
                    newConfigs[index].adSlot = e.target.value;
                    setConfigs(newConfigs);
                  }}
                  placeholder="رقم الوحدة (Ad Slot)"
                  className="text-sm"
                />
              </div>
              <div className="md:col-span-1 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.isEnabled}
                    onChange={(e) => {
                      const newConfigs = [...configs];
                      newConfigs[index].isEnabled = e.target.checked;
                      setConfigs(newConfigs);
                    }}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm">نشط</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          size="lg" 
          onClick={handleSave} 
          disabled={updating}
          className="min-w-[150px]"
        >
          {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
}
