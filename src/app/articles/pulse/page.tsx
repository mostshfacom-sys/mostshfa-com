import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkSquareIcon,
  ClockIcon,
  GlobeAltIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Header, Footer } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { EntityImage } from '@/components/ui/EntityImage';
import {
  SITE_URL,
  getHelpfulLinksForArticle,
  getPulseContentType,
  getInternalPulseHref,
  getPulseData,
  getPulseImageUrl,
  medicalBriefPath,
  getSpecialtyConfig,
  pulseRevalidate,
} from './lib';

export const revalidate = pulseRevalidate;

const numberFormatter = new Intl.NumberFormat('ar-EG');
const dateFormatter = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
const sectionName = 'الموجز الطبي';
const sectionShortName = sectionName;

export const metadata: Metadata = {
  title: `${sectionName} | مستشفى.كوم`,
  description:
    'موجز طبي عربي متجدد يجمع الأخبار الطبية من مصادر عربية خارجية موثوقة داخل صفحات داخلية قابلة للأرشفة ومتصلة بخدمات مستشفى.كوم.',
  alternates: {
    canonical: medicalBriefPath,
  },
  openGraph: {
    title: `${sectionName} | مستشفى.كوم`,
    description:
      'تابع أحدث الأخبار الطبية العربية حسب التخصصات مع صفحات داخلية للمقال وروابط ذكية إلى الأدوية والمقالات والأطباء والخدمات.',
    url: medicalBriefPath,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${sectionName} | مستشفى.كوم`,
    description:
      'قسم عربي متجدد للأخبار الطبية الخارجية مع أرشفة داخلية وتجربة قراءة شبيهة بالمنصات التجميعية.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqItems = [
  {
    question: `ما الذي يقدمه قسم ${sectionShortName}؟`,
    answer:
      'يعرض لك القسم أحدث الأخبار والمقالات الطبية القادمة من مصادر خارجية موثوقة في صفحة واحدة، مع تقسيم واضح حسب التخصصات لتصل بسرعة إلى المجال الذي يهمك.',
  },
  {
    question: 'هل الأخبار المعروضة هنا من مستشفى.كوم؟',
    answer:
      'لا، هذا القسم مخصص لتجميع المحتوى الطبي المنشور خارج الموقع، مع الإشارة الواضحة إلى اسم المصدر الأصلي ورابط الانتقال إليه مباشرة.',
  },
  {
    question: 'هل أستطيع قراءة الخبر من المصدر الأصلي؟',
    answer:
      'نعم، لكن المرور أولاً يتم عبر صفحة داخلية داخل مستشفى.كوم تعرض المقتطف والبيانات والمشاركة والروابط الذكية، ثم يمكنك الانتقال إلى المصدر الأصلي لقراءة الخبر كاملًا.',
  },
  {
    question: `ما التخصصات التي يغطيها ${sectionShortName}؟`,
    answer:
      'يغطي القسم تخصصات متعددة مثل القلب والتغذية والصحة النفسية وصحة المرأة وطب الأطفال والأورام والجهاز الهضمي والصدر والعظام والجلدية والمناعة والكلى والغدد والصحة العامة، بحسب ما هو متاح في آخر التحديثات.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return 'تحديث حديث';
  return dateFormatter.format(value);
}

function PulseImage({
  title,
  image,
  source,
  sizes,
  priority,
  showSourceBadge = true,
}: {
  title: string;
  image: string | null;
  source: string;
  sizes: string;
  priority?: boolean;
  showSourceBadge?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-primary-100 via-sky-100 to-emerald-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <EntityImage
        src={getPulseImageUrl(image)}
        alt={title}
        entityType="article"
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
      {showSourceBadge && (
        <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-950/80 dark:text-slate-100">
          {source}
        </span>
      )}
    </div>
  );
}

export default async function ArticlesPulsePage() {
  const { latestArticles, latestBySpecialty, sources, totalArticles, totalSpecialties, totalSources, lastUpdated } =
    await getPulseData();

  const leadArticle = latestArticles[0] ?? null;
  const latestStack = latestArticles.slice(1, 13);
  const moreLatest = latestArticles.slice(13, 21);
  const specialtyLinks = latestBySpecialty.slice(0, 10);
  const rankedSources = [...sources].sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name, 'ar'));
  const sourceOverview = rankedSources.slice(0, 12);
  const contentTypeCards = [
    {
      title: 'خبر طبي سريع',
      description: 'مستجدات قصيرة وسريعة الالتقاط تربط القارئ بأهم التطورات اليومية في الصحة والوقاية.',
    },
    {
      title: 'تحديث علاجي',
      description: 'أخبار الأدوية واللقاحات والتقنيات الطبية مع توجيه سريع إلى الصفحات الداخلية المرتبطة.',
    },
    {
      title: 'دراسة وبحث',
      description: 'عناوين مبنية على أبحاث جديدة تساعد القارئ على متابعة ما يتغير في الأدلة الطبية.',
    },
    {
      title: 'توعية وقائية',
      description: 'محتوى يلفت الانتباه إلى الأعراض والمخاطر والوقاية ويقود القارئ إلى متابعة عملية أو فحص مناسب.',
    },
  ];
  const helpfulLinks = [
    {
      title: 'مقالاتنا الطبية',
      description: 'شروحات عربية مبسطة ومحتوى تحريري داخلي يكمّل الأخبار الخارجية.',
      href: '/articles',
    },
    {
      title: 'دليل الأدوية',
      description: 'ابحث عن الدواء والبدائل والأسعار بعد الاطلاع على آخر المستجدات الطبية.',
      href: '/drugs',
    },
    {
      title: 'المعامل والتحاليل',
      description: 'انتقل من الخبر إلى الخدمة العملية وابحث عن المعامل والتحاليل المناسبة.',
      href: '/labs',
    },
    {
      title: 'الدليل الطبي',
      description: 'استكشف الأطباء والعيادات والمستشفيات إذا كنت تريد متابعة أو استشارة.',
      href: '/directories',
    },
    {
      title: 'البحث الذكي داخل الموقع',
      description: 'ابحث عن المرض أو العرض أو اسم التخصص للانتقال من الخبر إلى الخدمة أو المقال المناسب.',
      href: '/search',
    },
  ];

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: sectionShortName,
    description: 'صفحة تجمع أحدث الأخبار الطبية من مصادر خارجية موثوقة مع تقسيم حسب التخصصات.',
    url: `${SITE_URL}${medicalBriefPath}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'مستشفى.كوم',
      url: SITE_URL,
    },
    inLanguage: 'ar',
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'أحدث الأخبار الطبية',
    itemListElement: latestArticles.slice(0, 15).map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}${getInternalPulseHref(article.id)}`,
      name: article.title,
    })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <section className="border-b border-slate-200/80 bg-gradient-to-br from-white via-rose-50/60 to-sky-50/70 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="container-custom py-10 md:py-14">
            <Card className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none md:p-8 lg:p-10">
              <div className="absolute inset-0">
                <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
                <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-black text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200">
                    <SparklesIcon className="h-4 w-4" />
                    أحدث ما يهم صحتك
                  </span>
                  <div>
                    <h1 className="text-2xl font-black leading-tight text-slate-900 dark:text-white md:text-4xl">
                      تابع أهم الأخبار الطبية العربية في مكان واحد وبشكل سريع وواضح
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                      إذا كنت تريد معرفة الجديد بدون التنقل بين مواقع كثيرة، فستجد هنا أبرز موضوعات القلب
                      والتغذية وصحة المرأة والأطفال والصحة النفسية وغيرها، مع ملخص سريع لكل خبر وروابط تكمل
                      رحلتك داخل الموقع أو توصلك إلى المصدر الأصلي.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/articles"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-700 hover:text-white"
                    >
                      مقالات تشرح لك أكثر
                      <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/drugs"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-900/50 dark:hover:text-primary-300"
                    >
                      دليل الأدوية
                    </Link>
                  </div>
                  {specialtyLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {specialtyLinks.map((specialty) => (
                        <a
                          key={specialty.id}
                          href={`#specialty-${specialty.id}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-900/50 dark:hover:text-primary-300"
                        >
                          {specialty.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: 'أخبار خارجية محدثة',
                      value: formatNumber(totalArticles),
                      icon: BookmarkSquareIcon,
                      tone: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
                    },
                    {
                      label: 'تخصصات مفعلة',
                      value: formatNumber(totalSpecialties),
                      icon: Squares2X2Icon,
                      tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
                    },
                    {
                      label: 'مصادر خارجية',
                      value: formatNumber(totalSources),
                      icon: GlobeAltIcon,
                      tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
                    },
                    {
                      label: 'آخر تحديث',
                      value: lastUpdated ? formatDate(lastUpdated).split('،')[0] : 'حديث',
                      icon: ClockIcon,
                      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-xl font-black text-slate-900 dark:text-white md:text-2xl">{item.value}</div>
                        <div className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="latest" className="container-custom py-8 md:py-12">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">الآن في {sectionShortName}</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    أحدث ما التقطناه من المصادر الطبية العربية الخارجية.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  تحديث {lastUpdated ? formatDate(lastUpdated) : 'مستمر'}
                </span>
              </div>

              {leadArticle ? (
                <Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900" padding="none">
                  <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                    <Link href={getInternalPulseHref(leadArticle.id)} className="relative min-h-[280px] bg-slate-100 dark:bg-slate-800">
                      <PulseImage
                        title={leadArticle.title}
                        image={leadArticle.image}
                        source={leadArticle.source}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    </Link>
                    <div className="flex flex-col justify-between p-6 md:p-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            {getSpecialtyConfig(leadArticle.specialtyId).title}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {leadArticle.source}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            عربي
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                            {getPulseContentType(leadArticle).label}
                          </span>
                        </div>
                        <Link href={getInternalPulseHref(leadArticle.id)}>
                          <h3 className="mt-4 text-2xl font-black leading-tight text-slate-900 transition hover:text-primary-700 dark:text-white dark:hover:text-primary-300">
                            {leadArticle.title}
                          </h3>
                        </Link>
                        <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
                          {leadArticle.summary}
                        </p>
                        <p className="mt-3 text-sm font-semibold leading-7 text-slate-500 dark:text-slate-400">
                          {getPulseContentType(leadArticle).description}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                          <ClockIcon className="h-4 w-4" />
                          {formatDate(leadArticle.publishedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                          <GlobeAltIcon className="h-4 w-4" />
                          {leadArticle.source}
                        </span>
                        <a
                          href={leadArticle.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-primary-700 transition hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          قراءة من المصدر
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </a>
                        <Link
                          href={getInternalPulseHref(leadArticle.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        >
                          صفحة داخلية للخبر
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="rounded-[2rem] p-8 text-center">
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    تعذر تحميل الأخبار الخارجية حاليًا. أعد المحاولة بعد قليل.
                  </p>
                </Card>
              )}

              {latestStack.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {latestStack.map((article) => (
                    <Link key={article.id} href={getInternalPulseHref(article.id)}>
                      <Card
                        variant="hover"
                        className="h-full overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900"
                        padding="none"
                      >
                        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
                          <PulseImage
                            title={article.title}
                            image={article.image}
                            source={article.source}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            showSourceBadge={false}
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              {getSpecialtyConfig(article.specialtyId).title}
                            </span>
                            <span>{article.source}</span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                              {getPulseContentType(article).label}
                            </span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-900 dark:text-white">{article.title}</h3>
                          <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {article.summary}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {leadArticle && latestBySpecialty.slice(0, 2).length > 0 && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">تخصصات سريعة</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        أبرز المسارات الأكثر نشاطًا في آخر التحديثات.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {latestBySpecialty.slice(0, 2).map((specialty) => (
                      <div key={specialty.id} className={`rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br p-5 dark:border-slate-800 ${specialty.tone}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{specialty.title}</h4>
                            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                              {specialty.description}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${specialty.badgeTone}`}>
                            {formatNumber(specialty.items.length)} خبر
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card
                id="content-types"
                className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">أنواع المحتوى داخل التغطية</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    تصنيف مبسط يساعد القارئ على فهم طبيعة المادة قبل فتح الخبر الكامل.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {contentTypeCards.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="text-sm font-black text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {latestBySpecialty.length > 0 && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">أهم التصنيفات الآن</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        اختر التخصص الأقرب لاهتمامك وابدأ مباشرة من أكثر المسارات نشاطًا اليوم.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      من داخل {sectionShortName}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {latestBySpecialty.slice(0, 4).map((specialty) => (
                      <a
                        key={specialty.id}
                        href={`#specialty-${specialty.id}`}
                        className={`block rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:border-primary-200 dark:border-slate-800 ${specialty.tone}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">{specialty.title}</h4>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${specialty.badgeTone}`}>
                            {formatNumber(specialty.items.length)} خبر
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {specialty.description}
                        </p>
                        <div className="mt-4 text-xs font-black text-primary-700 dark:text-primary-300">
                          افتح موجز {specialty.title}
                        </div>
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card
                id="sources"
                className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">المصادر المتابعة الآن</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      مصادر عربية خارجية تتجدد تلقائيًا وتغذي {sectionShortName}.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                    عربي + خارجي
                  </span>
                </div>
                <div className="space-y-3">
                  {sourceOverview.map((source) => (
                    <a
                      key={source.id}
                      href={source.homeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-black text-slate-900 dark:text-white">{source.name}</div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                source.itemCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                              }`}
                            >
                              {source.itemCount > 0 ? 'نشط الآن' : 'قيد التحديث'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{source.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {formatNumber(source.itemCount)}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">ابدأ من هنا</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    ثلاث طرق بسيطة تساعدك على الاستفادة من الموجز بسرعة.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    'ابدأ بالخبر الأبرز لمعرفة آخر تحديث مع نوع المحتوى.',
                    'استخدم بطاقات التخصص للوصول السريع إلى المجال الطبي الأقرب لاهتمامك.',
                    'راجع قائمة المصادر لمعرفة المنصات النشطة أو التي تنتظر تحديثًا جديدًا.',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              {moreLatest.length > 0 && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">موجز سريع</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      انتقال سريع بين العناوين الطبية الأحدث مع صفحات داخلية بدل التحويل الفوري.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {moreLatest.map((article) => (
                      <Link
                        key={article.id}
                        href={getInternalPulseHref(article.id)}
                        className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {article.source} • {formatDate(article.publishedAt)}
                            </div>
                            <h4 className="mt-1 line-clamp-2 text-base font-black text-slate-900 dark:text-white">
                              {article.title}
                            </h4>
                            <div className="mt-2 text-xs font-black text-amber-700 dark:text-amber-200">
                              {getPulseContentType(article).label}
                            </div>
                          </div>
                          <ArrowLeftIcon className="h-5 w-5 shrink-0 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">بعد الخبر ماذا تقرأ؟</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    اختر الخطوة التالية التي تساعدك على فهم الموضوع أكثر أو الوصول إلى خدمة مرتبطة به.
                  </p>
                </div>
                <div className="space-y-3">
                  {helpfulLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                    >
                      <div className="text-base font-black text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </Card>

              {leadArticle && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">ماذا يمكنك أن تفعل بعد هذا الخبر؟</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      افتح روابط سريعة تساعدك على المتابعة والبحث والوصول إلى الشرح أو الخدمة الأقرب لما قرأته الآن.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {getHelpfulLinksForArticle(leadArticle).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                      >
                        <div className="text-base font-black text-slate-900 dark:text-white">{item.title}</div>
                        <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>

        {latestBySpecialty.length > 0 && (
          <section id="specialties" className="container-custom pb-8 md:pb-12">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{sectionShortName} حسب التخصص</h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  قنوات طبية مصغرة تجمع الأخبار العربية الخارجية الأحدث لكل تخصص.
                </p>
              </div>
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">اختر تخصصك وابدأ القراءة</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {latestBySpecialty.slice(0, 6).map((specialty) => (
                <Card
                  key={specialty.id}
                  id={`specialty-${specialty.id}`}
                  className={`rounded-[2rem] border border-slate-200/70 bg-gradient-to-br p-6 dark:border-slate-800 ${specialty.tone}`}
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{specialty.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {specialty.description}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${specialty.badgeTone}`}>
                      {formatNumber(specialty.items.length)} خبر
                    </span>
                  </div>

                  <div className="space-y-3">
                    {specialty.items.map((article) => (
                      <Link
                        key={article.id}
                        href={getInternalPulseHref(article.id)}
                        className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-primary-900/40 dark:hover:bg-slate-900"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <PulseImage
                            title={article.title}
                            image={article.image}
                            source={article.source}
                            sizes="80px"
                            showSourceBadge={false}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {article.source} • عربي
                          </div>
                          <h4 className="mt-1 line-clamp-2 text-base font-black text-slate-900 dark:text-white">
                            {article.title}
                          </h4>
                          <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {article.summary}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span className="text-amber-700 dark:text-amber-200">{getPulseContentType(article).label}</span>
                            <span>•</span>
                            <span>{formatDate(article.publishedAt)}</span>
                            <span>•</span>
                            <span>صفحة داخلية ثم المصدر الأصلي</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="container-custom pb-12 md:pb-16">
          <Card className="rounded-[2.5rem] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-primary-50/60 p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:shadow-none md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white md:text-3xl">
                  لماذا هذا القسم مفيد للمستخدم؟
                </h2>
                <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                  لأنه يختصر عليك الوقت: بدل التنقل بين عدة مواقع طبية، تحصل هنا على موجز عربي واحد منظم حسب
                  التخصص مع صفحة داخلية لكل خبر، ثم تنتقل إلى المصدر الأصلي أو تكمل رحلتك داخل أقسام مستشفى.كوم
                  المرتبطة بالموضوع.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-700 hover:text-white"
                  >
                    اقرأ مقالاتنا أيضًا
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-primary-200 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-900/50 dark:hover:text-primary-300"
                  >
                    ابحث في الموقع
                  </Link>
                </div>
              </div>
              <div className="grid gap-3">
                {faqItems.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-[1.5rem] border border-slate-200/70 bg-white/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">{item.question}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}
