'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BasicOption {
  id: number;
  nameAr: string;
  nameEn?: string | null;
}

interface CityOption {
  id: number;
  nameAr: string;
  nameEn?: string | null;
}

interface WorkingHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const DAYS = [
  { key: 'Saturday', label: 'السبت' },
  { key: 'Sunday', label: 'الأحد' },
  { key: 'Monday', label: 'الاثنين' },
  { key: 'Tuesday', label: 'الثلاثاء' },
  { key: 'Wednesday', label: 'الأربعاء' },
  { key: 'Thursday', label: 'الخميس' },
  { key: 'Friday', label: 'الجمعة' },
];

interface HospitalFormProps {
  mode: 'create' | 'edit';
  hospitalId?: string;
}

interface HospitalFormState {
  nameAr: string;
  nameEn: string;
  slug: string;
  typeId: string;
  governorateId: string;
  cityId: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  facebook: string;
  logo: string;
  description: string;
  hasEmergency: boolean;
  isFeatured: boolean;
  lat: string;
  lng: string;
  services: string;
  specialtyIds: number[];
  workingHours: WorkingHour[];
}

const EMPTY_FORM: HospitalFormState = {
  nameAr: '',
  nameEn: '',
  slug: '',
  typeId: '',
  governorateId: '',
  cityId: '',
  address: '',
  phone: '',
  whatsapp: '',
  website: '',
  facebook: '',
  logo: '',
  description: '',
  hasEmergency: false,
  isFeatured: false,
  lat: '',
  lng: '',
  services: '',
  specialtyIds: [],
  workingHours: DAYS.map(d => ({
    day: d.key,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: false
  })),
};

