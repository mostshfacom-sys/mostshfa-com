'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MASTER_BANNER_KEY = '_master_';
const BANNER_PAGES = [
  { prefix: 'hospitals', pageKey: 'hospitals-pro' },
  { prefix: 'clinics', pageKey: 'clinics' },
  { prefix: 'labs', pageKey: 'labs' },
  { prefix: 'pharmacies', pageKey: 'pharmacies' },
  { prefix: 'doctors', pageKey: 'doctors' },
  { prefix: 'drugs', pageKey: 'drugs' },
  { prefix: 'emergency', pageKey: 'emergency' },
  { prefix: 'nursing', pageKey: 'nursing' },
  { prefix: 'home', pageKey: 'home' },
  { prefix: 'tools', pageKey: 'tools' },
  { prefix: 'medicalInfo', pageKey: 'medical-info' },
  { prefix: 'medicalVideos', pageKey: 'medical-videos' },
  { prefix: 'directories', pageKey: 'directories' },
  { prefix: 'search', pageKey: 'search' },
  { prefix: 'about', pageKey: 'about' },
  { prefix: 'contact', pageKey: 'contact' },
  { prefix: 'privacy', pageKey: 'privacy' },
  { prefix: 'terms', pageKey: 'terms' },
  { prefix: 'articlesCategories', pageKey: 'articles-categories' },
  { prefix: 'articles', pageKey: 'articles' },
  { prefix: 'beautyHealth', pageKey: 'beauty-health' },
  { prefix: 'mentalHealth', pageKey: 'mental-health' },
  { prefix: 'sexualHealth', pageKey: 'sexual-health' },
  { prefix: 'fitnessHealth', pageKey: 'fitness-health' },
  { prefix: 'firstAid', pageKey: 'first-aid' },
];

