import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Suspense } from 'react';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';
import type { Metadata } from 'next';
import { syncYoutubeVideosOnce } from '@/lib/youtube/youtubeSync';
import FeaturedVideoSpotlight from './FeaturedVideoSpotlight';
import MedicalVideosGrid from './MedicalVideosGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'الفيديوهات الطبية | مستشفى.كوم',
  description:
    'فيديوهات طبية قصيرة ومفيدة تساعدك على الفهم السريع والمتابعة اليومية، مع تحديث تلقائي من قناة يوتيوب وربط مباشر بالمقالات والأدلة الطبية.',
  openGraph: {
    title: 'الفيديوهات الطبية | مستشفى.كوم',
    description:
      'استكشف مكتبة فيديوهات طبية: بحث سريع، تصفية حسب مدة الفيديو، وربط بالمقالات والأدلة الطبية المهمة.',
  },
};

type SeededRandom = () => number;

const hashStringToSeed = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number): SeededRandom => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T,>(items: T[], rng: SeededRandom) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

type LengthFilter = 'all' | 'short' | 'medium' | 'long';

type SortOption = 'latest' | 'shortest';

function resolveLengthFilter(value?: string | string[]): LengthFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 'all';
  if (raw === 'short' || raw === 'medium' || raw === 'long') return raw;
  return 'all';
}

function resolveSort(value?: string | string[]): SortOption {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'shortest') return 'shortest';
  return 'latest';
}

