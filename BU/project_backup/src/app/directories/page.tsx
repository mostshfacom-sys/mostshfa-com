import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Suspense } from 'react';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import type { Prisma } from '@prisma/client';
import {
  HeartIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  BeakerIcon,
  UserGroupIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'الأدلة الطبية | مستشفى.كوم',
  description:
    'صفحة الأدلة الطبية الشاملة في مصر: دليل الطوارئ، المستشفيات، العيادات، الصيدليات، المعامل، التمريض المنزلي، والأدوية في مكان واحد.',
  openGraph: {
    title: 'الأدلة الطبية | مستشفى.كوم',
    description:
      'استكشف جميع الأدلة الطبية والخدمات الصحية مع تصنيفات واضحة وروابط مباشرة لكل دليل متخصص.',
  },
};

type DirectoryStats = {
  hospitals: number;
  emergencyHospitals: number;
  clinics: number;
  labs: number;
  pharmacies: number;
  drugs: number;
  nursingProviders: number;
};

type DirectoryItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: { label: string; variant?: 'primary' | 'secondary' | 'success' | 'danger' };
  icon: ComponentType<{ className?: string }>;
  statKey?: keyof DirectoryStats;
  statLabel?: string;
  accent: string;
  soft: string;
  gradient: string;
};

type DirectoryGroup = {
  id: string;
  title: string;
  description: string;
  items: DirectoryItem[];
};

type DirectoryHighlight = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  soft: string;
};

const nursingPharmacyWhere: Prisma.PharmacyWhereInput = {
  status: 'published',
  OR: [
    { nameAr: { contains: 'تمريض' } },
    { nameEn: { contains: 'nursing' } },
    { descriptionAr: { contains: 'تمريض' } },
    { descriptionAr: { contains: 'منزلي' } },
  ],
};

async function getDirectoryStats(): Promise<DirectoryStats> {
  try {
    const [
      hospitals,
      emergencyHospitals,
      clinics,
      labs,
      pharmacies,
      drugs,
      nursingPharmacies,
      nursingStaff,
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { hasEmergency: true } }),
      prisma.clinic.count(),
      prisma.lab.count(),
      prisma.pharmacy.count(),
      prisma.drug.count(),
      prisma.pharmacy.count({ where: nursingPharmacyWhere }),
      prisma.staff.count({
        where: {
          isActive: true,
          OR: [
            { nameAr: { contains: 'تمريض' } },
            { nameAr: { contains: 'ممرض' } },
            { nameEn: { contains: 'nurse' } },
            { nameEn: { contains: 'nursing' } },
            { title: { contains: 'تمريض' } },
            { title: { contains: 'ممرض' } },
          ],
        },
      }),
    ]);

    return {
      hospitals,
      emergencyHospitals,
      clinics,
      labs,
      pharmacies,
      drugs,
      nursingProviders: nursingPharmacies + nursingStaff,
    };
  } catch (error) {
    console.error('Error loading directories stats:', error);
    return {
      hospitals: 0,
      emergencyHospitals: 0,
      clinics: 0,
      labs: 0,
      pharmacies: 0,
      drugs: 0,
      nursingProviders: 0,
    };
  }
}

