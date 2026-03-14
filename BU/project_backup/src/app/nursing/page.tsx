import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Suspense } from 'react';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage, EntityThumbnail } from '@/components/ui/EntityImage';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دليل التمريض المنزلي | مستشفى.كوم',
  description:
    'دليل شامل لخدمات التمريض المنزلي في مصر: مقدمي خدمات التمريض عبر الصيدليات، فرق التمريض المتخصصة، نصائح تمريضية، ومقالات متجددة.',
  openGraph: {
    title: 'دليل التمريض المنزلي | مستشفى.كوم',
    description:
      'استكشف خدمات التمريض المنزلية في مصر مع مقدمي الخدمة والنصائح العملية والمقالات المتخصصة.',
  },
};

const fallbackNursingServices = [
  {
    title: 'رعاية كبار السن',
    description: 'متابعة مستمرة لكبار السن مع تنظيم الأدوية والخطط العلاجية.',
    icon: '🧓',
  },
  {
    title: 'رعاية ما بعد العمليات',
    description: 'تغيير الضمادات ومتابعة التئام الجروح بإشراف متخصص.',
    icon: '🏥',
  },
  {
    title: 'العلاج الطبيعي المنزلي',
    description: 'جلسات تأهيلية لتحسين الحركة وتقوية العضلات.',
    icon: '🧘',
  },
  {
    title: 'الحقن والمحاليل',
    description: 'تنفيذ بروتوكولات الحقن الوريدي والعضلي بأمان.',
    icon: '💉',
  },
  {
    title: 'متابعة العلامات الحيوية',
    description: 'قياس الضغط والسكر ومعدلات الأكسجين بشكل دوري.',
    icon: '📈',
  },
  {
    title: 'رعاية الأطفال وحديثي الولادة',
    description: 'متابعة صحية دقيقة للأطفال مع دعم للأمهات.',
    icon: '👶',
  },
];

type PharmacyWithLocation = Prisma.PharmacyGetPayload<{
  include: { governorate: true; city: true };
}>;

const fallbackNursingTeams = [
  {
    title: 'فريق تمريض العناية المركزة',
    description: 'متخصص في الحالات الحرجة ومتابعة الأجهزة الحيوية.',
    icon: '🩺',
  },
  {
    title: 'طاقم تمريض متابعة الأمراض المزمنة',
    description: 'إرشادات مستمرة للسكري والضغط وأمراض القلب.',
    icon: '❤️',
  },
  {
    title: 'ممرضون للعناية المنزلية اليومية',
    description: 'مساعدة في الأنشطة اليومية وتغيير الضمادات.',
    icon: '🏡',
  },
];

const fallbackNursingTips = [
  {
    title: 'التزم بخطة الدواء',
    content: 'سجّل مواعيد الأدوية بدقة لتجنب تفويت أي جرعة.',
    icon: '🗓️',
  },
  {
    title: 'راقب العلامات الحيوية',
    content: 'دوّن قراءات الضغط والسكر وشاركها مع الطبيب.',
    icon: '🩸',
  },
  {
    title: 'حافظ على التعقيم',
    content: 'تأكد من تعقيم الأدوات قبل أي إجراء تمريضي.',
    icon: '🧼',
  },
  {
    title: 'التغذية المتوازنة',
    content: 'قدّم وجبات غنية بالبروتين والخضروات لدعم التعافي.',
    icon: '🥗',
  },
  {
    title: 'قيّم الألم باستمرار',
    content: 'اسأل المريض عن مستوى الألم لتعديل خطة الرعاية.',
    icon: '💬',
  },
  {
    title: 'التواصل مع الطبيب',
    content: 'شارك أي أعراض جديدة مع الطبيب أو فريق الرعاية.',
    icon: '📞',
  },
];

const pickRandomItems = <T,>(items: T[], count: number) => {
  if (items.length <= count) return items;
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
};

