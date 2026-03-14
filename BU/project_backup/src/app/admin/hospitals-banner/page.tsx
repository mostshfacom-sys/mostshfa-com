'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BannerData {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isEnabled: boolean | null;
  overlayColor?: string;
  overlayOpacity?: number | null;
}

const PAGE_BANNER_KEY = 'hospitals-pro';
const MASTER_BANNER_KEY = '_master_';
const DEFAULT_HOSPITAL_IMAGE = '/images/defaults/hospital-icon.svg';

export default function HospitalsBannerAdmin() {
  const [banner, setBanner] = useState<BannerData>({
    title: 'المستشفيات',
    subtitle: 'اعثر على أفضل المستشفيات والخدمات الصحية في منطقتك',
    imageUrl: '',
    linkUrl: '',
    isEnabled: true,
    overlayColor: '#0f172a',
    overlayOpacity: 70,
  });
  const [masterBanner, setMasterBanner] = useState<BannerData | null>(null);
  const [defaultImage, setDefaultImage] = useState<string>(DEFAULT_HOSPITAL_IMAGE);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewDefaultImage, setPreviewDefaultImage] = useState<string | null>(DEFAULT_HOSPITAL_IMAGE);
  const [loading, setLoading] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const defaultImageInputRef = useRef<HTMLInputElement>(null);

  const normalizeBanner = (source: any): BannerData => ({
    title: source?.title ?? '',
    subtitle: source?.subtitle ?? '',
    imageUrl: source?.imageUrl ?? '',
    linkUrl: source?.linkUrl ?? '',
    isEnabled: typeof source?.isEnabled === 'boolean' ? source.isEnabled : null,
    overlayColor: source?.overlayColor ?? '',
    overlayOpacity: Number.isFinite(source?.overlayOpacity)
      ? Number(source.overlayOpacity)
      : null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bannerRes, masterBannerRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/banner?pageKey=${PAGE_BANNER_KEY}`),
          fetch(`/api/admin/banner?pageKey=${MASTER_BANNER_KEY}`),
          fetch('/api/admin/image-settings'),
        ]);

        if (bannerRes.ok) {
          const data = await bannerRes.json();
          if (data?.banner) {
            const normalized = normalizeBanner(data.banner);
            setBanner(normalized);
            if (normalized.imageUrl) {
              setPreviewImage(normalized.imageUrl);
            }
          }
        }

        if (masterBannerRes.ok) {
          const data = await masterBannerRes.json();
          if (data?.banner) {
            setMasterBanner(normalizeBanner(data.banner));
          } else {
            setMasterBanner(null);
          }
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const hospitalImage = data?.settings?.hospitalDefaultImage || DEFAULT_HOSPITAL_IMAGE;
          setDefaultImage(hospitalImage);
          setPreviewDefaultImage(hospitalImage);
        }
      } catch (error) {
        console.error('Error loading hospitals banner settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageKey: PAGE_BANNER_KEY,
          ...banner,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حفظ بانر المستشفيات بنجاح!' });
      } else {
        throw new Error('Failed to save banner');
      }
    } catch (error) {
      console.error('Error saving hospitals banner:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البانر' });
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveDefaultImage = async () => {
    setSavingDefaults(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/image-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalDefaultImage: defaultImage || DEFAULT_HOSPITAL_IMAGE,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حفظ الصورة الافتراضية بنجاح!' });
      } else {
        throw new Error('Failed to save image settings');
      }
    } catch (error) {
      console.error('Error saving image settings:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الصورة الافتراضية' });
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    const baseName = 'hospitals';
    const rawExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
    const normalizedExt = rawExt ? rawExt.toLowerCase() : '';
    const fallbackFileName = `${baseName}${normalizedExt}`;
    formData.append('file', file);
    formData.append('folder', 'images/banners');
    formData.append('fileName', baseName);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setBanner(prev => ({ ...prev, imageUrl: data.url }));
        setMessage({ type: 'success', text: 'تم رفع صورة البانر بنجاح!' });
      } else {
        const localPath = `/images/banners/${fallbackFileName}`;
        setBanner(prev => ({ ...prev, imageUrl: localPath }));
        setMessage({ type: 'success', text: 'تم تحديد الصورة (سيتم استخدام المسار المحلي)' });
      }
    } catch (error) {
      console.error('Error uploading banner image:', error);
      const localPath = `/images/banners/${fallbackFileName}`;
      setBanner(prev => ({ ...prev, imageUrl: localPath }));
    }
  };

  const handleDefaultImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewDefaultImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'defaults');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDefaultImage(data.url);
        setMessage({ type: 'success', text: 'تم رفع الصورة الافتراضية بنجاح!' });
      } else {
        const localPath = `/images/defaults/${file.name}`;
        setDefaultImage(localPath);
        setMessage({ type: 'success', text: 'تم تحديد الصورة (سيتم استخدام المسار المحلي)' });
      }
    } catch (error) {
      console.error('Error uploading default image:', error);
      const localPath = `/images/defaults/${file.name}`;
      setDefaultImage(localPath);
    }
  };

  const handleRemoveBannerImage = () => {
    setBanner(prev => ({ ...prev, imageUrl: '' }));
    setPreviewImage(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleRemoveDefaultImage = () => {
    setDefaultImage(DEFAULT_HOSPITAL_IMAGE);
    setPreviewDefaultImage(DEFAULT_HOSPITAL_IMAGE);
    if (defaultImageInputRef.current) {
      defaultImageInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const previewOverlayColor = banner.overlayColor?.trim() || '#0f172a';
  const previewOverlayOpacity =
    typeof banner.overlayOpacity === 'number' ? banner.overlayOpacity : 70;
  const masterEnabledLabel =
    masterBanner?.isEnabled === null
      ? 'حسب الصفحة'
      : masterBanner?.isEnabled
        ? 'مفعل'
        : 'معطل';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات بانر المستشفيات</h1>
            <p className="text-gray-600 mt-1">إدارة بانر صفحة المستشفيات والصورة الافتراضية</p>
          </div>
          <Link
            href="/admin"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة للوحة التحكم
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {masterBanner && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-900">إعدادات الماستر لها أولوية</h2>
                <p className="text-sm text-amber-800">
                  أي قيمة في الماستر ستتجاوز إعدادات هذه الصفحة حتى يتم تفريغها.
                </p>
              </div>
              <Link
                href="/admin/master-banner"
                className="text-sm font-semibold text-amber-900 hover:underline"
              >
                إدارة إعدادات الماستر
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-amber-900 sm:grid-cols-2">
              <div>العنوان: {masterBanner.title || 'غير محدد'}</div>
              <div>التفعيل: {masterEnabledLabel}</div>
              <div>اللون: {masterBanner.overlayColor || 'حسب الصفحة'}</div>
              <div>
                التعتيم:{' '}
                {typeof masterBanner.overlayOpacity === 'number'
                  ? `${masterBanner.overlayOpacity}%`
                  : 'حسب الصفحة'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">إعدادات البانر</h2>

              <div>
                <label className="block text-gray-700 font-medium mb-2">تفعيل البانر المخصص</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: null, label: 'اتباع الماستر' },
                    { value: true, label: 'مفعل' },
                    { value: false, label: 'معطل' },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setBanner(prev => ({ ...prev, isEnabled: option.value }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        banner.isEnabled === option.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  عند اختيار "اتباع الماستر" سيتم تطبيق حالة التفعيل من إعدادات الماستر.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">العنوان الرئيسي</label>
                <input
                  type="text"
                  value={banner.title}
                  onChange={(e) => setBanner(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="المستشفيات"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">النص الفرعي</label>
                <textarea
                  value={banner.subtitle}
                  onChange={(e) => setBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="ابحث عن أفضل المستشفيات والخدمات الصحية"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">صورة البانر</label>
                <div className="space-y-3">
                  {previewImage ? (
                    <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={previewImage}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBannerImage}
                        className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="aspect-[3/1] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-500">اضغط لرفع صورة</span>
                      <span className="text-gray-400 text-sm mt-1">PNG, JPG حتى 5MB</span>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">أو أدخل رابط الصورة</span>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={banner.imageUrl}
                    onChange={(e) => {
                      setBanner(prev => ({ ...prev, imageUrl: e.target.value }));
                      setPreviewImage(e.target.value || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">رابط البانر (اختياري)</label>
                <input
                  type="url"
                  value={banner.linkUrl}
                  onChange={(e) => setBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                  placeholder="https://example.com/page"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">لون التعتيم</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={banner.overlayColor || '#0f172a'}
                      onChange={(e) => setBanner(prev => ({ ...prev, overlayColor: e.target.value }))}
                      className="h-12 w-14 rounded-lg border border-gray-200"
                      aria-label="لون التعتيم"
                    />
                    <input
                      type="text"
                      value={banner.overlayColor || '#0f172a'}
                      onChange={(e) => setBanner(prev => ({ ...prev, overlayColor: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                      placeholder="#0f172a"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">درجة التعتيم (%)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={banner.overlayOpacity ?? 70}
                      onChange={(e) => setBanner(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="min-w-[48px] text-sm font-semibold text-gray-700">
                      {banner.overlayOpacity ?? 70}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveBanner}
                disabled={savingBanner}
                className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingBanner ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    حفظ إعدادات البانر
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">الصورة الافتراضية للمستشفيات</h2>

              <div>
                <label className="block text-gray-700 font-medium mb-2">الصورة الافتراضية</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border">
                      <Image
                        src={previewDefaultImage || DEFAULT_HOSPITAL_IMAGE}
                        alt="Hospital default"
                        fill
                        className="object-cover"
                        unoptimized={(previewDefaultImage || '').endsWith('.svg')}
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => defaultImageInputRef.current?.click()}
                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <span>رفع صورة جديدة</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveDefaultImage}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        إعادة للصورة الافتراضية الأساسية
                      </button>
                    </div>
                  </div>

                  <input
                    ref={defaultImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDefaultImageUpload}
                    className="hidden"
                  />

                  <div>
                    <label className="block text-gray-600 text-sm mb-2">رابط الصورة (اختياري)</label>
                    <input
                      type="url"
                      value={defaultImage}
                      onChange={(e) => {
                        setDefaultImage(e.target.value);
                        setPreviewDefaultImage(e.target.value || DEFAULT_HOSPITAL_IMAGE);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                      placeholder="https://example.com/logo.png"
                      dir="ltr"
                    />
                    <p className="text-gray-500 text-sm mt-2">ستظهر هذه الصورة عندما لا يوجد شعار للمستشفى.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveDefaultImage}
                disabled={savingDefaults}
                className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingDefaults ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    حفظ الصورة الافتراضية
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">معاينة البانر</h2>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500 text-white overflow-hidden">
                {previewImage && (
                  <div className="absolute inset-0">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: previewOverlayColor,
                    opacity: previewOverlayOpacity / 100,
                  }}
                />

                <div className="relative p-8 md:p-12">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    {banner.title || 'المستشفيات'}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base max-w-md">
                    {banner.subtitle || 'اعثر على أفضل المستشفيات والخدمات الصحية في منطقتك'}
                  </p>
                </div>

                <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                  <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32.5C840 35 960 40 1080 42.5C1200 45 1320 45 1380 45L1440 45V60H0Z" fill="#F9FAFB" />
                </svg>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                نصائح
              </h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• استخدم صورة بعرض 1920px وارتفاع 600px للحصول على أفضل نتيجة</li>
                <li>• يفضل استخدام صور طبية أو واجهات مستشفيات</li>
                <li>• يمكن تعطيل البانر المخصص للعودة للوضع الافتراضي</li>
                <li>• الصورة الافتراضية ستظهر للبطاقات بدون شعار</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