export interface ImageSettings {
  hospitalDefaultImage?: string;
  hospitalsBannerImage?: string;
  hospitalsBannerEnabled?: boolean;
  hospitalsBannerOverlayColor?: string;
  hospitalsBannerOverlayOpacity?: number;
  hospitalsBannerTitle?: string;
  hospitalsBannerSubtitle?: string;
  clinicsBannerImage?: string;
  clinicsBannerEnabled?: boolean;
  clinicsBannerOverlayColor?: string;
  clinicsBannerOverlayOpacity?: number;
  clinicsBannerTitle?: string;
  clinicsBannerSubtitle?: string;
  labsBannerImage?: string;
  labsBannerEnabled?: boolean;
  labsBannerOverlayColor?: string;
  labsBannerOverlayOpacity?: number;
  labsBannerTitle?: string;
  labsBannerSubtitle?: string;
  pharmaciesBannerImage?: string;
  pharmaciesBannerEnabled?: boolean;
  pharmaciesBannerOverlayColor?: string;
  pharmaciesBannerOverlayOpacity?: number;
  pharmaciesBannerTitle?: string;
  pharmaciesBannerSubtitle?: string;
  doctorsBannerImage?: string;
  doctorsBannerEnabled?: boolean;
  doctorsBannerOverlayColor?: string;
  doctorsBannerOverlayOpacity?: number;
  doctorsBannerTitle?: string;
  doctorsBannerSubtitle?: string;
  drugsBannerImage?: string;
  drugsBannerEnabled?: boolean;
  drugsBannerOverlayColor?: string;
  drugsBannerOverlayOpacity?: number;
  drugsBannerTitle?: string;
  drugsBannerSubtitle?: string;
  emergencyBannerImage?: string;
  emergencyBannerEnabled?: boolean;
  emergencyBannerOverlayColor?: string;
  emergencyBannerOverlayOpacity?: number;
  emergencyBannerTitle?: string;
  emergencyBannerSubtitle?: string;
  nursingBannerImage?: string;
  nursingBannerEnabled?: boolean;
  nursingBannerOverlayColor?: string;
  nursingBannerOverlayOpacity?: number;
  nursingBannerTitle?: string;
  nursingBannerSubtitle?: string;
  homeBannerImage?: string;
  homeBannerEnabled?: boolean;
  homeBannerOverlayColor?: string;
  homeBannerOverlayOpacity?: number;
  homeBannerTitle?: string;
  homeBannerSubtitle?: string;
  toolsBannerImage?: string;
  toolsBannerEnabled?: boolean;
  toolsBannerOverlayColor?: string;
  toolsBannerOverlayOpacity?: number;
  toolsBannerTitle?: string;
  toolsBannerSubtitle?: string;
  medicalInfoBannerImage?: string;
  medicalInfoBannerEnabled?: boolean;
  medicalInfoBannerOverlayColor?: string;
  medicalInfoBannerOverlayOpacity?: number;
  medicalInfoBannerTitle?: string;
  medicalInfoBannerSubtitle?: string;
  medicalVideosBannerImage?: string;
  medicalVideosBannerEnabled?: boolean;
  medicalVideosBannerOverlayColor?: string;
  medicalVideosBannerOverlayOpacity?: number;
  medicalVideosBannerTitle?: string;
  medicalVideosBannerSubtitle?: string;
  directoriesBannerImage?: string;
  directoriesBannerEnabled?: boolean;
  directoriesBannerOverlayColor?: string;
  directoriesBannerOverlayOpacity?: number;
  directoriesBannerTitle?: string;
  directoriesBannerSubtitle?: string;
  searchBannerImage?: string;
  searchBannerEnabled?: boolean;
  searchBannerOverlayColor?: string;
  searchBannerOverlayOpacity?: number;
  searchBannerTitle?: string;
  searchBannerSubtitle?: string;
  aboutBannerImage?: string;
  aboutBannerEnabled?: boolean;
  aboutBannerOverlayColor?: string;
  aboutBannerOverlayOpacity?: number;
  aboutBannerTitle?: string;
  aboutBannerSubtitle?: string;
  contactBannerImage?: string;
  contactBannerEnabled?: boolean;
  contactBannerOverlayColor?: string;
  contactBannerOverlayOpacity?: number;
  contactBannerTitle?: string;
  contactBannerSubtitle?: string;
  privacyBannerImage?: string;
  privacyBannerEnabled?: boolean;
  privacyBannerOverlayColor?: string;
  privacyBannerOverlayOpacity?: number;
  privacyBannerTitle?: string;
  privacyBannerSubtitle?: string;
  termsBannerImage?: string;
  termsBannerEnabled?: boolean;
  termsBannerOverlayColor?: string;
  termsBannerOverlayOpacity?: number;
  termsBannerTitle?: string;
  termsBannerSubtitle?: string;
  articlesCategoriesBannerImage?: string;
  articlesCategoriesBannerEnabled?: boolean;
  articlesCategoriesBannerOverlayColor?: string;
  articlesCategoriesBannerOverlayOpacity?: number;
  articlesCategoriesBannerTitle?: string;
  articlesCategoriesBannerSubtitle?: string;
  articlesBannerImage?: string;
  articlesBannerEnabled?: boolean;
  articlesBannerOverlayColor?: string;
  articlesBannerOverlayOpacity?: number;
  articlesBannerTitle?: string;
  articlesBannerSubtitle?: string;
  beautyHealthBannerImage?: string;
  beautyHealthBannerEnabled?: boolean;
  beautyHealthBannerOverlayColor?: string;
  beautyHealthBannerOverlayOpacity?: number;
  beautyHealthBannerTitle?: string;
  beautyHealthBannerSubtitle?: string;
  mentalHealthBannerImage?: string;
  mentalHealthBannerEnabled?: boolean;
  mentalHealthBannerOverlayColor?: string;
  mentalHealthBannerOverlayOpacity?: number;
  mentalHealthBannerTitle?: string;
  mentalHealthBannerSubtitle?: string;
  sexualHealthBannerImage?: string;
  sexualHealthBannerEnabled?: boolean;
  sexualHealthBannerOverlayColor?: string;
  sexualHealthBannerOverlayOpacity?: number;
  sexualHealthBannerTitle?: string;
  sexualHealthBannerSubtitle?: string;
  fitnessHealthBannerImage?: string;
  fitnessHealthBannerEnabled?: boolean;
  fitnessHealthBannerOverlayColor?: string;
  fitnessHealthBannerOverlayOpacity?: number;
  fitnessHealthBannerTitle?: string;
  fitnessHealthBannerSubtitle?: string;
  firstAidBannerImage?: string;
  firstAidBannerEnabled?: boolean;
  firstAidBannerOverlayColor?: string;
  firstAidBannerOverlayOpacity?: number;
  firstAidBannerTitle?: string;
  firstAidBannerSubtitle?: string;
}

