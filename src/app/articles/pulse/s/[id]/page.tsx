import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  ShareIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import AdSensePlacement from '@/components/shared/AdSensePlacement';
import { Card } from '@/components/ui/Card';
import { EntityImage } from '@/components/ui/EntityImage';
import {
  SITE_URL,
  defaultArticleImage,
  getHelpfulLinksForArticle,
  getPulseContentType,
  getInternalPulseHref,
  getPulseArticleById,
  getPulseData,
  getPulseImageUrl,
  getPulseStaticParams,
  getRelatedPulseArticles,
  getSpecialtyConfig,
  medicalBriefPath,
  pulseRevalidate,
} from '../../lib';

export const revalidate = pulseRevalidate;
export const dynamicParams = true;
const sectionShortName = 'الموجز الطبي';

interface PageProps {
  params: Promise<{ id: string }>;
}

const dateFormatter = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long', timeStyle: 'short' });

function formatDate(value: Date | null | undefined) {
  if (!value) return 'تحديث حديث';
  return dateFormatter.format(value);
}

function calculateReadingTime(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

function buildShareLinks(title: string, url: string) {
  const text = encodeURIComponent(`${title} - ${url}`);
  const encodedUrl = encodeURIComponent(url);

  return [
    {
      title: 'واتساب',
      href: `https://wa.me/?text=${text}`,
    },
    {
      title: 'فيسبوك',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      title: 'تيليجرام',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`,
    },
  ];
}

function trimText(value: string, maxLength = 120) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function getSourceHost(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}

function getSummaryHighlights(summary: string) {
  const normalized = summary.replace(/[؛:]/g, '.').replace(/…/g, '.');
  const parts = normalized
    .split(/[.!؟]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);

  if (parts.length > 0) {
    return parts.slice(0, 3).map((part) => trimText(part, 110));
  }

  const words = summary.split(/\s+/).filter(Boolean);
  return [words.slice(0, 12).join(' '), words.slice(12, 24).join(' '), words.slice(24, 36).join(' ')]
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => trimText(part, 110));
}

function buildInsightCards(article: { summary: string; categories: string[] }, specialty: { title: string; description: string; searchHint: string }) {
  const highlights = getSummaryHighlights(article.summary);

  return [
    {
      title: 'محور الخبر',
      content: highlights[0] || `يركز الخبر على مستجدات ${specialty.title} وما يرتبط بها من متابعة وقائية أو علاجية.`,
    },
    {
      title: 'السياق الطبي',
      content: trimText(`${specialty.title}: ${specialty.description}`, 120),
    },
    {
      title: 'كلمات مفتاحية',
      content: article.categories.slice(0, 4).join(' • ') || specialty.searchHint,
    },
  ];
}

function buildFollowUpPrompts(article: { categories: string[] }, specialty: { title: string; searchHint: string }) {
  return [
    `ما دلالة هذا المستجد على ${specialty.title} في الممارسة اليومية؟`,
    `متى يحتاج القارئ للانتقال من الخبر إلى استشارة أو فحص مرتبط بـ ${specialty.searchHint}؟`,
    article.categories[0]
      ? `ما أحدث الشروحات الداخلية لدينا حول ${article.categories[0]}؟`
      : `ما المقالات والأدلة الداخلية التي تكمل هذا الخبر؟`,
  ];
}

function buildPracticalNotes(
  article: { summary: string; categories: string[] },
  specialty: { title: string; searchHint: string },
  contentType: { label: string; description: string },
) {
  const highlights = getSummaryHighlights(article.summary);

  return [
    {
      title: 'نوع المحتوى',
      content: `${contentType.label}: ${contentType.description}`,
    },
    {
      title: 'لماذا يهم القارئ؟',
      content: highlights[1] || `لأنه يرتبط مباشرة بمتابعة ${specialty.title} وما يحتاجه القارئ من وعي أو وقاية أو متابعة.`,
    },
    {
      title: 'ما الذي تتابعه بعده؟',
      content: article.categories[0]
        ? `ابحث عن ${article.categories[0]} أو عن ${specialty.searchHint} داخل الموقع للوصول إلى شروحات وفحوصات وأدلة مرتبطة.`
        : `انتقل من هذا الخبر إلى البحث عن ${specialty.searchHint} داخل الموقع لاستكمال الصورة الطبية بخيارات عملية.`,
    },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getPulseArticleById(id);

  if (!article) {
    return {
      title: `الخبر غير موجود | ${sectionShortName}`,
      robots: { index: false, follow: false },
    };
  }

  const pageUrl = `${SITE_URL}${getInternalPulseHref(article.id)}`;
  const specialty = getSpecialtyConfig(article.specialtyId);
  const imageUrl = article.image ? `${SITE_URL}${getPulseImageUrl(article.image)}` : `${SITE_URL}${defaultArticleImage}`;

  return {
    title: `${article.title} | ${sectionShortName} | مستشفى.كوم`,
    description: article.summary,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      url: pageUrl,
      images: [imageUrl],
      locale: 'ar_AR',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.source],
      section: specialty.title,
      tags: article.categories,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [imageUrl],
    },
  };
}

export async function generateStaticParams() {
  return getPulseStaticParams();
}

export default async function PulseArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const article = await getPulseArticleById(id);

  if (!article) {
    notFound();
  }

  const data = await getPulseData();
  const specialty = getSpecialtyConfig(article.specialtyId);
  const pageUrl = `${SITE_URL}${getInternalPulseHref(article.id)}`;
  const imageUrl = article.image ? `${SITE_URL}${getPulseImageUrl(article.image)}` : `${SITE_URL}${defaultArticleImage}`;
  const readingTime = calculateReadingTime(`${article.title} ${article.summary} ${article.categories.join(' ')}`);
  const relatedArticles = getRelatedPulseArticles(data, article, 5);
  const sameSpecialtyArticles =
    data.latestBySpecialty.find((item) => item.id === article.specialtyId)?.items.filter((item) => item.id !== article.id).slice(0, 5) ||
    [];
  const activeSources = [...data.sources]
    .filter((item) => item.itemCount > 0)
    .sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name, 'ar'))
    .slice(0, 6);
  const helpfulLinks = getHelpfulLinksForArticle(article);
  const shareLinks = buildShareLinks(article.title, pageUrl);
  const insightCards = buildInsightCards(article, specialty);
  const followUpPrompts = buildFollowUpPrompts(article, specialty);
  const contentType = getPulseContentType(article);
  const sourceHost = getSourceHost(article.link);
  const practicalNotes = buildPracticalNotes(article, specialty, contentType);

  const breadcrumbItems = [
    { label: 'الرئيسية', href: '/' },
    { label: sectionShortName, href: medicalBriefPath },
    { label: article.title },
  ];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: [imageUrl],
    inLanguage: 'ar',
    datePublished: article.publishedAt?.toISOString() || undefined,
    dateModified: article.publishedAt?.toISOString() || undefined,
    mainEntityOfPage: pageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'مستشفى.كوم',
      url: SITE_URL,
    },
    isBasedOn: article.link,
    about: [
      {
        '@type': 'Thing',
        name: specialty.title,
      },
      ...article.categories.slice(0, 6).map((category) => ({
        '@type': 'Thing',
        name: category,
      })),
    ],
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container-custom py-8 md:py-10">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <article className="space-y-6">
              <Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900" padding="none">
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 sm:aspect-[16/10] lg:aspect-[16/9]">
                  <EntityImage
                    src={getPulseImageUrl(article.image)}
                    alt={article.title}
                    entityType="article"
                    fill
                    priority
                    sizes="(max-width: 1200px) 100vw, 70vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                  <div className="absolute bottom-5 right-5 hidden flex-wrap gap-2 md:flex">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800 dark:bg-slate-950/85 dark:text-white">
                      {specialty.title}
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800 dark:bg-slate-950/85 dark:text-white">
                      {article.source}
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-amber-700 dark:bg-slate-950/85 dark:text-amber-200">
                      {contentType.label}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-[11px] font-black text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {specialty.title}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {article.source}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                      {contentType.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black text-slate-500 dark:text-slate-400 sm:gap-3 sm:text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                      <GlobeAltIcon className="h-4 w-4" />
                      {article.source}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                      {readingTime} دقيقة قراءة
                    </span>
                  </div>

                  <h1 className="mt-5 text-xl font-black leading-tight text-slate-900 dark:text-white sm:text-2xl md:text-4xl">
                    {article.title}
                  </h1>

                  <p className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-slate-50 px-4 py-4 text-sm leading-8 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 sm:px-5 sm:text-base">
                    {article.summary}
                  </p>

                  <div className="mt-4 rounded-[1.5rem] border border-amber-200/60 bg-amber-50/70 px-4 py-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <div className="text-sm font-black text-slate-900 dark:text-white">نوع المحتوى</div>
                    <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">{contentType.description}</p>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {insightCards.map((item) => (
                      <Card
                        key={item.title}
                        className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="text-sm font-black text-slate-900 dark:text-white">{item.title}</div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.content}</p>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {practicalNotes.map((item) => (
                      <Card
                        key={item.title}
                        className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="text-sm font-black text-slate-900 dark:text-white">{item.title}</div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.content}</p>
                      </Card>
                    ))}
                  </div>

                  <AdSensePlacement
                    placementKey="article_after_excerpt"
                    fallbackSlot="7841529630"
                    className="my-8"
                    label="إعلان"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <ShareIcon className="h-4 w-4" />
                        مشاركة الخبر
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {shareLinks.map((item) => (
                          <a
                            key={item.title}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-700 dark:hover:text-primary-300"
                          >
                            {item.title}
                          </a>
                        ))}
                      </div>
                    </Card>

                    <Card className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <TagIcon className="h-4 w-4" />
                        الوسوم والتصنيف
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-black text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {specialty.title}
                        </span>
                        {article.categories.slice(0, 6).map((category) => (
                          <span
                            key={category}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">المصدر الأصلي للخبر</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      هذه الصفحة تعرض لك مقتطفًا عربيًا منظمًا مع بيانات مساعدة، بينما القراءة الكاملة تبقى من حق
                      الناشر الأصلي عبر موقعه الرسمي.
                    </p>
                  </div>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-primary-700 hover:text-white sm:w-auto sm:shrink-0"
                  >
                    اقرأ الخبر كاملًا
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="text-xs font-black text-slate-500 dark:text-slate-400">المصدر</div>
                    <div className="mt-1 text-base font-black text-slate-900 dark:text-white">{article.source}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="text-xs font-black text-slate-500 dark:text-slate-400">الموقع الأصلي</div>
                    <div className="mt-1 break-all text-base font-black text-slate-900 dark:text-white">{sourceHost}</div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-black text-primary-700 transition hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      افتح رابط المصدر
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">أسئلة متابعة مفيدة</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    نقاط سريعة تساعد القارئ على تحويل الخبر إلى خطوات قراءة أو بحث عملية.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {followUpPrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">اكمل الرحلة داخل الموقع</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    روابط ذكية مرتبطة بتخصص الخبر لتبقي المستخدم داخل المنظومة الطبية للموقع.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {helpfulLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                    >
                      <div className="text-base font-black text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </Card>

              <AdSensePlacement
                placementKey="article_bottom"
                fallbackSlot="7841529630"
                className="my-2"
                label="إعلان"
              />
            </article>

            <aside className="space-y-6">
              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">ملف الخبر</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    ملخص سريع يملأ العمود الجانبي بمعلومات أساسية على الديسكتوب.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'نوع المحتوى', value: contentType.label },
                    { label: 'التخصص', value: specialty.title },
                    { label: 'المصدر', value: article.source },
                    { label: 'الموقع', value: sourceHost },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.25rem] border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="text-xs font-black text-slate-500 dark:text-slate-400">{item.label}</div>
                      <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {sameSpecialtyArticles.length > 0 && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">في نفس التخصص الآن</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      أخبار إضافية داخل {specialty.title} لزيادة كثافة القراءة على نفس الصفحة.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {sameSpecialtyArticles.map((item) => (
                      <Link
                        key={item.id}
                        href={getInternalPulseHref(item.id)}
                        className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                      >
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.source} • {formatDate(item.publishedAt)}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-black text-slate-900 dark:text-white">{item.title}</div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">أخبار ذات صلة في {sectionShortName}</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    صفحة داخلية لكل خبر قبل الانتقال إلى مصدره الأصلي.
                  </p>
                </div>
                <div className="space-y-3">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={getInternalPulseHref(item.id)}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-3 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <EntityImage
                          src={getPulseImageUrl(item.image)}
                          alt={item.title}
                          entityType="article"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.source} • {formatDate(item.publishedAt)}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-black text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>

              {activeSources.length > 0 && (
                <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">المصادر الطبية النشطة</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      مصادر نراقبها باستمرار لتغذية {sectionShortName} بموضوعات عربية أكثر.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {activeSources.map((source) => (
                      <a
                        key={source.id}
                        href={source.homeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200/70 bg-slate-50/80 px-4 py-3 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-black text-slate-900 dark:text-white">{source.name}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">محتوى طبي متجدد</div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          {source.itemCount}
                        </span>
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="rounded-[2rem] border border-slate-200/70 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">رجوع سريع</h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    انتقل لباقي موجز الأخبار أو استكشف مقالات الموقع.
                  </p>
                </div>
                <div className="space-y-3">
                  <Link
                    href={medicalBriefPath}
                    className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                  >
                    <div className="text-base font-black text-slate-900 dark:text-white">ارجع إلى {sectionShortName}</div>
                    <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      تصفح آخر الأخبار العربية حسب التخصصات والمصادر.
                    </p>
                  </Link>
                  <Link
                    href="/articles"
                    className="block rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-primary-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-primary-900/40 dark:hover:bg-slate-800"
                  >
                    <div className="text-base font-black text-slate-900 dark:text-white">مقالات مستشفى.كوم</div>
                    <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      اقرأ الشروحات الداخلية العربية لتكملة الخبر بخلفية أوضح.
                    </p>
                  </Link>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
