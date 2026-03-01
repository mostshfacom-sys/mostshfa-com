import Link from 'next/link';
import { Suspense } from 'react';
import prisma from '@/lib/db/prisma';
import { formatDuration, syncYoutubeVideosOnce } from '@/lib/youtube/youtubeSync';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import AutoScrollRow from '@/components/shared/AutoScrollRow';
import MedicalTipsTicker, { type MedicalTipTickerItem } from '@/components/home/MedicalTipsTicker';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  BoltIcon,
  BuildingOffice2Icon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  HeartIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';

export const dynamic = 'force-dynamic';

async function getHomeHeaderStats() {
  const [
    hospitalCount,
    clinicCount,
    labCount,
    pharmacyCount,
    emergencyHospitals,
    medicalTools,
    drugCount,
  ] = await Promise.all([
    prisma.hospital.count(),
    prisma.clinic.count({ where: { status: 'published' } }),
    prisma.lab.count({ where: { status: 'published' } }),
    prisma.pharmacy.count({ where: { status: 'published' } }),
    prisma.hospital.count({ where: { hasEmergency: true } }),
    prisma.medicalTool.count({ where: { isActive: true } }),
    prisma.drug.count(),
  ]);

  return {
    hospitalCount,
    clinicCount,
    labCount,
    pharmacyCount,
    emergencyHospitals,
    medicalTools,
    drugCount,
  };
}

const fallbackMedicalTips: MedicalTipTickerItem[] = [
  {
    id: 'fallback-1',
    title: 'خطة متابعة ضغط الدم',
    description: 'سجل قراءاتك أسبوعياً وتابع التغيّرات بشكل مبكر.',
    icon: null,
    category: { name: 'صحة القلب', icon: '❤️', color: null },
    fallbackIcon: 'heart',
  },
  {
    id: 'fallback-2',
    title: 'نمط نوم متوازن',
    description: '7-8 ساعات ثابتة تحسّن المناعة والطاقة اليومية.',
    icon: null,
    category: { name: 'النوم', icon: '⏰', color: null },
    fallbackIcon: 'clock',
  },
  {
    id: 'fallback-3',
    title: 'غذاء متوازن',
    description: 'وجبة غنية بالبروتين والخضار تقلل الإجهاد.',
    icon: null,
    category: { name: 'التغذية', icon: '🥗', color: null },
    fallbackIcon: 'beaker',
  },
  {
    id: 'fallback-4',
    title: 'حركة كل يوم',
    description: '30 دقيقة مشي يومياً ترفع لياقتك وتنشط القلب.',
    icon: null,
    category: { name: 'اللياقة', icon: '⚡', color: null },
    fallbackIcon: 'bolt',
  },
];

const buildTipTitle = (title: string | null | undefined, content: string) => {
  if (title && title.trim()) return title.trim();
  const cleaned = content.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean).slice(0, 5);
  return words.join(' ') || cleaned.slice(0, 40);
};