const directoryGroups: DirectoryGroup[] = [
  {
    id: 'emergency',
    title: 'الرعاية الطارئة والعاجلة',
    description: 'أدلة مخصصة للاستجابة السريعة والخدمات الحيوية على مدار الساعة.',
    items: [
      {
        id: 'emergency',
        title: 'دليل الطوارئ الطبية',
        description: 'أقسام الاستقبال الطارئ، أرقام الطوارئ، وأدوية الإسعافات الأولية.',
        href: '/emergency',
        badge: { label: 'عاجل', variant: 'danger' },
        icon: HeartIcon,
        statKey: 'emergencyHospitals',
        statLabel: 'مستشفيات بها طوارئ',
        accent: 'text-red-600',
        soft: 'bg-red-50',
        gradient: 'from-red-500/15 via-orange-500/10 to-transparent',
      },
    ],
  },
  {
    id: 'specialized',
    title: 'أدلة نمط الحياة والصحة المتخصصة',
    description: 'أدلة شاملة للصحة النفسية، الجمال، اللياقة، والإسعافات الأولية.',
    items: [
      {
        id: 'beauty-health',
        title: 'دليل الصحة والجمال',
        description: 'نصائح للعناية بالبشرة والشعر والجمال الطبيعي.',
        href: '/beauty-health',
        icon: SparklesIcon,
        statLabel: 'محتوى متخصص',
        accent: 'text-rose-600',
        soft: 'bg-rose-50',
        gradient: 'from-rose-500/15 via-pink-500/10 to-transparent',
      },
      {
        id: 'mental-health',
        title: 'دليل الصحة النفسية',
        description: 'دعم للصحة النفسية، القلق، والاكتئاب.',
        href: '/mental-health',
        icon: HeartIcon,
        statLabel: 'محتوى متخصص',
        accent: 'text-violet-600',
        soft: 'bg-violet-50',
        gradient: 'from-violet-500/15 via-purple-500/10 to-transparent',
      },
      {
        id: 'fitness-health',
        title: 'دليل اللياقة البدنية',
        description: 'برامج رياضية وتغذية لحياة صحية.',
        href: '/fitness-health',
        icon: BoltIcon,
        statLabel: 'محتوى متخصص',
        accent: 'text-emerald-600',
        soft: 'bg-emerald-50',
        gradient: 'from-emerald-500/15 via-green-500/10 to-transparent',
      },
      {
        id: 'first-aid',
        title: 'دليل الإسعافات الأولية',
        description: 'خطوات التعامل مع الحالات الطارئة.',
        href: '/first-aid',
        badge: { label: 'هام', variant: 'danger' },
        icon: ShieldCheckIcon,
        statLabel: 'محتوى متخصص',
        accent: 'text-red-600',
        soft: 'bg-red-50',
        gradient: 'from-red-500/15 via-orange-500/10 to-transparent',
      },
      {
        id: 'sexual-health',
        title: 'دليل الصحة الجنسية',
        description: 'توعية صحية شاملة للصحة الإنجابية.',
        href: '/sexual-health',
        icon: FireIcon,
        statLabel: 'محتوى متخصص',
        accent: 'text-sky-600',
        soft: 'bg-sky-50',
        gradient: 'from-sky-500/15 via-blue-500/10 to-transparent',
      },
      {
        id: 'medical-info',
        title: 'المعلومات الطبية',
        description: 'محتوى طبي يومي ونصائح معتمدة من الخبراء.',
        href: '/medical-info',
        icon: ClipboardDocumentListIcon,
        statLabel: 'محتوى يومي',
        accent: 'text-amber-600',
        soft: 'bg-amber-50',
        gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
      },
      {
        id: 'medical-videos',
        title: 'الفيديوهات الطبية',
        description: 'فيديوهات توعوية وتمارين مرئية للصحة اليومية.',
        href: '/medical-videos',
        icon: SparklesIcon,
        statLabel: 'محتوى مرئي',
        accent: 'text-indigo-600',
        soft: 'bg-indigo-50',
        gradient: 'from-indigo-500/15 via-sky-500/10 to-transparent',
      },
    ],
  },
  {
    id: 'facilities',
    title: 'المنشآت الطبية والخدمات الأساسية',
    description: 'أدلة المستشفيات والعيادات والمعامل والصيدليات في كل محافظات مصر.',
    items: [
      {
        id: 'hospitals-pro',
        title: 'دليل المستشفيات المتقدم',
        description: 'تجربة موسعة مع التقييمات، التخصصات، وخيارات البحث الذكي.',
        href: '/hospitals-pro',
        badge: { label: 'مميز', variant: 'success' },
        icon: SparklesIcon,
        statKey: 'hospitals',
        statLabel: 'إجمالي المستشفيات',
        accent: 'text-emerald-600',
        soft: 'bg-emerald-50',
        gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
      },
      {
        id: 'hospitals',
        title: 'دليل المستشفيات الكلاسيكي',
        description: 'عرض مبسط لأهم المستشفيات والمراكز الطبية القريبة منك.',
        href: '/hospitals',
        badge: { label: 'أساسي', variant: 'secondary' },
        icon: BuildingOffice2Icon,
        statKey: 'hospitals',
        statLabel: 'مستشفى معتمد',
        accent: 'text-sky-600',
        soft: 'bg-sky-50',
        gradient: 'from-sky-500/15 via-cyan-500/10 to-transparent',
      },
      {
        id: 'doctors',
        title: 'دليل الأطباء',
        description: 'ابحث عن الأطباء حسب التخصص والخبرة.',
        href: '/doctors',
        icon: UserGroupIcon,
        statLabel: 'طبيب معتمد',
        accent: 'text-teal-600',
        soft: 'bg-teal-50',
        gradient: 'from-teal-500/15 via-emerald-500/10 to-transparent',
      },
      {
        id: 'clinics',
        title: 'دليل العيادات',
        description: 'عيادات متخصصة في جميع التخصصات الطبية مع تفاصيل الأطباء.',
        href: '/clinics',
        icon: BuildingOffice2Icon,
        statKey: 'clinics',
        statLabel: 'عيادة متخصصة',
        accent: 'text-green-600',
        soft: 'bg-green-50',
        gradient: 'from-green-500/15 via-emerald-500/10 to-transparent',
      },
      {
        id: 'labs',
        title: 'دليل المعامل',
        description: 'معامل تحاليل موثوقة مع خدمات السحب المنزلي والنتائج الإلكترونية.',
        href: '/labs',
        icon: BeakerIcon,
        statKey: 'labs',
        statLabel: 'معمل تحاليل',
        accent: 'text-purple-600',
        soft: 'bg-purple-50',
        gradient: 'from-purple-500/15 via-fuchsia-500/10 to-transparent',
      },
      {
        id: 'pharmacies',
        title: 'دليل الصيدليات',
        description: 'صيدليات قريبة تعمل 24 ساعة مع خدمات التوصيل والاستشارات.',
        href: '/pharmacies',
        icon: BuildingStorefrontIcon,
        statKey: 'pharmacies',
        statLabel: 'صيدلية نشطة',
        accent: 'text-rose-600',
        soft: 'bg-rose-50',
        gradient: 'from-rose-500/15 via-pink-500/10 to-transparent',
      },
      {
        id: 'map',
        title: 'خريطة الخدمات الطبية',
        description: 'استعرض المستشفيات والخدمات الطبية على الخريطة.',
        href: '/map',
        icon: MapPinIcon,
        statLabel: 'خريطة تفاعلية',
        accent: 'text-blue-600',
        soft: 'bg-blue-50',
        gradient: 'from-blue-500/15 via-sky-500/10 to-transparent',
      },
    ],
  },
  {
    id: 'home-care',
    title: 'الرعاية المنزلية والوقائية',
    description: 'خدمات تمريضية منزلية، ومراجع دوائية تساعدك على العناية المستمرة.',
    items: [
      {
        id: 'nursing',
        title: 'دليل التمريض المنزلي',
        description: 'فرق تمريض منزلية ونصائح للرعاية اليومية ومتابعة الحالات.',
        href: '/nursing',
        badge: { label: 'منزلي', variant: 'primary' },
        icon: UserGroupIcon,
        statKey: 'nursingProviders',
        statLabel: 'مزود خدمة تمريض',
        accent: 'text-pink-600',
        soft: 'bg-pink-50',
        gradient: 'from-pink-500/15 via-rose-500/10 to-transparent',
      },
      {
        id: 'drugs',
        title: 'دليل الأدوية',
        description: 'معلومات شاملة عن الأدوية والبدائل وتفاعلات الاستخدام.',
        href: '/drugs',
        icon: ClipboardDocumentListIcon,
        statKey: 'drugs',
        statLabel: 'دواء مسجل',
        accent: 'text-amber-600',
        soft: 'bg-amber-50',
        gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
      },
      {
        id: 'tools',
        title: 'الأدوات الطبية الذكية',
        description: 'أدوات متابعة الصحة اليومية مثل قياس الضغط والسعرات.',
        href: '/tools',
        icon: BoltIcon,
        statLabel: 'أدوات تفاعلية',
        accent: 'text-slate-600',
        soft: 'bg-slate-50',
        gradient: 'from-slate-500/15 via-gray-500/10 to-transparent',
      },
    ],
  },
];

