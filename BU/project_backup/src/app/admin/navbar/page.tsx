'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  NavbarConfig,
  NavbarItem,
  getDefaultNavbarConfig,
} from '@/lib/navigation/navbarConfig';

type Message = { type: 'success' | 'error'; text: string } | null;

type SectionKey = keyof NavbarConfig['sections'];

type ItemField = keyof NavbarItem;

type SectionField = keyof NavbarConfig['sections']['directories'];

type ArticleSection = NavbarConfig['sections']['articles'];

type ArticleField = keyof ArticleSection;

const inputClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const optionalValue = (value: string) => (value.trim() === '' ? undefined : value);

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createEmptyItem = (prefix: string): NavbarItem => ({
  id: createId(prefix),
  label: '',
  href: '',
});

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="border-b pb-3">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
  </div>
);

export default function NavbarAdminPage() {
  const [config, setConfig] = useState<NavbarConfig>(getDefaultNavbarConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/navbar-config');
      if (!res.ok) {
        throw new Error('Failed to load');
      }
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config as NavbarConfig);
      }
    } catch (error) {
      console.error('Error loading navbar config:', error);
      setConfig(getDefaultNavbarConfig());
      setMessage({
        type: 'error',
        text: 'تعذر تحميل إعدادات النافبار. تم استخدام القيم الافتراضية.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/navbar-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      const data = await res.json();
      if (data?.config) {
        setConfig(data.config as NavbarConfig);
      }
      setMessage({ type: 'success', text: 'تم حفظ إعدادات النافبار بنجاح.' });
    } catch (error) {
      console.error('Error saving navbar config:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ إعدادات النافبار.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('هل تريد استعادة الإعدادات الافتراضية للنافبار؟')) {
      return;
    }

    setResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/navbar-config', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to reset');
      }
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config as NavbarConfig);
      }
      setMessage({ type: 'success', text: 'تمت استعادة الإعدادات الافتراضية.' });
    } catch (error) {
      console.error('Error resetting navbar config:', error);
      setMessage({ type: 'error', text: 'تعذر استعادة الإعدادات الافتراضية.' });
    } finally {
      setResetting(false);
    }
  };

  const updatePrimaryLink = (index: number, field: ItemField, value: string | boolean | undefined) => {
    setConfig((prev) => ({
      ...prev,
      primaryLinks: prev.primaryLinks.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPrimaryLink = () => {
    setConfig((prev) => ({
      ...prev,
      primaryLinks: [...prev.primaryLinks, createEmptyItem('primary')],
    }));
  };

  const removePrimaryLink = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      primaryLinks: prev.primaryLinks.filter((_, idx) => idx !== index),
    }));
  };

  const updateSectionField = (
    sectionKey: SectionKey,
    field: SectionField,
    value: string | boolean | undefined
  ) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          [field]: value,
        },
      },
    }));
  };

  const updateArticleField = (field: ArticleField, value: string | boolean | number | undefined) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        articles: {
          ...prev.sections.articles,
          [field]: value,
        },
      },
    }));
  };

  const updateSectionItem = (
    sectionKey: SectionKey,
    index: number,
    field: ItemField,
    value: string | boolean | undefined
  ) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          items: prev.sections[sectionKey].items.map((item, idx) =>
            idx === index ? { ...item, [field]: value } : item
          ),
        },
      },
    }));
  };

  const addSectionItem = (sectionKey: SectionKey) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          items: [...prev.sections[sectionKey].items, createEmptyItem(sectionKey)],
        },
      },
    }));
  };

  const removeSectionItem = (sectionKey: SectionKey, index: number) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          items: prev.sections[sectionKey].items.filter((_, idx) => idx !== index),
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات النافبار</h1>
            <p className="text-gray-600 mt-1">تحكم كامل في محتوى وروابط القائمة الرئيسية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {resetting ? 'جارٍ الاستعادة...' : 'استعادة الافتراضي'}
            </button>
            <Link
              href="/admin"
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-white"
            >
              العودة للوحة التحكم
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <SectionHeader title="الهوية الرئيسية" description="العنوان والرابط الأساسي للموقع" />
            <div className="space-y-4">
              <label className="block text-sm text-gray-600">
                <span className="mb-2 block font-medium text-gray-700">اسم العلامة</span>
                <input
                  type="text"
                  dir="rtl"
                  value={config.brand.label}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      brand: { ...prev.brand, label: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-gray-600">
                <span className="mb-2 block font-medium text-gray-700">رابط العلامة</span>
                <input
                  type="text"
                  dir="ltr"
                  value={config.brand.href}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      brand: { ...prev.brand, href: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <SectionHeader title="عناصر التحكم" description="إظهار أو إخفاء عناصر النافبار الأساسية" />
            <div className="space-y-4">
              <Toggle
                label="إظهار البحث"
                checked={config.actions.showSearch}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    actions: { ...prev.actions, showSearch: !prev.actions.showSearch },
                  }))
                }
              />
              <Toggle
                label="إظهار تبديل الثيم"
                checked={config.actions.showThemeToggle}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    actions: { ...prev.actions, showThemeToggle: !prev.actions.showThemeToggle },
                  }))
                }
              />
              <Toggle
                label="إظهار رابط اتصل بنا"
                checked={config.actions.showContact}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    actions: { ...prev.actions, showContact: !prev.actions.showContact },
                  }))
                }
              />
              <Toggle
                label="إظهار تسجيل الدخول"
                checked={config.actions.showAuth}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    actions: { ...prev.actions, showAuth: !prev.actions.showAuth },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <SectionHeader title="الروابط الأساسية" description="روابط الصف الأول بجانب الشعار" />
          <div className="space-y-4">
            {config.primaryLinks.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">رابط {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removePrimaryLink(index)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    حذف
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">المعرف</span>
                    <input
                      type="text"
                      dir="ltr"
                      value={item.id}
                      onChange={(e) => updatePrimaryLink(index, 'id', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">العنوان</span>
                    <input
                      type="text"
                      dir="rtl"
                      value={item.label}
                      onChange={(e) => updatePrimaryLink(index, 'label', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">الرابط</span>
                    <input
                      type="text"
                      dir="ltr"
                      value={item.href}
                      onChange={(e) => updatePrimaryLink(index, 'href', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">الأيقونة</span>
                    <input
                      type="text"
                      dir="ltr"
                      value={item.icon ?? ''}
                      onChange={(e) =>
                        updatePrimaryLink(index, 'icon', optionalValue(e.target.value))
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">وصف مختصر</span>
                    <textarea
                      dir="rtl"
                      rows={2}
                      value={item.description ?? ''}
                      onChange={(e) =>
                        updatePrimaryLink(index, 'description', optionalValue(e.target.value))
                      }
                      className={`${inputClass} resize-none`}
                    />
                  </label>
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">شارة</span>
                    <input
                      type="text"
                      dir="rtl"
                      value={item.badge ?? ''}
                      onChange={(e) =>
                        updatePrimaryLink(index, 'badge', optionalValue(e.target.value))
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isFeatured)}
                      onChange={() =>
                        updatePrimaryLink(index, 'isFeatured', !item.isFeatured)
                      }
                      className="h-4 w-4 text-primary-500 border-gray-300 rounded"
                    />
                    عنصر مميز
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isExternal)}
                      onChange={() =>
                        updatePrimaryLink(index, 'isExternal', !item.isExternal)
                      }
                      className="h-4 w-4 text-primary-500 border-gray-300 rounded"
                    />
                    رابط خارجي
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPrimaryLink}
            className="px-4 py-2.5 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-400 hover:text-primary-600"
          >
            + إضافة رابط رئيسي
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <SectionHeader title="بيانات التواصل" description="الرابط المخصص لصفحة اتصل بنا" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">المعرف</span>
              <input
                type="text"
                dir="ltr"
                value={config.contactLink.id}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contactLink: { ...prev.contactLink, id: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">العنوان</span>
              <input
                type="text"
                dir="rtl"
                value={config.contactLink.label}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contactLink: { ...prev.contactLink, label: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">الرابط</span>
              <input
                type="text"
                dir="ltr"
                value={config.contactLink.href}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contactLink: { ...prev.contactLink, href: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-gray-600">
              <span className="mb-2 block font-medium text-gray-700">الأيقونة</span>
              <input
                type="text"
                dir="ltr"
                value={config.contactLink.icon ?? ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contactLink: {
                      ...prev.contactLink,
                      icon: optionalValue(e.target.value),
                    },
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>

        {([
          {
            key: 'directories' as SectionKey,
            title: 'قسم الأدلة الطبية',
            description: 'روابط الأدلة الطبية الأساسية',
          },
          {
            key: 'tools' as SectionKey,
            title: 'قسم الأدوات الطبية',
            description: 'روابط الأدوات الذكية والصفحات المتقدمة',
          },
          {
            key: 'articles' as SectionKey,
            title: 'قسم المقالات الطبية',
            description: 'إدارة أقسام المقالات أو الاعتماد على التصنيفات التلقائية',
          },
        ] as const).map((section) => {
          const sectionData = config.sections[section.key];
          const isArticles = section.key === 'articles';

          return (
            <div key={section.key} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
              <SectionHeader title={section.title} description={section.description} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm text-gray-600">
                  <span className="mb-2 block font-medium text-gray-700">المعرف</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={sectionData.id}
                    onChange={(e) => updateSectionField(section.key, 'id', e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-gray-600">
                  <span className="mb-2 block font-medium text-gray-700">العنوان</span>
                  <input
                    type="text"
                    dir="rtl"
                    value={sectionData.label}
                    onChange={(e) => updateSectionField(section.key, 'label', e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm text-gray-600">
                  <span className="mb-2 block font-medium text-gray-700">الوصف</span>
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={sectionData.description ?? ''}
                    onChange={(e) =>
                      updateSectionField(section.key, 'description', optionalValue(e.target.value))
                    }
                    className={`${inputClass} resize-none`}
                  />
                </label>
                <label className="block text-sm text-gray-600">
                  <span className="mb-2 block font-medium text-gray-700">الأيقونة</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={sectionData.icon ?? ''}
                    onChange={(e) =>
                      updateSectionField(section.key, 'icon', optionalValue(e.target.value))
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              <Toggle
                label="تفعيل القسم"
                checked={sectionData.isEnabled}
                onChange={() =>
                  updateSectionField(section.key, 'isEnabled', !sectionData.isEnabled)
                }
              />

              {isArticles && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Toggle
                    label="تفعيل التصنيفات التلقائية"
                    checked={Boolean((sectionData as ArticleSection).useAutoCategories)}
                    onChange={() =>
                      updateArticleField(
                        'useAutoCategories',
                        !(sectionData as ArticleSection).useAutoCategories
                      )
                    }
                  />
                  <label className="block text-sm text-gray-600">
                    <span className="mb-2 block font-medium text-gray-700">عدد التصنيفات</span>
                    <input
                      type="number"
                      min={0}
                      value={(sectionData as ArticleSection).autoCount ?? 0}
                      onChange={(e) =>
                        updateArticleField(
                          'autoCount',
                          Number.isFinite(Number(e.target.value))
                            ? Number(e.target.value)
                            : 0
                        )
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              <div className="space-y-4">
                {sectionData.items.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">
                        عنصر {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeSectionItem(section.key, index)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">المعرف</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={item.id}
                          onChange={(e) =>
                            updateSectionItem(section.key, index, 'id', e.target.value)
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">العنوان</span>
                        <input
                          type="text"
                          dir="rtl"
                          value={item.label}
                          onChange={(e) =>
                            updateSectionItem(section.key, index, 'label', e.target.value)
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">الرابط</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={item.href}
                          onChange={(e) =>
                            updateSectionItem(section.key, index, 'href', e.target.value)
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">الأيقونة</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={item.icon ?? ''}
                          onChange={(e) =>
                            updateSectionItem(
                              section.key,
                              index,
                              'icon',
                              optionalValue(e.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">الوصف</span>
                        <textarea
                          dir="rtl"
                          rows={2}
                          value={item.description ?? ''}
                          onChange={(e) =>
                            updateSectionItem(
                              section.key,
                              index,
                              'description',
                              optionalValue(e.target.value)
                            )
                          }
                          className={`${inputClass} resize-none`}
                        />
                      </label>
                      <label className="block text-sm text-gray-600">
                        <span className="mb-2 block font-medium text-gray-700">شارة</span>
                        <input
                          type="text"
                          dir="rtl"
                          value={item.badge ?? ''}
                          onChange={(e) =>
                            updateSectionItem(
                              section.key,
                              index,
                              'badge',
                              optionalValue(e.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isFeatured)}
                          onChange={() =>
                            updateSectionItem(
                              section.key,
                              index,
                              'isFeatured',
                              !item.isFeatured
                            )
                          }
                          className="h-4 w-4 text-primary-500 border-gray-300 rounded"
                        />
                        عنصر مميز
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isExternal)}
                          onChange={() =>
                            updateSectionItem(
                              section.key,
                              index,
                              'isExternal',
                              !item.isExternal
                            )
                          }
                          className="h-4 w-4 text-primary-500 border-gray-300 rounded"
                        />
                        رابط خارجي
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addSectionItem(section.key)}
                className="px-4 py-2.5 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-400 hover:text-primary-600"
              >
                + إضافة عنصر جديد
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