async function getHomeMedicalTips(): Promise<MedicalTipTickerItem[]> {
  try {
    const tips = await prisma.healthTip.findMany({
      where: { isActive: true },
      select: {
        id: true,
        titleAr: true,
        contentAr: true,
        icon: true,
        category: {
          select: {
            nameAr: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 14,
    });

    if (!tips.length) {
      return fallbackMedicalTips;
    }

    const fallbackIconNames: Array<NonNullable<MedicalTipTickerItem['fallbackIcon']>> = [
      'heart',
      'clock',
      'beaker',
      'bolt',
    ];

    return tips.map((tip, index) => ({
      id: tip.id,
      title: buildTipTitle(tip.titleAr, tip.contentAr),
      description: tip.contentAr,
      icon: tip.icon ?? null,
      category: tip.category
        ? {
            name: tip.category.nameAr,
            icon: tip.category.icon ?? null,
            color: tip.category.color ?? null,
          }
        : null,
      fallbackIcon: fallbackIconNames[index % fallbackIconNames.length],
    }));
  } catch (error) {
    console.error('Error loading home health tips:', error);
    return fallbackMedicalTips;
  }
}

async function getRandomArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        publishedAt: true,
        createdAt: true,
        category: {
          select: {
            nameAr: true,
            slug: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });

    return [...articles].sort(() => 0.5 - Math.random()).slice(0, 9);
  } catch (error) {
    console.error('Error loading home articles:', error);
    return [];
  }
}

type HomeVideoHighlight = {
  id: string;
  title: string;
  duration?: string;
  doctor?: string;
  href: string;
  thumbnail: string;
  tag: string;
};

const fallbackVideoHighlights: HomeVideoHighlight[] = [
  {
    id: 'video-1',
    title: 'تمارين تنفس تقلل التوتر خلال 5 دقائق',
    duration: '05:10',
    doctor: 'د. سارة حسان',
    href: 'https://www.youtube.com/watch?v=SEfs5TJZ6Nk',
    thumbnail: 'https://img.youtube.com/vi/SEfs5TJZ6Nk/hqdefault.jpg',
    tag: 'صحة نفسية',
  },
  {
    id: 'video-2',
    title: 'كيف تختار التحاليل المناسبة لحالتك؟',
    duration: '07:42',
    doctor: 'د. أحمد يوسف',
    href: 'https://www.youtube.com/watch?v=QZgB9fP0Rjc',
    thumbnail: 'https://img.youtube.com/vi/QZgB9fP0Rjc/hqdefault.jpg',
    tag: 'تحاليل',
  },
  {
    id: 'video-3',
    title: 'نصائح ذهبية لصحة القلب',
    duration: '06:25',
    doctor: 'د. ريم خالد',
    href: 'https://www.youtube.com/watch?v=1gbmFQdz4y0',
    thumbnail: 'https://img.youtube.com/vi/1gbmFQdz4y0/hqdefault.jpg',
    tag: 'القلب',
  },
  {
    id: 'video-4',
    title: 'خطوات بسيطة لرفع المناعة اليومية',
    duration: '04:55',
    doctor: 'د. مروان فؤاد',
    href: 'https://www.youtube.com/watch?v=3Nt3O3D0X3I',
    thumbnail: 'https://img.youtube.com/vi/3Nt3O3D0X3I/hqdefault.jpg',
    tag: 'المناعة',
  },
  {
    id: 'video-5',
    title: 'إرشادات التغذية الصحية للعائلة',
    duration: '08:12',
    doctor: 'د. حنان يوسف',
    href: 'https://www.youtube.com/watch?v=9s59a7q3MDA',
    thumbnail: 'https://img.youtube.com/vi/9s59a7q3MDA/hqdefault.jpg',
    tag: 'تغذية',
  },
  {
    id: 'video-6',
    title: 'دليل سريع لفحص دوري ذكي',
    duration: '06:05',
    doctor: 'د. ندى سالم',
    href: 'https://www.youtube.com/watch?v=vxwzQn1FZs4',
    thumbnail: 'https://img.youtube.com/vi/vxwzQn1FZs4/hqdefault.jpg',
    tag: 'فحوصات',
  },
];

async function getHomeVideoHighlights(): Promise<HomeVideoHighlight[]> {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return fallbackVideoHighlights;
    }

    await syncYoutubeVideosOnce(channelId);

    const videos = await prisma.youtubeVideo.findMany({
      where: { channelId },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });

    if (!videos.length) return fallbackVideoHighlights;

    return videos.map((video) => {
      const thumbnail =
        video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
      return {
        id: `youtube-${video.videoId}`,
        title: video.title,
        duration: formatDuration(video.durationSec),
        doctor: video.channelTitle ?? 'قناة يوتيوب',
        href: video.videoUrl,
        thumbnail,
        tag: 'فيديو طبي',
      };
    });
  } catch (error) {
    console.error('Error loading home videos:', error);
    return fallbackVideoHighlights;
  }
}