async function getMedicalVideosData({
  q,
  length,
  sort,
}: {
  q?: string;
  length: LengthFilter;
  sort: SortOption;
}) {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (channelId) {
    await syncYoutubeVideosOnce(channelId, 24);
  }

  const baseWhere: Record<string, any> = {};
  if (channelId) {
    baseWhere.channelId = channelId;
  }

  const searchTerm = (q ?? '').trim();
  const where: Record<string, any> = { ...baseWhere };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm } },
      { description: { contains: searchTerm } },
      { channelTitle: { contains: searchTerm } },
    ];
  }

  const durationWhere: Record<string, any> = {};
  if (length === 'short') {
    durationWhere.durationSec = { lte: 5 * 60 };
  }
  if (length === 'medium') {
    durationWhere.durationSec = { gt: 5 * 60, lte: 10 * 60 };
  }
  if (length === 'long') {
    durationWhere.durationSec = { gt: 10 * 60 };
  }
  if (Object.keys(durationWhere).length) {
    Object.assign(where, durationWhere);
  }

  const orderBy =
    sort === 'shortest'
      ? [{ durationSec: 'asc' as const }, { publishedAt: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }];

  const [totalVideos, shortVideos, filteredVideos, videos, syncState] = await Promise.all([
    prisma.youtubeVideo.count({ where: baseWhere }),
    prisma.youtubeVideo.count({ where: { ...baseWhere, durationSec: { lte: 5 * 60 } } }),
    prisma.youtubeVideo.count({ where }),
    prisma.youtubeVideo.findMany({
      where,
      orderBy,
      take: 24,
    }),
    channelId ? prisma.youtubeSyncState.findUnique({ where: { channelId } }) : null,
  ]);

  const articlesRaw = await prisma.article.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      publishedAt: true,
      createdAt: true,
      category: { select: { nameAr: true, slug: true } },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 18,
  });

  const today = new Date();
  const dayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(
    today.getUTCDate()
  ).padStart(2, '0')}`;
  const rng = mulberry32(hashStringToSeed(dayKey));
  const randomArticles = seededShuffle(articlesRaw, rng).slice(0, 6);

  return {
    channelId,
    totalVideos,
    shortVideos,
    filteredVideos,
    videos,
    syncState,
    randomArticles,
  };
}

export default async function MedicalVideosPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[]; length?: string | string[]; sort?: string | string[] };
}) {
  const q = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const length = resolveLengthFilter(searchParams?.length);
  const sort = resolveSort(searchParams?.sort);

  const data = await getMedicalVideosData({ q, length, sort });

  const headerSubtitle = data.channelId
    ? 'فيديوهات طبية قصيرة ومفيدة يتم تحديثها تلقائياً من قناة يوتيوب.'
    : 'فيديوهات طبية قصيرة ومفيدة (تأكد من ضبط YOUTUBE_CHANNEL_ID لعرض أحدث الفيديوهات).';

  const headerCounters: HeaderCounterConfig[] = [];

  const quickFilters = [
    { id: 'all', label: 'الكل', href: '/medical-videos' },
    { id: 'short', label: 'قصيرة', href: '/medical-videos?length=short' },
    { id: 'medium', label: 'متوسطة', href: '/medical-videos?length=medium' },
    { id: 'long', label: 'طويلة', href: '/medical-videos?length=long' },
    { id: 'articles', label: 'مقالات', href: '/medical-videos#articles' },
  ];

  const lastSyncText =
    data.syncState?.lastSuccessAt
      ? new Date(data.syncState.lastSuccessAt).toLocaleString('ar-EG')
      : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-blue-50/20 dark:from-neutral-950 dark:via-purple-950/10 dark:to-blue-950/10">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="medicalVideos"
            title="الفيديوهات الطبية على سطر واحد"
            subtitle={headerSubtitle}
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={data.filteredVideos}
            resultsLabel="فيديو"
            showResultsCount
            showViewToggle={false}
            showVoiceSearch
            showMapButton={false}
            searchPlaceholder="ابحث داخل الفيديوهات..."
            searchParamKey="q"
            searchAction="/medical-videos"
            resetPageOnSearch={false}
            useBannerText
            titleClassName="whitespace-nowrap text-[clamp(1.6rem,6vw,2.9rem)] max-w-full"
            className="mb-10"
          />
        </Suspense>

        <div className="container-custom pb-12">
          <Breadcrumb items={[{ label: 'الفيديوهات الطبية' }]} className="mb-6" />

          <section className="mb-12">
            <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/60 md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
              <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-200">مكتبة فيديوهات مريحة وسريعة</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-3 leading-tight">
                    اختصر وقتك ووصل للمعلومة بسرعة
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-2xl">
                    اختر موضوعك، شاهد فيديو واضح ومباشر، ثم انتقل للمقال أو الدليل إذا احتجت تفاصيل أكثر.
                  </p>
                  {lastSyncText && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">آخر تحديث: {lastSyncText}</p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                    <Link
                      href="/medical-videos?length=short"
                      className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
                    >
                      مشاهدة سريعة
                    </Link>
                    <Link
                      href="/medical-info"
                      className="px-5 py-2.5 rounded-full border border-indigo-200/80 text-indigo-700 dark:text-indigo-200 font-semibold hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
                    >
                      معلومات مكتوبة
                    </Link>
                    <Link
                      href="/directories"
                      className="px-5 py-2.5 rounded-full border border-indigo-200/80 text-indigo-700 dark:text-indigo-200 font-semibold hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
                    >
                      أدلة وخدمات
                    </Link>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Card className="border border-indigo-200/50 bg-white/90 dark:border-white/10 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">إجمالي الفيديوهات</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {data.totalVideos.toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <span className="text-3xl">🎬</span>
                    </div>
                  </Card>
                  <Card className="border border-emerald-200/50 bg-white/90 dark:border-white/10 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">فيديوهات قصيرة</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {data.shortVideos.toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <span className="text-3xl">⚡</span>
                    </div>
                  </Card>
                  <Card className="border border-sky-200/50 bg-white/90 dark:border-white/10 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-sky-600 dark:text-sky-300">نتائج البحث</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {data.filteredVideos.toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <span className="text-3xl">🔍</span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          <FeaturedVideoSpotlight videos={data.videos} />

          <section className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مكتبة الفيديوهات</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {data.videos.length ? `عرض ${data.videos.length} فيديو في هذه الصفحة` : 'لا توجد فيديوهات متاحة حالياً.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/medical-videos?${new URLSearchParams({ ...(q ? { q } : {}), ...(length !== 'all' ? { length } : {}), sort: 'latest' }).toString()}`}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    sort === 'latest'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-white/10 hover:border-indigo-200'
                  }`}
                >
                  الأحدث
                </Link>
                <Link
                  href={`/medical-videos?${new URLSearchParams({ ...(q ? { q } : {}), ...(length !== 'all' ? { length } : {}), sort: 'shortest' }).toString()}`}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    sort === 'shortest'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-white/10 hover:border-indigo-200'
                  }`}
                >
                  الأقصر
                </Link>
              </div>
            </div>

            <MedicalVideosGrid videos={data.videos} />

            {!data.videos.length && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                لا توجد فيديوهات متاحة حالياً.
              </div>
            )}
          </section>

          <section id="articles" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مقالات عشوائية مرتبطة</h2>
                <p className="text-slate-600 dark:text-slate-300">محتوى متجدد لتكملة الفيديوهات بالمعلومة المكتوبة.</p>
              </div>
              <Link href="/articles" className="text-primary-600 hover:underline">
                عرض كل المقالات
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.randomArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="block">
                  <Card variant="hover" className="h-full overflow-hidden">
                    <EntityCardImage src={article.image} alt={article.title} entityType="article" entityId={article.id} />
                    <div className="p-4">
                      {article.category?.nameAr && (
                        <Badge variant="secondary" size="sm" className="mb-2">
                          {article.category.nameAr}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        {article.excerpt || 'اقرأ المزيد من المعلومات والنصائح الطبية.'}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {!data.randomArticles.length && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">لا توجد مقالات متاحة حالياً.</div>
            )}
          </section>

          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">روابط مهمة</h2>
              <p className="text-slate-600 dark:text-slate-300">انتقل بسرعة إلى أهم صفحات الموقع.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'المعلومات الطبية',
                  description: 'مكتبة معرفية تجمع المقالات والإرشادات والأدلة الطبية.',
                  href: '/medical-info',
                  icon: '🧠',
                },
                {
                  title: 'الأدلة الطبية',
                  description: 'المستشفيات، العيادات، المعامل، الصيدليات، التمريض، والأدوية.',
                  href: '/directories',
                  icon: '📚',
                },
                {
                  title: 'الطوارئ الطبية',
                  description: 'أرقام مهمة ومقالات إسعافات أولية ومستشفيات طوارئ.',
                  href: '/emergency',
                  icon: '🚑',
                },
                {
                  title: 'الأدوات الطبية',
                  description: 'حاسبات ومتتبعات صحية تساعدك على المتابعة اليومية.',
                  href: '/tools',
                  icon: '🧰',
                },
                {
                  title: 'البحث العام',
                  description: 'ابحث عن خدمة أو معلومة طبية في كل أقسام الموقع.',
                  href: '/search',
                  icon: '🔎',
                },
                {
                  title: 'تواصل معنا',
                  description: 'اقتراحات، شكاوى، أو شراكات طبية.',
                  href: '/contact',
                  icon: '☎️',
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  <Card variant="hover" className="h-full">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{item.icon}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <Card className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30" padding="lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center dark:bg-yellow-500/20 dark:text-yellow-200">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-1">تنبيه طبي</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    الفيديوهات للتثقيف العام ولا تغني عن استشارة الطبيب المختص. عند وجود أعراض مقلقة أو حالة طارئة،
                    يرجى التوجه للطوارئ فوراً.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