const DEFAULT_SETTINGS: ImageSettings = {
  hospitalDefaultImage: '/images/defaults/hospital-icon.svg',
  hospitalsBannerImage: '',
  hospitalsBannerEnabled: true,
  hospitalsBannerOverlayColor: '#0b1f3a',
  hospitalsBannerOverlayOpacity: 70,
  hospitalsBannerTitle: 'دليل المستشفيات',
  hospitalsBannerSubtitle: 'اكتشف وقارن بين أفضل المستشفيات في مصر',
  clinicsBannerImage: '',
  clinicsBannerEnabled: true,
  clinicsBannerOverlayColor: '#064e3b',
  clinicsBannerOverlayOpacity: 70,
  clinicsBannerTitle: 'دليل العيادات الطبية',
  clinicsBannerSubtitle: 'احجز أو استكشف أفضل العيادات المتخصصة بالقرب منك',
  labsBannerImage: '',
  labsBannerEnabled: true,
  labsBannerOverlayColor: '#312e81',
  labsBannerOverlayOpacity: 70,
  labsBannerTitle: 'دليل المعامل الطبية',
  labsBannerSubtitle: 'نتائج دقيقة وخدمات سحب منزلي من معامل موثوقة',
  pharmaciesBannerImage: '',
  pharmaciesBannerEnabled: true,
  pharmaciesBannerOverlayColor: '#7f1d1d',
  pharmaciesBannerOverlayOpacity: 70,
  pharmaciesBannerTitle: 'دليل الصيدليات',
  pharmaciesBannerSubtitle: 'صيدليات قريبة، توصيل سريع، وخدمة 24 ساعة',
  doctorsBannerImage: '',
  doctorsBannerEnabled: true,
  doctorsBannerOverlayColor: '#0e3a5f',
  doctorsBannerOverlayOpacity: 70,
  doctorsBannerTitle: 'دليل الأطباء',
  doctorsBannerSubtitle: 'اختر طبيبك حسب التخصص والتقييمات والخبرة',
  drugsBannerImage: '',
  drugsBannerEnabled: true,
  drugsBannerOverlayColor: '#0c4a6e',
  drugsBannerOverlayOpacity: 70,
  drugsBannerTitle: 'دليل الأدوية',
  drugsBannerSubtitle: 'معلومات موثوقة عن الأدوية والبدائل والجرعات',
  emergencyBannerImage: '',
  emergencyBannerEnabled: true,
  emergencyBannerOverlayColor: '#7c2d12',
  emergencyBannerOverlayOpacity: 70,
  emergencyBannerTitle: 'دليل الطوارئ الطبية',
  emergencyBannerSubtitle: 'استعد للطوارئ بأرقام مهمة وخدمات جاهزة',
  nursingBannerImage: '',
  nursingBannerEnabled: true,
  nursingBannerOverlayColor: '#065f46',
  nursingBannerOverlayOpacity: 70,
  nursingBannerTitle: 'دليل التمريض المنزلي',
  nursingBannerSubtitle: 'خدمات تمريضية احترافية تصل إلى منزلك',
  homeBannerImage: '',
  homeBannerEnabled: true,
  homeBannerOverlayColor: '#065f46',
  homeBannerOverlayOpacity: 62,
  homeBannerTitle: 'مستشفى دوت كوم',
  homeBannerSubtitle: 'الدليل الاول لجميع الخدمات الطبية في مصر والوطن العربي',
  toolsBannerImage: '',
  toolsBannerEnabled: true,
  toolsBannerOverlayColor: '#4c1d95',
  toolsBannerOverlayOpacity: 70,
  toolsBannerTitle: 'الأدوات الطبية الذكية',
  toolsBannerSubtitle: 'مجموعة أدوات صحية ذكية للحساب والمتابعة اليومية بأسلوب مبسط وآمن.',
  medicalInfoBannerImage: '',
  medicalInfoBannerEnabled: true,
  medicalInfoBannerOverlayColor: '#0f172a',
  medicalInfoBannerOverlayOpacity: 70,
  medicalInfoBannerTitle: 'المعلومات الطبية',
  medicalInfoBannerSubtitle: 'مكتبة معرفية عربية تجمع المقالات والإرشادات والأدلة الطبية في مكان واحد.',
  medicalVideosBannerImage: '',
  medicalVideosBannerEnabled: true,
  medicalVideosBannerOverlayColor: '#0f172a',
  medicalVideosBannerOverlayOpacity: 70,
  medicalVideosBannerTitle: 'الفيديوهات الطبية',
  medicalVideosBannerSubtitle: 'فيديوهات طبية قصيرة ومفيدة تساعدك على الفهم السريع والمتابعة اليومية.',
  directoriesBannerImage: '',
  directoriesBannerEnabled: true,
  directoriesBannerOverlayColor: '#0f172a',
  directoriesBannerOverlayOpacity: 70,
  directoriesBannerTitle: 'الأدلة الطبية',
  directoriesBannerSubtitle:
    'صفحة الأدلة الطبية الشاملة في مصر: دليل الطوارئ، المستشفيات، العيادات، الصيدليات، المعامل، التمريض المنزلي، والأدوية في مكان واحد.',
  searchBannerImage: '',
  searchBannerEnabled: true,
  searchBannerOverlayColor: '#0f172a',
  searchBannerOverlayOpacity: 70,
  searchBannerTitle: 'البحث',
  searchBannerSubtitle: 'ابحث في دليل الخدمات الطبية الشامل',
  aboutBannerImage: '',
  aboutBannerEnabled: true,
  aboutBannerOverlayColor: '#1e3a8a',
  aboutBannerOverlayOpacity: 70,
  aboutBannerTitle: 'من نحن',
  aboutBannerSubtitle:
    'تعرف على رؤية مستشفى.كوم وكيف نعيد تعريف تجربة البحث عن الخدمات والمقالات الطبية في مصر.',
  contactBannerImage: '',
  contactBannerEnabled: true,
  contactBannerOverlayColor: '#0f766e',
  contactBannerOverlayOpacity: 70,
  contactBannerTitle: 'اتصل بنا',
  contactBannerSubtitle:
    'تواصل مع فريق مستشفى.كوم للاستفسارات والشراكات والدعم الفني على مدار الساعة.',
  privacyBannerImage: '',
  privacyBannerEnabled: true,
  privacyBannerOverlayColor: '#334155',
  privacyBannerOverlayOpacity: 70,
  privacyBannerTitle: 'سياسة الخصوصية',
  privacyBannerSubtitle:
    'نلتزم بحماية بياناتك وشفافية كيفية استخدامها لضمان تجربة آمنة وموثوقة على مستشفى.كوم.',
  termsBannerImage: '',
  termsBannerEnabled: true,
  termsBannerOverlayColor: '#6b21a8',
  termsBannerOverlayOpacity: 70,
  termsBannerTitle: 'الشروط والأحكام',
  termsBannerSubtitle:
    'تساعد هذه الشروط على حماية حقوق المستخدمين وضمان تقديم خدمات طبية رقمية موثوقة.',
  articlesCategoriesBannerImage: '',
  articlesCategoriesBannerEnabled: true,
  articlesCategoriesBannerOverlayColor: '#9f1239',
  articlesCategoriesBannerOverlayOpacity: 70,
  articlesCategoriesBannerTitle: 'تصنيفات المقالات الطبية',
  articlesCategoriesBannerSubtitle:
    'استكشف مكتبة متنامية من المقالات الطبية المصنفة بعناية لتجد الإجابة الصحيحة بسرعة.',
  articlesBannerImage: '',
  articlesBannerEnabled: true,
  articlesBannerOverlayColor: '#9f1239',
  articlesBannerOverlayOpacity: 70,
  articlesBannerTitle: 'المقالات الطبية',
  articlesBannerSubtitle: 'مقالات موثوقة ونصائح طبية من متخصصين',
  beautyHealthBannerImage: '',
  beautyHealthBannerEnabled: true,
  beautyHealthBannerOverlayColor: '#0f172a',
  beautyHealthBannerOverlayOpacity: 70,
  beautyHealthBannerTitle: 'الصحة والجمال',
  beautyHealthBannerSubtitle: 'نصائح وإرشادات للعناية بالصحة والجمال الطبيعي.',
  mentalHealthBannerImage: '',
  mentalHealthBannerEnabled: true,
  mentalHealthBannerOverlayColor: '#0f172a',
  mentalHealthBannerOverlayOpacity: 70,
  mentalHealthBannerTitle: 'الصحة النفسية',
  mentalHealthBannerSubtitle: 'دليلك للتوازن النفسي والهدوء الداخلي وحياة أفضل.',
  sexualHealthBannerImage: '',
  sexualHealthBannerEnabled: true,
  sexualHealthBannerOverlayColor: '#0f172a',
  sexualHealthBannerOverlayOpacity: 70,
  sexualHealthBannerTitle: 'الصحة الجنسية',
  sexualHealthBannerSubtitle: 'معلومات طبية موثوقة وشاملة حول الصحة الجنسية والإنجابية.',
  fitnessHealthBannerImage: '',
  fitnessHealthBannerEnabled: true,
  fitnessHealthBannerOverlayColor: '#0f172a',
  fitnessHealthBannerOverlayOpacity: 70,
  fitnessHealthBannerTitle: 'اللياقة البدنية',
  fitnessHealthBannerSubtitle: 'خطوات عملية لتحسين لياقتك البدنية ونشاطك اليومي.',
  firstAidBannerImage: '',
  firstAidBannerEnabled: true,
  firstAidBannerOverlayColor: '#0f172a',
  firstAidBannerOverlayOpacity: 70,
  firstAidBannerTitle: 'الإسعافات الأولية',
  firstAidBannerSubtitle: 'دليل شامل للتعامل مع الحالات الطارئة وإنقاذ الأرواح.',
};

