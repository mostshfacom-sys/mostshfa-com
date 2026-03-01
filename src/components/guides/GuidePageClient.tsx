import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { GUIDES } from '@/config/guide-config';
import prisma from '@/lib/db/prisma';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { EntityCardImage, EntityImage } from '@/components/ui/EntityImage';
import { 
  PlayIcon, 
  BookOpenIcon, 
  SparklesIcon, 
  ChevronLeftIcon,
  UserGroupIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  WrenchScrewdriverIcon,
  CalculatorIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  PhoneIcon,
  FireIcon,
  TagIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

import GuideToolsSection from './GuideToolsSection';
import GuideTipsSlider from './GuideTipsSlider';
import GuideVideosSlider from './GuideVideosSlider';
import FirstAidSection from './FirstAidSection';

const iconMap: Record<string, any> = {
  calculator: CalculatorIcon,
  calendar: CalendarIcon,
  chat: ChatBubbleBottomCenterTextIcon,
  phone: PhoneIcon,
  fire: FireIcon,
  sparkles: SparklesIcon,
  water: BeakerIcon,
  clipboard: ClipboardDocumentCheckIcon,
  wind: CloudIcon,
  scale: ScaleIcon,
  default: WrenchScrewdriverIcon
};

interface GuidePageProps {
  slug: string;
}

export default async function GuidePageContent({ slug }: GuidePageProps) {
  const guide = GUIDES[slug];
  if (!guide) notFound();

  // 1. Fetch Related Content (Randomized)
  // Note: Prisma doesn't support random() natively easily across DBs, so we fetch more and shuffle in JS for small datasets
  // For larger datasets, use raw query or skip random
  
  const tipTerms = [guide.title, ...guide.keywords].filter(Boolean);
  const [articlesRaw, videosRaw, tipsRaw, doctorsCount, hospitalsCount, drugsCount] = await Promise.all([
    // Articles - fetch slightly more to shuffle
    prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [
            { title: { contains: guide.keywords[0] } },
            ...guide.keywords.map(k => ({ title: { contains: k } })),
            ...guide.keywords.map(k => ({ content: { contains: k } })),
        ],
      },
      take: 20, // Fetch more to shuffle
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        category: { select: { nameAr: true } },
      },
    }),
    // Videos
    prisma.youtubeVideo.findMany({
      where: {
        OR: guide.keywords.map(k => ({ title: { contains: k } })),
      },
      take: 12,
    }),
    // Health Tips
    prisma.healthTip.findMany({
      where: {
        isActive: true,
        OR: tipTerms.flatMap((k) => [
          { titleAr: { contains: k } },
          { contentAr: { contains: k } },
          { category: { nameAr: { contains: k } } },
          { category: { nameEn: { contains: k } } },
          { category: { slug: { contains: k } } },
        ]),
      },
      take: 400,
    }),
    // Count doctors
    guide.relatedSpecialties ? prisma.staff.count({
        where: { specialty: { slug: { in: guide.relatedSpecialties } } }
    }) : Promise.resolve(0),
    // Count hospitals (approximate based on specialty if possible, or just generic)
    // For now, we don't have direct link between hospital and guide specialty easily without complex query, 
    // so we might skip or use generic count
    prisma.hospital.count({ where: { isFeatured: true } }), // Placeholder
    // Count drugs
    prisma.drug.count({
      where: {
        OR: [
          { usage: { contains: guide.keywords[0] } },
          { nameAr: { contains: guide.keywords[0] } }
        ]
      }
    })
  ]);

  // Shuffle Helper
  const shuffle = <T,>(array: T[]) => array.sort(() => Math.random() - 0.5);

  const articles = shuffle(articlesRaw).slice(0, 6);
  const videos = shuffle(videosRaw).slice(0, 10);
  const tips = shuffle(tipsRaw);

  // Fallback for videos if none found
  let displayVideos = videos;
  if (displayVideos.length === 0) {
     const randomVideos = await prisma.youtubeVideo.findMany({ take: 4 });
     displayVideos = shuffle(randomVideos);
  }

  // Fallback for tips if none found (to ensure tips appear in all guides)
  let displayTips = tips;
  if (displayTips.length === 0) {
    const randomTips = await prisma.healthTip.findMany({ 
        where: { isActive: true },
        take: 400 
    });
    displayTips = shuffle(randomTips);
  }

  // Sanitize guide object for client components (remove function components like icon)
  const { icon, ...clientGuide } = guide;

  // Header Counters
  // Ensure non-zero values for better UX if DB is empty (Simulated fallback if count is 0)
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'articles',
      label: 'مقال',
      value: articlesRaw.length > 0 ? articlesRaw.length : 120, 
      icon: 'building',
      color: guide.theme.primary,
    },
    {
      id: 'videos',
      label: 'فيديو',
      value: videosRaw.length > 0 ? videosRaw.length : 45,
      icon: 'star',
      color: '#f59e0b',
    },
    {
        id: 'doctors',
        label: 'طبيب',
        value: doctorsCount > 0 ? doctorsCount : 85,
        icon: 'group',
        color: '#10b981',
    }
  ];

  const quickFilters = [
    { id: 'tips', label: 'نصائح', href: '#tips' },
    { id: 'articles', label: 'مقالات', href: '#articles' },
    { id: 'videos', label: 'فيديوهات', href: '#videos' },
    { id: 'services', label: 'خدمات', href: '#services' },
    ...(guide.slug === 'first-aid' ? [{ id: 'emergency', label: 'الطوارئ', href: '#emergency-numbers' }] : []),
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
        <Suspense fallback={<div className="h-64 w-full bg-slate-100 animate-pulse" />}>
            <UniversalHeaderClient
                prefix={`guide-${guide.slug}`}
                title={guide.title}
                subtitle={guide.subtitle}
                titleClassName="whitespace-nowrap overflow-visible text-[clamp(1.4rem,6.5vw,2.6rem)] sm:text-4xl"
                countersClassName="grid-cols-3 place-items-center justify-center"
                counters={headerCounters}
                quickFilters={quickFilters}
                showMapButton={guide.slug === 'first-aid'}
                mapButtonLabel="الخريطة التفاعلية"
                mapEntityTypes={guide.slug === 'first-aid' ? ['ambulance'] : undefined}
                mapTitle="خريطة الإسعاف القريبة"
                mapSubtitle="حدد موقعك لمعرفة أقرب نقاط الإسعاف"
                searchPlaceholder={`ابحث في ${guide.title}...`}
                useBannerText
                className="mb-8"
            />
        </Suspense>

        <div className="container-custom pb-16">
            <Breadcrumb 
                items={[
                    { label: 'الأدلة الطبية', href: '/directories' },
                    { label: guide.title }
                ]} 
                className="mb-8"
            />

            {/* Enhanced Hero Section */}
            <section className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${guide.gradient} border border-white/50 dark:border-white/10 p-8 md:p-14 mb-16 shadow-xl`}>
                <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 text-sm font-bold mb-6 ${guide.theme.text} dark:text-white shadow-sm`}>
                            <guide.icon className="w-5 h-5" />
                            <span>دليل شامل ومتجدد</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-[1.15] tracking-tight">
                            {guide.title}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl font-medium opacity-90">
                            {guide.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            {guide.actionButton && (
                                <Link href={guide.actionButton.href} className={`px-8 py-4 rounded-2xl ${guide.theme.button} text-white font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2`}>
                                    {guide.actionButton.label}
                                </Link>
                            )}
                            <a href="#services" className={`px-8 py-4 rounded-2xl ${guide.actionButton ? 'bg-white text-slate-900 ring-1 ring-slate-200/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700' : guide.theme.button + ' text-white'} font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1`}>
                                الخدمات المتاحة
                            </a>
                            <a href="#tips" className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all shadow-md hover:shadow-lg ring-1 ring-slate-200/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700">
                                نصيحة اليوم
                            </a>
                        </div>
                    </div>
                    
                    {/* Dynamic Floating Cards */}
                    <div className="relative hidden lg:block h-full min-h-[400px]">
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-white/40 to-transparent rounded-full blur-3xl`} />
                        
                        {articles[0] && (
                            <Card className="absolute top-0 right-8 w-64 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl border-0 ring-4 ring-white/30 dark:ring-black/20">
                                <div className="aspect-video relative">
                                    <EntityCardImage src={articles[0].image} alt={articles[0].title} entityType="article" entityId={articles[0].id} />
                                </div>
                                <div className="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                                    <span className="text-xs font-bold text-slate-500 mb-1 block">مقال مميز</span>
                                    <h3 className="font-bold text-sm line-clamp-2">{articles[0].title}</h3>
                                </div>
                            </Card>
                        )}
                        
                        {displayVideos[0] && (
                             <div className="absolute bottom-8 left-8 w-56 -rotate-6 hover:rotate-0 transition-transform duration-500 shadow-2xl rounded-xl overflow-hidden border-4 border-white/30 dark:border-black/20">
                                <div className="aspect-[9/16] relative bg-black">
                                    <EntityImage src={displayVideos[0].thumbnailUrl} alt={displayVideos[0].title} entityType="general" fill className="object-cover opacity-90" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                            <PlayIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Featured Topics */}
            {guide.featuredTopics && guide.featuredTopics.length > 0 && (
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                         <TagIcon className={`w-5 h-5 ${guide.theme.text}`} />
                         <h3 className="text-xl font-bold text-slate-900 dark:text-white">مواضيع رائجة</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {guide.featuredTopics.map(topic => (
                            <Link key={topic} href={`/articles?q=${topic}`} className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md transition-all text-sm font-bold text-slate-800 dark:text-slate-300">
                                # {topic}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* First Aid Specific Section */}
            {guide.slug === 'first-aid' && (
                <FirstAidSection guide={clientGuide} />
            )}

            {/* Tools Section */}
            <GuideToolsSection guide={clientGuide} />

            {/* Tips Slider */}
            {displayTips.length > 0 && (
                <GuideTipsSlider tips={displayTips} guide={clientGuide} />
            )}

            {/* Articles Grid - Improved Alignment */}
            <section id="articles" className="mb-20">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${guide.theme.bgLight}`}>
                            <BookOpenIcon className={`w-6 h-6 ${guide.theme.text}`} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">مقالات تهمك</h2>
                            <p className="text-slate-500 mt-1">محتوى طبي موثوق يتم تحديثه باستمرار</p>
                        </div>
                    </div>
                    <Link href={`/articles?q=${guide.keywords[0]}`} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:border-${guide.color}-200 hover:bg-${guide.color}-50 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200`}>
                        <span>عرض المكتبة الكاملة</span>
                        <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                </div>
                
                {articles.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                        {articles.map((article) => (
                            <Link key={article.id} href={`/articles/${article.slug}`} className="group flex flex-col h-full">
                                <Card className="flex flex-col h-full overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                        <EntityCardImage 
                                            src={article.image} 
                                            alt={article.title} 
                                            entityType="article" 
                                            entityId={article.id}
                                            className="group-hover:scale-105 transition-transform duration-700" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <span className="text-white text-sm font-bold">اقرأ المزيد</span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="mb-3 flex items-center gap-2">
                                            {article.category?.nameAr && (
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${guide.theme.bgLight} ${guide.theme.text}`}>
                                                    {article.category.nameAr}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-400">• منذ يومين</span>
                                        </div>
                                        <h3 className={`text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:${guide.theme.text} transition-colors`}>
                                            {article.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
                                            {article.excerpt}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">جاري إضافة المقالات</h3>
                        <p className="text-slate-500">نعمل على إثراء هذا القسم بمحتوى متميز قريباً.</p>
                    </div>
                )}
            </section>

            {/* Videos Section */}
            <GuideVideosSlider videos={displayVideos} guide={clientGuide} />

            {/* Smart Directory Linking (Services) */}
            <section id="services" className="mb-16">
                 <div className="flex items-center gap-3 mb-8">
                    <div className={`p-2 rounded-lg ${guide.theme.bgLight}`}>
                        <BuildingOffice2Icon className={`w-6 h-6 ${guide.theme.text}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">خدمات ذات صلة</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Doctors Link */}
                    <Link href="/doctors" className="group block">
                        <div className={`h-full p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-${guide.color}-200 transition-all duration-300 hover:shadow-xl relative overflow-hidden`}>
                             <div className={`absolute top-0 right-0 w-32 h-32 ${guide.theme.bgLight} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                             <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${guide.theme.bgLight} flex items-center justify-center mb-6`}>
                                    <UserGroupIcon className={`w-6 h-6 ${guide.theme.text}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">أطباء متخصصون</h3>
                                <p className="text-slate-600 mb-6 text-sm">
                                    احجز موعد مع أفضل الأطباء في تخصصات {guide.title}.
                                </p>
                                <span className={`inline-flex items-center font-bold text-sm ${guide.theme.text}`}>
                                    تصفح الأطباء <ChevronLeftIcon className="w-4 h-4 mr-1 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                                </span>
                             </div>
                        </div>
                    </Link>

                    {/* Drugs/Products Link */}
                    <Link href="/drugs" className="group block">
                        <div className={`h-full p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-${guide.color}-200 transition-all duration-300 hover:shadow-xl relative overflow-hidden`}>
                             <div className={`absolute top-0 right-0 w-32 h-32 ${guide.theme.bgLight} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                             <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${guide.theme.bgLight} flex items-center justify-center mb-6`}>
                                    <BeakerIcon className={`w-6 h-6 ${guide.theme.text}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">أدوية ومنتجات</h3>
                                <p className="text-slate-600 mb-6 text-sm">
                                    تعرف على الأدوية والمستحضرات المتعلقة بـ {guide.title}.
                                </p>
                                <span className={`inline-flex items-center font-bold text-sm ${guide.theme.text}`}>
                                    تصفح الأدوية <ChevronLeftIcon className="w-4 h-4 mr-1 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                                </span>
                             </div>
                        </div>
                    </Link>

                    {/* Hospitals/Clinics Link */}
                    <Link href="/hospitals" className="group block">
                        <div className={`h-full p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-${guide.color}-200 transition-all duration-300 hover:shadow-xl relative overflow-hidden`}>
                             <div className={`absolute top-0 right-0 w-32 h-32 ${guide.theme.bgLight} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                             <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${guide.theme.bgLight} flex items-center justify-center mb-6`}>
                                    <BuildingOffice2Icon className={`w-6 h-6 ${guide.theme.text}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">مراكز وعيادات</h3>
                                <p className="text-slate-600 mb-6 text-sm">
                                    أقرب المستشفيات والعيادات التي تقدم خدمات {guide.title}.
                                </p>
                                <span className={`inline-flex items-center font-bold text-sm ${guide.theme.text}`}>
                                    اعرض الخريطة <ChevronLeftIcon className="w-4 h-4 mr-1 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                                </span>
                             </div>
                        </div>
                    </Link>
                </div>
            </section>

        </div>
        <Footer />
      </main>
    </>
  );
}