export default async function HomePage() {
  const [stats, randomArticles, medicalTips, videoHighlights] = await Promise.all([
    getHomeHeaderStats(),
    getRandomArticles(),
    getHomeMedicalTips(),
    getHomeVideoHighlights(),
  ]);
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'hospitals',
      label: 'مستشفيات',
      value: stats.hospitalCount || 0,
      icon: 'building',
      color: 'blue',
      description: 'مستشفى ومركز طبي',
    },
    {
      id: 'clinics',
      label: 'عيادات',
      value: stats.clinicCount || 0,
      icon: 'star',
      color: 'emerald',
      description: 'عيادة تخصصية',
    },
    {
      id: 'pharmacies',
      label: 'صيدليات',
      value: stats.pharmacyCount || 0,
      icon: 'heart',
      color: 'rose',
      description: 'صيدلية',
    },
    {
      id: 'drugs',
      label: 'أدوية',
      value: stats.drugCount || 0,
      icon: 'shield',
      color: 'amber',
      description: 'دواء ومستحضر',
      isHighlighted: true,
    },
  ];
  const quickSearches = [
    'مستشفى قريب',
    'عيادة أسنان',
    'معمل تحاليل',
    'صيدلية 24 ساعة',
    'طبيب قلب',
    'طبيب أطفال',
    'مركز أشعة',
    'تحاليل منزلية',
    'علاج طبيعي',
    'طوارئ قريبة',
    'عيادة جلدية',
    'تمريض منزلي',
  ];
  const totalResults =
    stats.hospitalCount + stats.clinicCount + stats.labCount + stats.pharmacyCount;
  const directoryHighlights = [
    {
      id: 'hospitals-pro',
      title: 'دليل المستشفيات',
      description: 'تقييمات شاملة وبحث ذكي داخل أكبر شبكة مستشفيات.',
      href: '/hospitals-pro',
      stat: `${stats.hospitalCount.toLocaleString('ar-EG')} مستشفى`,
      icon: BuildingOffice2Icon,
      tone: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      badge: 'الأكثر زيارة',
      badgeTone: 'bg-emerald-100 text-emerald-700',
      accent: 'text-emerald-600',
    },
    {
      id: 'clinics',
      title: 'العيادات المتخصصة',
      description: 'تخصصات دقيقة وأطباء موثوقون في جميع المحافظات.',
      href: '/clinics',
      stat: `${stats.clinicCount.toLocaleString('ar-EG')} عيادة`,
      icon: UserGroupIcon,
      tone: 'from-sky-500/15 via-sky-500/5 to-transparent',
      badge: 'خدمات دقيقة',
      badgeTone: 'bg-sky-100 text-sky-700',
      accent: 'text-sky-600',
    },
    {
      id: 'labs',
      title: 'معامل التحاليل',
      description: 'نتائج أسرع وخدمات سحب منزلي موثوقة.',
      href: '/labs',
      stat: `${stats.labCount.toLocaleString('ar-EG')} معمل`,
      icon: BeakerIcon,
      tone: 'from-purple-500/15 via-purple-500/5 to-transparent',
      badge: 'نتائج فورية',
      badgeTone: 'bg-purple-100 text-purple-700',
      accent: 'text-purple-600',
    },
    {
      id: 'pharmacies',
      title: 'الصيدليات والخدمات',
      description: 'صيدليات تعمل على مدار الساعة مع توصيل سريع.',
      href: '/pharmacies',
      stat: `${stats.pharmacyCount.toLocaleString('ar-EG')} صيدلية`,
      icon: ShieldCheckIcon,
      tone: 'from-rose-500/15 via-rose-500/5 to-transparent',
      badge: 'توصيل سريع',
      badgeTone: 'bg-rose-100 text-rose-700',
      accent: 'text-rose-600',
    },
    {
      id: 'emergency',
      title: 'دليل الطوارئ الطبية',
      description: 'أقسام الطوارئ والإرشادات العاجلة في دقائق.',
      href: '/emergency',
      stat: `${stats.emergencyHospitals.toLocaleString('ar-EG')} مستشفى طوارئ`,
      icon: HeartIcon,
      tone: 'from-red-500/15 via-orange-500/5 to-transparent',
      badge: 'عاجل',
      badgeTone: 'bg-red-100 text-red-700',
      accent: 'text-red-600',
    },
    {
      id: 'nursing',
      title: 'خدمات التمريض المنزلي',
      description: 'متابعة منزلية وفِرق تمريض معتمدة.',
      href: '/nursing',
      stat: 'رعاية منزلية موثوقة',
      icon: UserGroupIcon,
      tone: 'from-pink-500/15 via-fuchsia-500/5 to-transparent',
      badge: 'رعاية منزلية',
      badgeTone: 'bg-pink-100 text-pink-700',
      accent: 'text-pink-600',
    },
    {
      id: 'drugs',
      title: 'موسوعة الأدوية',
      description: 'معلومات دقيقة عن الأدوية والبدائل.',
      href: '/drugs',
      stat: `${stats.drugCount.toLocaleString('ar-EG')} دواء موثق`,
      icon: ClipboardDocumentListIcon,
      tone: 'from-amber-500/15 via-yellow-500/5 to-transparent',
      badge: 'محدث باستمرار',
      badgeTone: 'bg-amber-100 text-amber-700',
      accent: 'text-amber-600',
    },
    {
      id: 'tools',
      title: 'الأدوات الطبية الذكية',
      description: 'حاسبات صحية وتذكيرات يومية تساعدك.',
      href: '/tools',
      stat: `${stats.medicalTools.toLocaleString('ar-EG')} أداة نشطة`,
      icon: BoltIcon,
      tone: 'from-indigo-500/15 via-sky-500/5 to-transparent',
      badge: 'تجربة ذكية',
      badgeTone: 'bg-indigo-100 text-indigo-700',
      accent: 'text-indigo-600',
    },
  ];
  const featureHighlights = [
    {
      title: 'بحث عربي ذكي',
      description: 'نتائج دقيقة حتى مع اختلاف الكتابة أو اللهجات.',
      icon: SparklesIcon,
      tone: 'bg-emerald-50 text-emerald-600',
      href: '/search',
    },
    {
      title: 'خريطة الخدمات',
      description: 'عرض مباشر لأقرب المستشفيات والعيادات حولك.',
      icon: MapPinIcon,
      tone: 'bg-sky-50 text-sky-600',
      href: '/directories',
    },
    {
      title: 'محتوى موثوق',
      description: 'مقالات طبية مراجعة من متخصصين بشكل دائم.',
      icon: ChatBubbleBottomCenterTextIcon,
      tone: 'bg-amber-50 text-amber-600',
      href: '/articles',
    },
    {
      title: 'أدوات صحية ذكية',
      description: 'حاسبات ومتابعة يومية لصحتك في مكان واحد.',
      icon: BoltIcon,
      tone: 'bg-violet-50 text-violet-600',
      href: '/tools',
    },
    {
      title: 'متابعة سريعة',
      description: 'نتائج واضحة، فلاتر، وإشعارات دون تعقيد.',
      icon: ArrowTrendingUpIcon,
      tone: 'bg-rose-50 text-rose-600',
      href: '/directories',
    },
    {
      title: 'استجابة للطوارئ',
      description: 'وصول فوري لدليل الطوارئ والإرشادات العاجلة.',
      icon: HeartIcon,
      tone: 'bg-red-50 text-red-600',
      href: '/emergency',
    },
  ];
  const quickStats = [
    {
      label: 'مستشفيات',
      value: stats.hospitalCount,
      tone:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-300/30',
    },
    {
      label: 'عيادات',
      value: stats.clinicCount,
      tone:
        'bg-sky-50 text-sky-700 dark:bg-sky-400/20 dark:text-sky-100 dark:ring-1 dark:ring-sky-300/30',
    },
    {
      label: 'معامل',
      value: stats.labCount,
      tone:
        'bg-purple-50 text-purple-700 dark:bg-purple-400/20 dark:text-purple-100 dark:ring-1 dark:ring-purple-300/30',
    },
    {
      label: 'صيدليات',
      value: stats.pharmacyCount,
      tone:
        'bg-rose-50 text-rose-700 dark:bg-rose-400/20 dark:text-rose-100 dark:ring-1 dark:ring-rose-300/30',
    },
  ];
  const seoKeywords = [
    'مستشفى قريب',
    'أفضل مستشفى في القاهرة',
    'دليل المستشفيات في مصر',
    'حجز موعد مستشفى',
    'مستشفى طوارئ قريب',
    'عيادة أسنان معتمدة',
    'عيادة أطفال متخصصة',
    'عيادة جلدية بالقاهرة',
    'عيادة نساء وتوليد',
    'عيادة قلب',
    'عيادة باطنة',
    'طبيب عيون قريب',
    'دكتور عظام متخصص',
    'دكتور أطفال معتمد',
    'أطباء متخصصون في مصر',
    'استشارات طبية فورية',
    'خدمات الرعاية المنزلية',
    'خدمات تمريض منزلي',
    'ممرض منزلي موثوق',
    'خدمة تمريض 24 ساعة',
    'تحليل شامل قريب مني',
    'معمل تحاليل موثوق',
    'نتائج تحاليل فورية',
    'تحاليل منزلية',
    'تحاليل دم',
    'تحاليل سكر تراكمي',
    'تحاليل الكبد',
    'تحاليل الغدة الدرقية',
    'تحاليل الحمل',
    'تحاليل فيتامين د',
    'صيدلية 24 ساعة',
    'صيدلية قريبة',
    'توصيل دواء سريع',
    'صيدليات القاهرة',
    'صيدليات الاسكندرية',
    'صيدليات الجيزة',
    'أدوية موثقة',
    'موسوعة الأدوية',
    'بدائل الأدوية',
    'تفاعلات الأدوية',
    'جرعات الأدوية',
    'أدوية الأطفال',
    'أدوية الضغط',
    'أدوية السكر',
    'دليل الطوارئ الطبية',
    'أرقام الإسعاف',
    'مستشفيات بها طوارئ',
    'خدمات الإسعافات الأولية',
    'إرشادات الطوارئ',
    'مقالات طبية موثوقة',
    'مقالات صحة القلب',
    'مقالات التغذية',
    'مقالات الصحة النفسية',
    'مقالات صحة المرأة',
    'مقالات صحة الأطفال',
    'مقالات الأمراض المزمنة',
    'مقالات لياقة بدنية',
    'نصائح صحية يومية',
    'نصائح طبية للحوامل',
    'نصائح لفحص دوري',
    'نصائح لخفض الضغط',
    'نصائح للسكر',
    'نصائح للقلب',
    'نصائح للمناعة',
    'نصائح للتغذية الصحية',
    'متابعة ضغط الدم',
    'حساب مؤشر كتلة الجسم',
    'حاسبة السعرات الحرارية',
    'حاسبة الماء اليومية',
    'حاسبة الحمل',
    'حاسبة طول الطفل',
    'تذكير الدواء',
    'متابعة الوزن',
    'خطة رياضية صحية',
    'برامج تغذية',
    'أقرب مستشفى من موقعي',
    'أقرب عيادة من موقعي',
    'أقرب معمل من موقعي',
    'أقرب صيدلية من موقعي',
    'خريطة الخدمات الصحية',
    'خريطة المستشفيات',
    'خريطة العيادات',
    'خريطة المعامل',
    'خريطة الصيدليات',
    'حجز موعد طبي',
    'مواعيد الأطباء',
    'أفضل عيادات التخصصات',
    'أفضل مستشفيات الأطفال',
    'أفضل مستشفيات القلب',
    'أفضل مستشفيات النساء',
    'أفضل أطباء العظام',
    'أفضل دكتور أسنان',
    'مراكز أشعة',
    'أشعة رنين',
    'أشعة مقطعية',
    'تحاليل كورونا',
    'تحاليل حساسية',
    'طب الأسرة',
    'طب الأعصاب',
    'طب المخ والأعصاب',
    'جراحة عامة',
    'جراحة القلب',
    'جراحة العظام',
    'العناية المركزة',
    'مستشفيات حكومية',
    'مستشفيات خاصة',
    'مستشفيات جامعية',
    'تقييم المستشفيات',
    'تقييم الأطباء',
    'تقييم العيادات',
    'خدمات الرعاية الوقائية',
    'خدمات التجميل الطبي',
    'زراعة الأسنان',
    'عيادات الليزر',
    'تحاليل الخصوبة',
    'تحاليل ما قبل الزواج',
    'نصائح ما بعد العمليات',
    'استشارات تغذية',
    'استشارات نفسية',
    'جلسات علاج طبيعي',
    'مراكز علاج طبيعي',
    'حجز جلسة علاج طبيعي',
    'خدمات كبار السن',
    'رعاية كبار السن',
    'مراكز تأهيل',
    'خدمات المتابعة المنزلية',
    'فحص شامل',
    'فحص دوري',
    'فحص مبكر للأمراض',
    'متابعة الحمل',
    'حساب موعد الولادة',
    'متابعة السكر',
    'متابعة نبض القلب',
    'مستشفى أطفال قريب',
    'مستشفى نساء قريب',
    'دليل الخدمات الطبية',
    'دليل الأدوات الصحية',
    'خدمة استشارة فيديو',
    'تواصل مع طبيب',
    'معلومات طبية موثوقة',
    'محتوى صحي عربي',
  ];
  const fallbackArticles = [
    {
      id: 1,
      title: 'كيف تختار مقدم الخدمة الصحية الأنسب؟',
      slug: 'choose-healthcare-provider',
      excerpt: 'خطوات عملية تساعدك على اتخاذ قرار آمن وسريع عند البحث عن خدمة طبية.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'إرشادات عامة', slug: 'guides' },
    },
    {
      id: 2,
      title: 'دليلك لقراءة التحاليل الطبية الأساسية',
      slug: 'lab-results-guide',
      excerpt: 'تعرف على أهم المؤشرات والتحاليل التي تساعدك في متابعة صحتك.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'تحاليل', slug: 'labs' },
    },
    {
      id: 3,
      title: 'نصائح للحفاظ على القلب نشيطاً',
      slug: 'heart-activity-tips',
      excerpt: 'عادات يومية بسيطة تحمي قلبك وتعزز لياقتك.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'القلب', slug: 'heart' },
    },
    {
      id: 4,
      title: 'خطوات ذكية لاختيار الطبيب المناسب',
      slug: 'choose-doctor-smart',
      excerpt: 'أسئلة مهمة يجب أن تسألها قبل زيارة الطبيب المختص.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'استشارات', slug: 'consultations' },
    },
    {
      id: 5,
      title: 'أساسيات الوقاية المنزلية اليومية',
      slug: 'daily-prevention',
      excerpt: 'طرق بسيطة تحمي عائلتك وتزيد مناعة الجسم يومياً.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'الوقاية', slug: 'prevention' },
    },
    {
      id: 6,
      title: 'نظام غذائي مرن لصحة أفضل',
      slug: 'flexible-diet-plan',
      excerpt: 'اختيارات غذائية متوازنة تناسب نمط حياتك اليومي.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'التغذية', slug: 'nutrition' },
    },
    {
      id: 7,
      title: 'كيف تتعامل مع الإرهاق المزمن؟',
      slug: 'handle-chronic-fatigue',
      excerpt: 'نصائح عملية لتنظيم الطاقة والتغلب على الإجهاد.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'الصحة العامة', slug: 'general-health' },
    },
    {
      id: 8,
      title: 'دليل مبسط للتحاليل الدورية',
      slug: 'periodic-labs-guide',
      excerpt: 'تحاليل أساسية يوصى بها لمتابعة صحتك سنوياً.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'تحاليل', slug: 'labs' },
    },
    {
      id: 9,
      title: 'دليل سريع لصحة الأسرة',
      slug: 'family-health-guide',
      excerpt: 'إرشادات مختصرة لحماية صحة جميع أفراد الأسرة.',
      image: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      category: { nameAr: 'الأسرة', slug: 'family' },
    },
  ];
  const articlesToShow = (randomArticles.length > 0 ? randomArticles : fallbackArticles).slice(0, 9);
  const quickFilters = [
    {
      id: 'hospital-search',
      label: 'مستشفى قريب',
      icon: 'building' as const,
      href: `/search?q=${encodeURIComponent('مستشفى قريب')}`,
    },
    {
      id: 'clinic-search',
      label: 'عيادة أسنان',
      icon: 'group' as const,
      href: `/search?q=${encodeURIComponent('عيادة أسنان')}`,
    },
    {
      id: 'lab-search',
      label: 'معمل تحاليل',
      icon: 'check' as const,
      href: `/search?q=${encodeURIComponent('معمل تحاليل')}`,
    },
    {
      id: 'pharmacy-search',
      label: 'صيدلية 24 ساعة',
      icon: 'clock' as const,
      href: `/search?q=${encodeURIComponent('صيدلية 24 ساعة')}`,
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/40 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-300">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="home"
            title="مستشفى دوت كوم"
            subtitle="اكتشف أفضل المستشفيات والعيادات والمعامل والصيدليات بخطوات بسيطة وآمنة."
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={totalResults}
            showMapButton
            mapEntityTypes={['hospital', 'clinic', 'lab', 'pharmacy']}
            mapTitle="خريطة الخدمات الصحية"
            mapSubtitle="استعرض مواقع المستشفيات والعيادات والمعامل والصيدليات القريبة"
            searchPlaceholder="ابحث عن مستشفى، عيادة، طبيب، أو تخصص..."
            searchParamKey="q"
            searchAction="/search"
            resetPageOnSearch={false}
            showFilters={false}
            showViewToggle={false}
            gradientFrom="from-slate-900"
            gradientTo="to-emerald-600"
            className="mb-8"
            titleClassName="text-[2rem] sm:text-4xl lg:text-5xl whitespace-nowrap"
            contentClassName="pt-6 pb-6 sm:py-20 lg:py-24"
            breadcrumbClassName="mt-0 sm:-mt-16"
          />
        </Suspense>
        <section className="relative overflow-hidden py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
          <div className="container-custom relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-sky-50/60 p-6 shadow-sm backdrop-blur h-full min-h-[560px] flex flex-col dark:border-white/10 dark:bg-none dark:bg-slate-900/80">
              <div className="flex items-center gap-2 text-emerald-600 mb-3 dark:text-emerald-300">
                <SparklesIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">انطلق بسرعة</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
                مسارات سريعة للوصول لأقرب خدمة طبية
              </h2>
              <p className="text-sm text-gray-600 mb-5 dark:text-slate-300">
                ابحث بالاقتراحات الجاهزة أو ابدأ من الخريطة الذكية للوصول الأسرع.
              </p>
              <div className="flex-1 flex flex-col justify-between gap-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {quickSearches.map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-4 py-2 rounded-full border border-emerald-200/70 bg-emerald-100/90 text-emerald-900 text-sm font-semibold hover:bg-emerald-200 transition-colors dark:border-emerald-300/60 dark:bg-emerald-400/35 dark:text-white dark:hover:bg-emerald-400/45"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickStats.map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-2xl px-3 py-3 text-center text-xs font-semibold border border-transparent ${stat.tone}`}
                    >
                      <p className="text-lg font-bold">{stat.value.toLocaleString('ar-EG')}</p>
                      <p>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/directories"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 hover:text-white transition-colors shadow-lg shadow-emerald-500/30"
                >
                  استكشف الأدلة الطبية
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors dark:border-emerald-400/40 dark:text-emerald-100 dark:hover:bg-emerald-500/10"
                >
                  أدوات صحية ذكية
                  <BoltIcon className="w-4 h-4" />
                </Link>
              </div>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureHighlights.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href={feature.href} className="group">
                    <Card className="border-slate-100 bg-white/90 p-5 h-full transition-all group-hover:-translate-y-1 group-hover:shadow-lg dark:border-white/10 dark:bg-slate-900/80">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`p-2 rounded-xl ${feature.tone} dark:bg-white/10 dark:text-white`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed dark:text-slate-300">
                        {feature.description}
                      </p>
                      <span className="mt-4 inline-flex text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                        استكشف الآن
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-sm font-semibold text-emerald-600">الأدلة الطبية المتخصصة</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  كل الخدمات الرئيسية في صفحة واحدة
                </h2>
              </div>
              <Link
                href="/directories"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
              >
                عرض جميع الأدلة الطبية
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {directoryHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href} className="group">
                    <Card className="relative h-full overflow-hidden border-slate-100 p-5 transition-all group-hover:-translate-y-1 group-hover:shadow-xl dark:border-white/10 dark:bg-slate-900/80">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.tone} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />
                      <div className="relative flex h-full flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                            <Icon className={`w-6 h-6 ${item.accent}`} />
                          </span>
                          <Badge
                            variant="secondary"
                            size="sm"
                            className={`${item.badgeTone} dark:bg-white/10 dark:text-white`}
                          >
                            {item.badge}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-2 dark:text-slate-300">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-auto flex items-center justify-between text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          <span>{item.stat}</span>
                          <span className="inline-flex items-center gap-1">اذهب الآن</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="medical-tips" className="py-12 bg-white dark:bg-slate-900/60">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-sm font-semibold text-indigo-500">معلومات طبية سريعة</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  نصائح مختصرة لصحتك اليومية
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-300">
                <VideoCameraIcon className="w-4 h-4" />
                <span>محدّثة بشكل دوري</span>
              </div>
            </div>
            <MedicalTipsTicker tips={medicalTips} />
          </div>
        </section>

        <section className="py-12 bg-slate-50 dark:bg-slate-900/40">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-sm font-semibold text-slate-500">محتوى موصى به</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">مقالات طبية مختارة لك</h2>
              </div>
              <Link
                href="/articles"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200"
              >
                تصفح مكتبة المقالات
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articlesToShow.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`}>
                  <Card variant="hover" className="h-full overflow-hidden dark:border-white/10 dark:bg-slate-900/80">
                    <div className="relative -mx-4 -mt-4 mb-4">
                      <EntityCardImage
                        src={article.image}
                        alt={article.title}
                        entityType="article"
                        entityId={article.id}
                        aspectRatio="16/9"
                        className="rounded-t-xl"
                      />
                      {article.category?.nameAr && (
                        <Badge className="absolute top-3 right-3 z-10" variant="primary" size="sm">
                          {article.category.nameAr}
                        </Badge>
                      )}
                    </div>
                    <div className="px-1 pb-2">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 dark:text-white">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 dark:text-slate-300">
                        {article.excerpt || 'اقرأ المزيد من النصائح الطبية الدقيقة.'}
                      </p>
                      <p className="text-xs text-gray-400 mt-3 dark:text-slate-400">
                        {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
              <div>
                <p className="text-sm font-semibold text-rose-500">فيديوهات طبية</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  مكتبة الفيديو الطبية المتجددة
                </h2>
              </div>
              <Link
                href="/articles"
                className="text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-200"
              >
                المزيد من المحتوى المرئي
              </Link>
            </div>
            <AutoScrollRow
              className="snap-x snap-proximity"
              pauseOnHover
              loop
              dir="rtl"
              speed={0.05}
              respectReducedMotion={false}
              showControls
              controlsClassName="px-0"
            >
              {videoHighlights.map((video) => (
                <a
                  key={video.id}
                  href={video.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group min-w-[260px] sm:min-w-[300px] lg:min-w-[340px] snap-start"
                >
                  <Card className="h-full overflow-hidden dark:border-white/10 dark:bg-slate-900/80">
                    <div
                      className="relative h-48 bg-cover bg-center"
                      style={{ backgroundImage: `url(${video.thumbnail})` }}
                    >
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-lg group-hover:scale-105 transition-transform">
                          <PlayIcon className="w-6 h-6" />
                        </span>
                      </div>
                      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600">
                        {video.duration}
                      </span>
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" size="sm" className="mb-2">
                        {video.tag}
                      </Badge>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 dark:text-white">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-300">{video.doctor}</p>
                    </div>
                  </Card>
                </a>
              ))}
            </AutoScrollRow>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-sm font-semibold text-emerald-600">كلمات مفتاحية</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  ابحث حسب الكلمات الأشهر في الخدمات الطبية
                </h2>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-400">محسّن لمحركات البحث</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {seoKeywords.map((keyword) => (
                <Link
                  key={keyword}
                  href={`/search?q=${encodeURIComponent(keyword)}`}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <Card className="border-slate-100 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 text-white p-8 md:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-200 mb-2">ابدأ رحلتك الآن</p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                    منصتك الطبية المتكاملة في مصر
                  </h2>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    اعثر على مقدم الخدمة الأنسب، تابع صحتك عبر الأدوات الذكية، واستمتع بمحتوى طبي موثوق يرافقك يومياً.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/search"
                    className="px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition"
                  >
                    ابدأ رحلتك الصحية
                  </Link>
                  <Link
                    href="/contact"
                    className="px-5 py-2.5 rounded-full border border-emerald-200 text-emerald-100 text-sm font-semibold hover:bg-emerald-800/40 transition"
                  >
                    تواصل مع فريقنا
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