const parseServices = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function HospitalForm({ mode, hospitalId }: HospitalFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<HospitalFormState>(EMPTY_FORM);
  const [hospitalTypes, setHospitalTypes] = useState<BasicOption[]>([]);
  const [governorates, setGovernorates] = useState<BasicOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [specialties, setSpecialties] = useState<BasicOption[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadCities = async (governorateId: string) => {
    if (!governorateId) {
      setCities([]);
      return;
    }

    try {
      const response = await fetch(`/api/hospitals-pro/cities?governorateId=${governorateId}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [typesRes, governoratesRes, specialtiesRes] = await Promise.all([
          fetch('/api/hospital-types'),
          fetch('/api/governorates'),
          fetch('/api/specialties'),
        ]);

        if (typesRes.ok) {
          const data = await typesRes.json();
          setHospitalTypes(data.data || []);
        }

        if (governoratesRes.ok) {
          const data = await governoratesRes.json();
          setGovernorates(data.data || []);
        }

        if (specialtiesRes.ok) {
          const data = await specialtiesRes.json();
          setSpecialties(data.data || []);
        }

        if (mode === 'edit' && hospitalId) {
          const hospitalRes = await fetch(`/api/admin/hospitals/${hospitalId}`);
          if (hospitalRes.ok) {
            const data = await hospitalRes.json();
            const hospital = data?.hospital;
            if (hospital) {
              setForm({
                nameAr: hospital.nameAr || '',
                nameEn: hospital.nameEn || '',
                slug: hospital.slug || '',
                typeId: hospital.typeId ? String(hospital.typeId) : '',
                governorateId: hospital.governorateId ? String(hospital.governorateId) : '',
                cityId: hospital.cityId ? String(hospital.cityId) : '',
                address: hospital.address || '',
                phone: hospital.phone || '',
                whatsapp: hospital.whatsapp || '',
                website: hospital.website || '',
                facebook: hospital.facebook || '',
                logo: hospital.logo || '',
                description: hospital.description || '',
                hasEmergency: !!hospital.hasEmergency,
                isFeatured: !!hospital.isFeatured,
                lat: hospital.lat ? String(hospital.lat) : '',
                lng: hospital.lng ? String(hospital.lng) : '',
                services: Array.isArray(hospital.services) ? hospital.services.join('\n') : '',
                specialtyIds: hospital.specialtyIds || [],
                workingHours: (hospital.workingHoursList && hospital.workingHoursList.length > 0)
                  ? hospital.workingHoursList.map((h: any) => ({
                      day: h.day,
                      openTime: h.openTime || '09:00',
                      closeTime: h.closeTime || '17:00',
                      isClosed: !!h.isClosed
                    }))
                  : DAYS.map(d => ({
                      day: d.key,
                      openTime: '09:00',
                      closeTime: '17:00',
                      isClosed: false
                    })),
              });
              setLogoPreview(hospital.logo || null);
              if (hospital.governorateId) {
                await loadCities(String(hospital.governorateId));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [mode, hospitalId]);

  const handleInputChange = (field: keyof HospitalFormState, value: string | boolean | number[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGovernorateChange = async (value: string) => {
    setForm((prev) => ({ ...prev, governorateId: value, cityId: '' }));
    await loadCities(value);
  };

  const toggleSpecialty = (id: number) => {
    setForm((prev) => {
      const exists = prev.specialtyIds.includes(id);
      return {
        ...prev,
        specialtyIds: exists
          ? prev.specialtyIds.filter((item) => item !== id)
          : [...prev.specialtyIds, id],
      };
    });
  };

  const handleWorkingHourChange = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setForm((prev) => {
      const newHours = [...prev.workingHours];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore dynamic field update
      newHours[index] = { ...newHours[index], [field]: value };
      return { ...prev, workingHours: newHours };
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hospitals');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, logo: data.url }));
        setMessage({ type: 'success', text: 'تم رفع شعار المستشفى بنجاح!' });
      } else {
        const localPath = `/images/hospitals/${file.name}`;
        setForm((prev) => ({ ...prev, logo: localPath }));
        setMessage({ type: 'success', text: 'تم تحديد الصورة (سيتم استخدام المسار المحلي)' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      const localPath = `/images/hospitals/${file.name}`;
      setForm((prev) => ({ ...prev, logo: localPath }));
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo: '' }));
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!form.nameAr.trim()) {
      setMessage({ type: 'error', text: 'اسم المستشفى بالعربية مطلوب' });
      return;
    }

    setSaving(true);

    const payload: Record<string, unknown> = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      website: form.website.trim(),
      facebook: form.facebook.trim(),
      logo: form.logo.trim(),
      description: form.description.trim(),
      hasEmergency: form.hasEmergency,
      isFeatured: form.isFeatured,
      services: parseServices(form.services),
      specialtyIds: form.specialtyIds,
      typeId: form.typeId ? Number(form.typeId) : null,
      governorateId: form.governorateId ? Number(form.governorateId) : null,
      cityId: form.cityId ? Number(form.cityId) : null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      workingHours: form.workingHours,
    };

    if (form.slug.trim()) {
      payload.slug = form.slug.trim();
    }

    try {
      const endpoint = mode === 'create'
        ? '/api/admin/hospitals'
        : `/api/admin/hospitals/${hospitalId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'حدث خطأ أثناء الحفظ');
      }

      setMessage({ type: 'success', text: 'تم حفظ بيانات المستشفى بنجاح!' });

      if (mode === 'create') {
        router.push('/admin/hospitals');
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = mode === 'create' ? 'إضافة مستشفى جديد' : 'تعديل بيانات المستشفى';
  const pageSubtitle = mode === 'create'
    ? 'أضف البيانات الأساسية للمستشفى والشعار'
    : 'قم بتحديث بيانات المستشفى والشعار والخدمات';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">{pageSubtitle}</p>
        </div>
        <Link
          href="/admin/hospitals"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة لقائمة المستشفيات
        </Link>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">البيانات الأساسية</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">اسم المستشفى (عربي)</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => handleInputChange('nameAr', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">اسم المستشفى (إنجليزي)</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => handleInputChange('nameEn', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Slug (اختياري)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
                placeholder="hospital-name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">نوع المستشفى</label>
              <select
                value={form.typeId}
                onChange={(e) => handleInputChange('typeId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">اختر النوع</option>
                {hospitalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">الموقع وبيانات التواصل</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">المحافظة</label>
              <select
                value={form.governorateId}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">اختر المحافظة</option>
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">المدينة</label>
              <select
                value={form.cityId}
                onChange={(e) => handleInputChange('cityId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">اختر المدينة</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">العنوان</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">رقم الهاتف</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">واتساب</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">الموقع الإلكتروني</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">فيسبوك</label>
              <input
                type="url"
                value={form.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">الشعار والوصف</h2>

            <div>
              <label className="block text-gray-700 font-medium mb-2">شعار المستشفى</label>
              <div className="space-y-3">
                {logoPreview ? (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-gray-100 border">
                    <Image
                      src={logoPreview}
                      alt="Logo Preview"
                      fill
                      className="object-cover"
                      unoptimized={logoPreview.endsWith('.svg')}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-500">اضغط لرفع شعار</span>
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <input
                  type="url"
                  value={form.logo}
                  onChange={(e) => {
                    handleInputChange('logo', e.target.value);
                    setLogoPreview(e.target.value || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                  placeholder="https://example.com/logo.png"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">وصف المستشفى</label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={5}
                dir="rtl"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">خصائص إضافية</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.hasEmergency}
                  onChange={(e) => handleInputChange('hasEmergency', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">يوفر خدمة طوارئ</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">مستشفى مميز</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">خط العرض (Latitude)</label>
                <input
                  type="number"
                  value={form.lat}
                  onChange={(e) => handleInputChange('lat', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  step="0.000001"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">خط الطول (Longitude)</label>
                <input
                  type="number"
                  value={form.lng}
                  onChange={(e) => handleInputChange('lng', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  step="0.000001"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">الخدمات</label>
              <textarea
                value={form.services}
                onChange={(e) => handleInputChange('services', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={6}
                placeholder="أضف كل خدمة في سطر منفصل"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">ساعات العمل</h2>
            <div className="space-y-4">
              {form.workingHours.map((wh, index) => (
                <div key={wh.day} className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-24 font-medium text-gray-700">
                    {DAYS.find(d => d.key === wh.day)?.label || wh.day}
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={wh.isClosed}
                      onChange={(e) => handleWorkingHourChange(index, 'isClosed', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">مغلق</span>
                  </label>

                  <div className={`flex items-center gap-4 flex-1 ${wh.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-8">من:</span>
                      <input
                        type="text"
                        value={wh.openTime}
                        onChange={(e) => handleWorkingHourChange(index, 'openTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="09:00 ص"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-8">إلى:</span>
                      <input
                        type="text"
                        value={wh.closeTime}
                        onChange={(e) => handleWorkingHourChange(index, 'closeTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="05:00 م"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">التخصصات</h2>
          {specialties.length === 0 ? (
            <p className="text-gray-500">لا توجد تخصصات متاحة حالياً.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {specialties.map((specialty) => (
                <label
                  key={specialty.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    form.specialtyIds.includes(specialty.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.specialtyIds.includes(specialty.id)}
                    onChange={() => toggleSpecialty(specialty.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 text-sm">{specialty.nameAr}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/hospitals"
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
          </button>
        </div>
      </form>
    </div>
  );
}