const ImageSettingsContext = createContext<ImageSettings>(DEFAULT_SETTINGS);

const SETTINGS_CACHE_KEY = 'image_settings_cache_v1';

export function ImageSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);

  const loadSettings = async () => {
    try {
      const bannerRequests = BANNER_PAGES.map((page) =>
        fetch(`/api/admin/banner?pageKey=${page.pageKey}`, { cache: 'no-store' })
      );
      const [imageRes, masterBannerRes, ...pageBannerRes] = await Promise.allSettled([
        fetch('/api/admin/image-settings', { cache: 'no-store' }),
        fetch(`/api/admin/banner?pageKey=${MASTER_BANNER_KEY}`, { cache: 'no-store' }),
        ...bannerRequests,
      ]);

      type BannerPayload = {
        title?: string | null;
        subtitle?: string | null;
        imageUrl?: string | null;
        isEnabled?: boolean | null;
        overlayColor?: string | null;
        overlayOpacity?: number | null;
      };

      const mergeBannerSettings = (
        current: ImageSettings,
        banner: BannerPayload | null,
        prefix: string
      ): ImageSettings => {
        if (!banner) {
          return current;
        }

        const next = { ...current } as ImageSettings & Record<string, unknown>;
        const baseKey = `${prefix}Banner`;
        const assignString = (suffix: string, value?: string | null) => {
          if (typeof value === 'string' && value.trim()) {
            next[`${baseKey}${suffix}`] = value.trim();
          }
        };
        const assignBool = (suffix: string, value?: boolean | null) => {
          if (typeof value === 'boolean') {
            next[`${baseKey}${suffix}`] = value;
          }
        };
        const assignNumber = (suffix: string, value?: number | null) => {
          if (Number.isFinite(value)) {
            next[`${baseKey}${suffix}`] = value as number;
          }
        };

        assignString('Image', banner.imageUrl);
        assignBool('Enabled', banner.isEnabled);
        assignString('OverlayColor', banner.overlayColor);
        assignNumber('OverlayOpacity', banner.overlayOpacity);
        assignString('Title', banner.title);
        assignString('Subtitle', banner.subtitle);
        return next;
      };

      const imageData =
        imageRes.status === 'fulfilled' && imageRes.value.ok ? await imageRes.value.json() : null;
      const masterBannerData =
        masterBannerRes.status === 'fulfilled' && masterBannerRes.value.ok
          ? await masterBannerRes.value.json()
          : null;
      const pageBannerData = await Promise.all(
        pageBannerRes.map((result) =>
          result.status === 'fulfilled' && result.value.ok ? result.value.json() : null
        )
      );

      setSettings((prev) => {
        let next = { ...prev };

        if (imageData?.settings) {
          next = { ...next, ...imageData.settings };
        }

        BANNER_PAGES.forEach((page, index) => {
          const banner = pageBannerData[index]?.banner ?? null;
          if (banner) {
            next = mergeBannerSettings(next, banner, page.prefix);
          }
        });

        // Apply master banner settings with priority
        if (masterBannerData?.banner) {
          const master = masterBannerData.banner;
          BANNER_PAGES.forEach((page) => {
            const baseKey = `${page.prefix}Banner`;
            
            // Only override Title and Subtitle if they are present and NOT empty
            if (master.title !== undefined && master.title !== null && master.title !== '') {
              (next as any)[`${baseKey}Title`] = master.title;
            }
            if (master.subtitle !== undefined && master.subtitle !== null && master.subtitle !== '') {
              (next as any)[`${baseKey}Subtitle`] = master.subtitle;
            }

            // For other settings, only override if explicitly set in master
            const assignIfPresent = (suffix: string, value: any) => {
              if (value !== undefined && value !== null && value !== '') {
                (next as any)[`${baseKey}${suffix}`] = value;
              }
            };

            // CRITICAL: For the image, we ONLY override if the master actually has an image.
            // If the master image is empty, it should NOT wipe out the page-specific image.
            assignIfPresent('Image', master.imageUrl);
            
            // For boolean/number/color, we also check for truthy values or specific types
            if (typeof master.isEnabled === 'boolean') {
              (next as any)[`${baseKey}Enabled`] = master.isEnabled;
            }
            if (master.overlayColor && master.overlayColor.trim()) {
              (next as any)[`${baseKey}OverlayColor`] = master.overlayColor.trim();
            }
            if (typeof master.overlayOpacity === 'number') {
              (next as any)[`${baseKey}OverlayOpacity`] = master.overlayOpacity;
            }
          });
        }

        try {
          const nextCache = JSON.stringify(next);
          localStorage.setItem(SETTINGS_CACHE_KEY, nextCache);
        } catch {
          // ignore cache failures
        }

        return next;
      });
    } catch {
      // Keep defaults on failure
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setSettings((prev) => ({ ...prev, ...(parsed as Partial<ImageSettings>) }));
        }
      }
    } catch {
      // ignore cache failures
    }

    loadSettings();

    const handleSettingsUpdated = () => {
      loadSettings();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_CACHE_KEY) {
        handleSettingsUpdated();
      }
    };

    window.addEventListener('image_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('image_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(() => settings, [settings]);

  return <ImageSettingsContext.Provider value={value}>{children}</ImageSettingsContext.Provider>;
}

export function useImageSettings() {
  return useContext(ImageSettingsContext);
}