const directoryHighlights: DirectoryHighlight[] = [
  {
    id: 'coverage',
    title: 'تغطية طبية شاملة',
    description: 'كل المستشفيات والعيادات والمعامل والصيدليات والأدوية في مكان واحد.',
    icon: BuildingOffice2Icon,
    accent: 'text-emerald-600',
    soft: 'bg-emerald-50',
  },
  {
    id: 'trust',
    title: 'محتوى موثوق ومراجع',
    description: 'تصنيفات واضحة وروابط مباشرة تساعدك تصل للمعلومة بسرعة.',
    icon: ShieldCheckIcon,
    accent: 'text-blue-600',
    soft: 'bg-blue-50',
  },
  {
    id: 'emergency',
    title: 'جاهزية للطوارئ',
    description: 'وصول سريع لأقسام الطوارئ وخدمات الإسعافات الأولية.',
    icon: HeartIcon,
    accent: 'text-rose-600',
    soft: 'bg-rose-50',
  },
  {
    id: 'location',
    title: 'قريب من موقعك',
    description: 'استعرض الخدمات الطبية حسب المحافظات والمناطق بسهولة.',
    icon: MapPinIcon,
    accent: 'text-indigo-600',
    soft: 'bg-indigo-50',
  },
];

export default async function DirectoriesPage() {
  const stats = await getDirectoryStats();
  const formatNumber = new Intl.NumberFormat('ar-EG');
  const totalDirectories = directoryGroups.reduce((sum, group) => sum + group.items.length, 0);
  const quickFilters = directoryGroups.map((group) => ({
    id: `group-${group.id}`,
    label: group.title,
    count: group.items.length,
    href: `/directories#${group.id}`,
  }));
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'care-institutions',
      label: 'مؤسسات علاجية',
      value: stats.hospitals + stats.clinics,
      icon: 'building',
      color: '#10b981',
    },
    {
      id: 'diagnostics-pharmacies',
      label: 'صيدليات ومعامل',
      value: stats.pharmacies + stats.labs,
      icon: 'shield',
      color: '#3b82f6',
    },
    {
      id: 'emergency-home-care',
      label: 'طوارئ وتمريض منزلي',
      value: stats.emergencyHospitals + stats.nursingProviders,
      icon: 'heart',
      color: '#ef4444',
    },
    {
      id: 'registered-drugs',
      label: 'أدوية موثقة',
      value: stats.drugs,
      icon: 'star',
      color: '#f59e0b',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="directories"
            title="الأدلة الطبية"
            subtitle="صفحة الأدلة الطبية الشاملة في مصر: دليل الطوارئ، المستشفيات، العيادات، الصيدليات، المعامل، التمريض المنزلي، والأدوية في مكان واحد مع روابط مباشرة لكل خدمة."
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={totalDirectories}
            showResultsCount
            searchPlaceholder="ابحث عن خدمة أو دليل طبي..."
            searchParamKey="q"
            searchAction="/search"
            resetPageOnSearch={false}
            showViewToggle={false}
            showVoiceSearch
            showMapButton={false}
            useBannerText={false}
            className="mb-8"
          />
        </Suspense>
        <div className="container-custom py-8">
          <Breadcrumb items={[{ label: 'الأدلة الطبية' }]} className="mb-6" />
          <section className="mb-10">
            <Card className="relative overflow-hidden border-emerald-100 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="p-6 md:p-8">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300 mb-3">الأدلة الطبية</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  كل ما تحتاجه من أدلة طبية في صفحة واحدة
                </h2>
                <p className="text-gray-600 dark:text-slate-200 text-base md:text-lg mb-6">
                  دليل متكامل يربط بين خدمات الطوارئ، المستشفيات، العيادات، الصيدليات، التمريض المنزلي، والأدوية.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/search"
                    className="px-5 py-2.5 rounded-full bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    ابحث عن خدمة الآن
                  </Link>
                  <Link
                    href="/emergency"
                    className="px-5 py-2.5 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    اذهب إلى دليل الطوارئ
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">لماذا مستشفى.كوم؟</h2>
              <p className="text-gray-600 dark:text-slate-300">
                منصة واحدة تجمع الأدلة الطبية وتسهّل الوصول للخدمات الصحية الموثوقة في مصر.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {directoryHighlights.map((highlight) => {
                const Icon = highlight.icon;
                return (
                  <Card key={highlight.id} className="h-full">
                    <div className="flex flex-col gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${highlight.soft} ${highlight.accent} dark:bg-white/10 dark:text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{highlight.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{highlight.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-12">
            {directoryGroups.map((group) => (
              <div key={group.id} id={group.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{group.title}</h2>
                  <p className="text-gray-600 dark:text-slate-300">{group.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const statValue = item.statKey ? formatNumber.format(stats[item.statKey]) : null;

                    return (
                      <Link key={item.id} href={item.href} className="block h-full">
                        <Card variant="hover" className="group relative overflow-hidden h-full">
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-2xl ${item.soft} ${item.accent} transition-transform group-hover:scale-105 dark:bg-white/10 dark:text-white`}>
                                <Icon className="w-7 h-7" />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                  {item.badge && (
                                    <Badge variant={item.badge.variant ?? 'secondary'} size="sm">
                                      {item.badge.label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                              </div>
                            </div>

                            {statValue && (
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
                                <span>{item.statLabel}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{statValue}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
                              <span>استعرض الدليل</span>
                              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-900/70">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ماذا يغطي الدليل الطبي؟</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>أدلة المستشفيات والعيادات والتخصصات الطبية.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>أقسام الطوارئ والإسعافات الأولية وأرقام الإنقاذ.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>صيدليات 24 ساعة وخدمات التوصيل والاستشارة.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>معامل تحاليل وخدمات منزلية ونتائج إلكترونية.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>تمريض منزلي ورعاية صحية مستمرة للمرضى.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>معلومات الأدوية البديلة والتعليمات المهمة.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/90 text-white border-slate-800/80">
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200 mb-3">ميزة سريعة</p>
                  <h2 className="text-2xl font-bold mb-4">وصول أسرع للخدمة الطبية الأقرب</h2>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    استخدم البحث الذكي للوصول لأقرب خدمة طبية مع تصنيفات واضحة، وتحديثات مستمرة للمحتوى والخدمات.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/search"
                    className="px-5 py-2.5 rounded-full bg-emerald-500 text-white font-semibold shadow-sm hover:bg-emerald-400 transition-colors"
                  >
                    ابحث الآن
                  </Link>
                  <Link
                    href="/hospitals-pro"
                    className="px-5 py-2.5 rounded-full border border-emerald-200/60 text-emerald-100 font-semibold hover:bg-emerald-500/20 transition-colors"
                  >
                    ابدأ بالمستشفيات
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          <section className="mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">أسئلة شائعة</h2>
              <p className="text-gray-600 dark:text-slate-300">إجابات سريعة حول الأدلة الطبية وكيفية الاستفادة منها.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                {
                  question: 'كيف أجد أقرب خدمة طبية؟',
                  answer: 'استخدم البحث أعلى الصفحة أو خريطة الخدمات الطبية لتحديد الموقع الأقرب لك بسهولة.',
                },
                {
                  question: 'هل الأدلة الطبية محدثة؟',
                  answer: 'نقوم بتحديث الأدلة بشكل مستمر وإضافة خدمات جديدة مع تحسين بيانات التواصل.',
                },
                {
                  question: 'هل يوجد محتوى مخصص للتوعية؟',
                  answer: 'نعم، يمكنك تصفح المعلومات الطبية والفيديوهات التوعوية والدلائل المتخصصة.',
                },
                {
                  question: 'هل يمكنني الوصول إلى خدمات الطوارئ سريعًا؟',
                  answer: 'يوفر دليل الطوارئ روابط مباشرة وأرقام مهمة لتسهيل الوصول للخدمة.',
                },
              ].map((item) => (
                <Card key={item.question} className="bg-white dark:bg-slate-900/70">
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{item.question}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{item.answer}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card className="mt-16 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-emerald-900 dark:text-white mb-4">جاهز لتجربة الأدلة الطبية؟</h2>
              <p className="text-emerald-700 dark:text-emerald-100 mb-6">
                استخدم الأدلة المتخصصة للوصول إلى الخدمات الطبية الأسرع والأقرب لك.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/hospitals-pro"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  دليل المستشفيات المتقدم
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