const extractServiceHighlights = (description?: string | null) => {
  if (!description) return [] as string[];
  return description
    .split(/[،,\n•-]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
};

async function getNursingData() {
  const nursingCategory = await prisma.articleCategory.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug: 'nursing-services' },
        { nameAr: { contains: 'تمريض' } },
        { nameEn: { contains: 'nursing' } },
      ],
    },
    select: { id: true, nameAr: true },
  });

  const pharmacyWhere: Prisma.PharmacyWhereInput = {
    status: 'published',
    OR: [
      { nameAr: { contains: 'تمريض' } },
      { nameEn: { contains: 'nursing' } },
      { descriptionAr: { contains: 'تمريض' } },
      { descriptionAr: { contains: 'منزلي' } },
    ],
  };

  const pharmacyTotalPromise = prisma.pharmacy.count({ where: pharmacyWhere });
  const pharmaciesPromise = prisma.pharmacy.findMany({
    where: pharmacyWhere,
    include: { governorate: true, city: true },
    orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
    take: 9,
  });
  const staffPromise = prisma.staff.findMany({
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
    orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
    take: 6,
  });
  const tipsPromise = prisma.healthTip.findMany({
    where: {
      isActive: true,
      ...(nursingCategory?.id ? { categoryId: nursingCategory.id } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 9,
  });
  const articlesPromise = prisma.article.findMany({
    where: {
      isPublished: true,
      ...(nursingCategory?.id ? { categoryId: nursingCategory.id } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      createdAt: true,
      category: { select: { nameAr: true, slug: true, color: true } },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 12,
  });

  const [pharmacyTotal, pharmaciesRaw, staffRaw, tipsRaw, articlesRaw] = await Promise.all([
    pharmacyTotalPromise,
    pharmaciesPromise,
    staffPromise,
    tipsPromise,
    articlesPromise,
  ]);

  let pharmacies: PharmacyWithLocation[] = pharmaciesRaw;
  if (pharmaciesRaw.length === 0) {
    pharmacies = await prisma.pharmacy.findMany({
      where: { status: 'published' },
      include: { governorate: true, city: true },
      orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
      take: 6,
    });
  }

  const pharmacyCount = pharmacyTotal || pharmacies.length;

  let articles = articlesRaw;
  if (articlesRaw.length === 0) {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        createdAt: true,
        category: { select: { nameAr: true, slug: true, color: true } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
  }

  return {
    nursingCategoryName: nursingCategory?.nameAr || 'الخدمات التمريضية',
    pharmacyTotal: pharmacyCount,
    pharmacies,
    staff: staffRaw,
    tipsRaw,
    articles,
  };
}

export default async function NursingDirectoryPage() {
  const data = await getNursingData();

  const nursingTips = data.tipsRaw.length
    ? data.tipsRaw.map((tip) => ({
        title: tip.titleAr,
        content: tip.contentAr,
        icon: tip.icon || '💡',
      }))
    : fallbackNursingTips;

  const nursingTeams = data.staff.length
    ? data.staff.map((member) => ({
        id: member.id,
        name: member.nameAr,
        title: member.title || 'أخصائي تمريض منزلي',
        experience: member.experience,
        rating: member.ratingAvg,
        image: member.image,
      }))
    : fallbackNursingTeams;

  const nursingArticles = pickRandomItems(data.articles, 6);
  const headerSubtitle =
    data.pharmacyTotal > 0
      ? `اختر من بين ${data.pharmacyTotal} مقدم تمريض منزلي وخبرات متخصصة للرعاية اليومية`
      : 'خدمات تمريض منزلي ونصائح رعاية مستمرة للأسرة بالكامل.';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'providers',
      label: 'مقدمو التمريض',
      value: data.pharmacyTotal,
      icon: 'group',
      color: '#10b981',
      isHighlighted: true,
    },
    {
      id: 'teams',
      label: 'فرق تمريض',
      value: nursingTeams.length,
      icon: 'heart',
      color: '#0ea5e9',
    },
    {
      id: 'tips',
      label: 'نصائح يومية',
      value: nursingTips.length,
      icon: 'check',
      color: '#22c55e',
    },
    {
      id: 'articles',
      label: 'مقالات تمريض',
      value: data.articles.length,
      icon: 'star',
      color: '#f59e0b',
    },
  ];

  const quickFilters = [
    {
      id: 'providers',
      label: 'مقدمو الخدمة',
      icon: 'group' as const,
      href: '/nursing#providers',
    },
    {
      id: 'teams',
      label: 'فرق التمريض',
      icon: 'heart' as const,
      href: '/nursing#teams',
    },
    {
      id: 'services',
      label: 'الخدمات',
      icon: 'check' as const,
      href: '/nursing#services',
    },
    {
      id: 'tips',
      label: 'نصائح يومية',
      icon: 'star' as const,
      href: '/nursing#tips',
    },
    {
      id: 'articles',
      label: 'مقالات التمريض',
      icon: 'building' as const,
      href: '/nursing#articles',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="nursing"
            title="دليل التمريض المنزلي"
            subtitle={headerSubtitle}
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={data.pharmacyTotal}
            showMapButton
            mapEntityTypes={['pharmacy']}
            mapTitle="خريطة مقدمي التمريض"
            mapSubtitle="استعرض مواقع مقدمي خدمات التمريض المنزلي"
            searchPlaceholder="ابحث عن خدمات تمريض منزلي أو فريق متخصص..."
            searchParamKey="q"
            searchAction="/search"
            resetPageOnSearch={false}
            showFilters={false}
            showViewToggle={false}
            gradientFrom="from-emerald-600"
            gradientTo="to-sky-500"
            className="mb-8"
          />
        </Suspense>
        <div className="container-custom pb-8">
          <Breadcrumb
            items={[{ label: 'الأدلة الطبية', href: '/directories' }, { label: 'دليل التمريض المنزلي' }]}
            className="mb-6"
          />

          <section className="bg-white rounded-2xl shadow-sm p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ابدأ خدمة التمريض المنزلي الآن</h2>
              <p className="text-sm text-gray-600">اختر مقدمي الخدمة الأقرب أو اطلع على أحدث النصائح التمريضية.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pharmacies?search=تمريض"
                className="px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
              >
                مقدمو الخدمة القريبون
              </Link>
              <Link
                href="/articles?category=nursing-services"
                className="px-5 py-2.5 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
              >
                مقالات التمريض
              </Link>
            </div>
          </section>

          <section id="providers" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">مقدمو التمريض عبر الصيدليات</h2>
                <p className="text-gray-600">اختيارات تمريضية مرتبطة بخدمات الصيدليات القريبة.</p>
              </div>
              <Link href="/pharmacies" className="text-primary-600 hover:underline">
                عرض جميع الصيدليات
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.pharmacies.map((pharmacy) => {
                const highlights = extractServiceHighlights(pharmacy.descriptionAr);
                return (
                  <Link key={pharmacy.id} href={`/pharmacies/${pharmacy.slug}`} className="block">
                    <Card variant="hover" className="h-full">
                      <div className="flex items-start gap-4">
                        <EntityThumbnail
                          src={pharmacy.logo}
                          alt={pharmacy.nameAr}
                          entityType="pharmacy"
                          entityId={pharmacy.id}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{pharmacy.nameAr}</h3>
                          <p className="text-sm text-gray-500">
                            {pharmacy.governorate?.nameAr}
                            {pharmacy.city ? ` - ${pharmacy.city.nameAr}` : ''}
                          </p>
                          {pharmacy.phone && (
                            <p className="text-sm text-primary-600 mt-1" dir="ltr">
                              {pharmacy.phone}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pharmacy.is24h && <Badge variant="danger" size="sm">24 ساعة</Badge>}
                            {pharmacy.hasDeliveryService && <Badge variant="success" size="sm">توصيل</Badge>}
                            {pharmacy.isOpen && <Badge variant="secondary" size="sm">مفتوح</Badge>}
                          </div>
                          {highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {highlights.map((service) => (
                                <Badge key={service} variant="primary" size="sm">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {data.pharmacies.length === 0 && (
              <div className="text-center py-10 text-gray-500">لا توجد خدمات تمريض عبر الصيدليات حالياً.</div>
            )}
          </section>

          <section id="teams" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">فرق وخبرات التمريض</h2>
                <p className="text-gray-600">فرق متخصصة في الرعاية المنزلية والمتابعة اليومية.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nursingTeams.map((team, index) => (
                <Card key={'id' in team ? team.id : `team-${index}`} className="h-full">
                  {'id' in team ? (
                    <div className="flex items-start gap-4">
                      <EntityThumbnail
                        src={team.image}
                        alt={team.name}
                        entityType="nursing"
                        entityId={team.id}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
                        <p className="text-sm text-gray-500">{team.title}</p>
                        {team.experience && (
                          <p className="text-sm text-gray-600 mt-1">خبرة {team.experience} سنة</p>
                        )}
                        {team.rating && team.rating > 0 && (
                          <Badge variant="success" size="sm" className="mt-2">
                            تقييم {team.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-3">{team.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{team.title}</h3>
                      <p className="text-sm text-gray-600">{team.description}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section id="services" className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">الخدمات التمريضية المتاحة</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                باقات تمريضية منزلية موجهة لمتابعة الحالات اليومية، العناية بعد العمليات، والرعاية طويلة المدى.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fallbackNursingServices.map((service) => (
                <Card key={service.title} variant="hover" className="text-center h-full">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="tips" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">نصائح تمريضية يومية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nursingTips.map((tip) => (
                <Card key={tip.title} className="h-full">
                  <div className="text-3xl mb-3">{tip.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600">{tip.content}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="articles" className="mb-16">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">مقالات تمريضية في {data.nursingCategoryName}</h2>
                <p className="text-gray-600">محتوى متجدد لدعم مقدمي الرعاية والأسر.</p>
              </div>
              <Link href="/articles?category=nursing-services" className="text-primary-600 hover:underline">
                عرض كل المقالات
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nursingArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`}>
                  <Card variant="hover" className="h-full overflow-hidden">
                    <EntityCardImage
                      src={article.image}
                      alt={article.title}
                      entityType="article"
                      entityId={article.id}
                    />
                    <div className="p-4">
                      {article.category?.nameAr && (
                        <Badge variant="secondary" size="sm" className="mb-2">
                          {article.category.nameAr}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {article.excerpt || 'اطلع على إرشادات تمريضية عملية ودقيقة.'}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            {nursingArticles.length === 0 && (
              <div className="text-center py-10 text-gray-500">لا توجد مقالات تمريضية متاحة حالياً.</div>
            )}
          </section>

          <Card className="bg-emerald-50 border-emerald-200">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">هل تحتاج خدمة تمريض منزلي؟</h2>
              <p className="text-emerald-700 mb-6">تواصل معنا الآن للحصول على أفضل خدمات التمريض المنزلي</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <a
                  href="tel:+201000000000"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  اتصل بنا
                </a>
                <a
                  href="https://wa.me/201000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  واتساب
                </a>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
