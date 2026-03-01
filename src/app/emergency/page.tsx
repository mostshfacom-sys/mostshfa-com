import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Suspense } from 'react';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage, EntityThumbnail } from '@/components/ui/EntityImage';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'دليل الطوارئ الطبية | مستشفى.كوم',
  description:
    'دليل شامل للطوارئ الطبية في مصر: استقبال الطوارئ بالمستشفيات، أرقام الإسعاف، أدوية الطوارئ، ونصائح الإسعافات الأولية.',
  openGraph: {
    title: 'دليل الطوارئ الطبية | مستشفى.كوم',
    description:
      'استكشف أقسام الطوارئ بالمستشفيات، أرقام الطوارئ السريعة، نصائح وإرشادات طبية ومقالات متخصصة.',
  },
};

const emergencyNumbers = [
  {
    title: 'الإسعاف',
    number: '123',
    description: 'الاتصال السريع بسيارات الإسعاف على مدار الساعة.',
  },
  {
    title: 'شرطة النجدة',
    number: '122',
    description: 'بلاغات الشرطة والحالات الطارئة الأمنية.',
  },
  {
    title: 'المطافئ',
    number: '180',
    description: 'بلاغات الحرائق والحوادث الكبرى.',
  },
  {
    title: 'الكهرباء',
    number: '121',
    description: 'الإبلاغ عن الأعطال الكهربائية والحالات الخطرة.',
  },
  {
    title: 'الغاز',
    number: '129',
    description: 'بلاغات تسرب الغاز والطوارئ المنزلية.',
  },
  {
    title: 'الطوارئ الصحية',
    number: '137',
    description: 'خطوط الدعم الطبي والاستفسارات العاجلة.',
  },
];

const fallbackEmergencyTips = [
  {
    title: 'ثبت مجرى التنفس أولاً',
    content: 'تأكد من أن المريض يتنفس بشكل طبيعي قبل أي إجراء آخر.',
    icon: '🫁',
  },
  {
    title: 'راقب العلامات الحيوية',
    content: 'تابع النبض والوعي والتنفس حتى وصول المساعدة.',
    icon: '🩺',
  },
  {
    title: 'تجنب تحريك المصاب',
    content: 'لا تحرّك المصاب في حالات الحوادث إلا للضرورة القصوى.',
    icon: '🚑',
  },
  {
    title: 'استخدم الضغط لإيقاف النزيف',
    content: 'اضغط برفق على الجرح بضمادة نظيفة لإيقاف النزيف.',
    icon: '🩹',
  },
  {
    title: 'احتفظ ببياناتك الطبية',
    content: 'جهز قائمة بأدويتك وحساسيتك لتسليمها للطوارئ.',
    icon: '📋',
  },
  {
    title: 'حافظ على الهدوء',
    content: 'الهدوء يساعد على اتخاذ قرارات سريعة وصحيحة.',
    icon: '🧘',
  },
];

const fallbackEmergencyDrugCategories = [
  {
    name: 'مسكنات سريعة المفعول',
    description: 'أدوية لتخفيف الألم الحاد في الحالات الطارئة.',
  },
  {
    name: 'موسعات الشعب الهوائية',
    description: 'للتعامل مع أزمات الربو وضيق التنفس.',
  },
  {
    name: 'مضادات الحساسية الحادة',
    description: 'للحالات التحسسية المفاجئة.',
  },
  {
    name: 'محاليل وريدية',
    description: 'تعويض السوائل والدعم السريع للسوائل الحيوية.',
  },
  {
    name: 'مضادات النزيف',
    description: 'للتحكم بالنزيف في الحالات الحرجة.',
  },
  {
    name: 'مضادات التسمم',
    description: 'دعم سريع لحالات التسمم والجرعات الزائدة.',
  },
];

const pickRandomItems = <T,>(items: T[], count: number) => {
  if (items.length <= count) return items;
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
};

const extractEmergencyServices = (raw?: string | null) => {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray((parsed as any).services)) {
        return (parsed as any).services.map((item: string) => String(item)).filter(Boolean);
      }
      return Object.values(parsed)
        .flatMap((value) => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') return [value];
          return [];
        })
        .map((item) => String(item))
        .filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
};

async function getEmergencyData() {
  const emergencyCategory = await prisma.articleCategory.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug: 'emergency-medicine' },
        { nameAr: { contains: 'طوارئ' } },
        { nameEn: { contains: 'emergency' } },
      ],
    },
    select: { id: true, nameAr: true },
  });

  const [hospitalTotal, hospitals, tipsRaw, drugCategoriesRaw, articlesRaw] = await Promise.all([
    prisma.hospital.count({ where: { hasEmergency: true } }),
    prisma.hospital.findMany({
      where: { hasEmergency: true },
      include: { governorate: true, city: true },
      orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
      take: 12,
    }),
    prisma.healthTip.findMany({
      where: {
        isActive: true,
        ...(emergencyCategory?.id ? { categoryId: emergencyCategory.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.drugCategory.findMany({
      where: {
        OR: [
          { name: { contains: 'طوارئ' } },
          { name: { contains: 'إسعاف' } },
          { name: { contains: 'emergency' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 8,
    }),
    prisma.article.findMany({
      where: {
        isPublished: true,
        ...(emergencyCategory?.id ? { categoryId: emergencyCategory.id } : {}),
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
    }),
  ]);

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
    hospitalTotal,
    hospitals,
    emergencyCategoryName: emergencyCategory?.nameAr || 'طب الطوارئ',
    tipsRaw,
    drugCategoriesRaw,
    articles,
  };
}

export default async function EmergencyDirectoryPage() {
  const data = await getEmergencyData();

  const emergencyTips = data.tipsRaw.length
    ? data.tipsRaw.map((tip) => ({
        title: tip.titleAr,
        content: tip.contentAr,
        icon: tip.icon || '💡',
      }))
    : fallbackEmergencyTips;

  const emergencyDrugCategories = data.drugCategoriesRaw.length
    ? data.drugCategoriesRaw.map((category) => ({
        name: category.name,
        description: 'تصنيف متاح لأدوية الطوارئ والعلاج السريع.',
      }))
    : fallbackEmergencyDrugCategories;

  const emergencyArticles = pickRandomItems(data.articles, 6);
  const headerSubtitle =
    data.hospitalTotal > 0
      ? `استكشف ${data.hospitalTotal} مستشفى طوارئ وأرقام الإسعاف السريعة`
      : 'استكشف أقسام الطوارئ بالمستشفيات وأرقام الإسعاف ونصائح الإسعافات الأولية.';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'hospitals',
      label: 'مستشفيات الطوارئ',
      value: data.hospitalTotal,
      icon: 'heart',
      color: '#f87171',
      isHighlighted: true,
    },
    {
      id: 'numbers',
      label: 'أرقام طوارئ',
      value: emergencyNumbers.length,
      icon: 'shield',
      color: '#fbbf24',
    },
    {
      id: 'tips',
      label: 'نصائح سريعة',
      value: emergencyTips.length,
      icon: 'check',
      color: '#34d399',
    },
    {
      id: 'articles',
      label: 'مقالات طوارئ',
      value: data.articles.length,
      icon: 'star',
      color: '#60a5fa',
    },
  ];

  const quickFilters = [
    {
      id: 'hospitals',
      label: 'مستشفيات الطوارئ',
      icon: 'heart' as const,
      href: '/emergency#hospitals',
    },
    {
      id: 'numbers',
      label: 'أرقام الطوارئ',
      icon: 'shield' as const,
      href: '/emergency#numbers',
    },
    {
      id: 'drugs',
      label: 'أدوية الطوارئ',
      icon: 'building' as const,
      href: '/emergency#drugs',
    },
    {
      id: 'tips',
      label: 'نصائح سريعة',
      icon: 'check' as const,
      href: '/emergency#tips',
    },
    {
      id: 'articles',
      label: 'مقالات طوارئ',
      icon: 'star' as const,
      href: '/emergency#articles',
    },
  ];
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="emergency"
            title="دليل الطوارئ الطبية"
            subtitle={headerSubtitle}
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={data.hospitalTotal}
            showMapButton
            mapEntityTypes={['hospital']}
            mapTitle="خريطة مستشفيات الطوارئ"
            mapSubtitle="استعرض مواقع المستشفيات المجهزة للطوارئ"
            searchPlaceholder="ابحث عن طوارئ، إسعافات أولية، أو مستشفى قريب..."
            searchParamKey="q"
            searchAction="/search"
            resetPageOnSearch={false}
            showFilters={false}
            showViewToggle={false}
            gradientFrom="from-red-600"
            gradientTo="to-amber-500"
            className="mb-8"
          />
        </Suspense>
        <div className="container-custom pb-8">
          <Breadcrumb
            items={[
              { label: 'الأدلة الطبية', href: '/directories' },
              { label: 'دليل الطوارئ الطبية' },
            ]}
            className="mb-6"
          />

          <section className="bg-white rounded-2xl shadow-sm p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">جاهز للاستجابة السريعة؟</h2>
              <p className="text-sm text-gray-600">اختر المسار الأنسب لحالات الطوارئ أو الإسعافات الأولية.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/hospitals?emergency=true"
                className="px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors"
              >
                عرض مستشفيات الطوارئ
              </Link>
              <Link
                href="/articles?category=emergency-medicine"
                className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                مقالات الإسعافات الأولية
              </Link>
            </div>
          </section>

          <section id="hospitals" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">مستشفيات مجهزة للطوارئ</h2>
                <p className="text-gray-600">أقسام استقبال طوارئ تعمل على مدار الساعة.</p>
              </div>
              <Link href="/hospitals?emergency=true" className="text-primary-600 hover:underline">
                عرض جميع المستشفيات
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.hospitals.map((hospital) => {
                const services: string[] = extractEmergencyServices(hospital.emergencyServices).slice(0, 3);
                return (
                  <Link key={hospital.id} href={`/hospitals/${hospital.slug}`} className="block">
                    <Card variant="hover" className="h-full">
                      <div className="flex items-start gap-4">
                        <EntityThumbnail
                          src={hospital.logo}
                          alt={hospital.nameAr}
                          entityType="hospital"
                          entityId={hospital.id}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{hospital.nameAr}</h3>
                            <Badge variant="danger" size="sm">طوارئ</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {hospital.governorate?.nameAr}
                            {hospital.city ? ` - ${hospital.city.nameAr}` : ''}
                          </p>
                          {hospital.phone && (
                            <p className="text-sm text-primary-600 mt-1" dir="ltr">
                              {hospital.phone}
                            </p>
                          )}
                          {services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {services.map((service: string) => (
                                <Badge key={service} variant="secondary" size="sm">
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
            {data.hospitals.length === 0 && (
              <div className="text-center py-10 text-gray-500">لا توجد مستشفيات طوارئ متاحة حالياً.</div>
            )}
          </section>

          <section id="numbers" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">أرقام الطوارئ السريعة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyNumbers.map((item) => (
                <Card key={item.number} className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">{item.title}</p>
                      <p className="text-2xl font-bold text-gray-900" dir="ltr">{item.number}</p>
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    </div>
                    <a
                      href={`tel:${item.number}`}
                      className="px-4 py-2 rounded-full bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
                    >
                      اتصال
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section id="drugs" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">تصنيفات أدوية الطوارئ</h2>
                <p className="text-gray-600">تعرف على أكثر التصنيفات استخداماً في الحالات الحرجة.</p>
              </div>
              <Link href="/drugs" className="text-primary-600 hover:underline">عرض دليل الأدوية</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyDrugCategories.map((category) => (
                <Card key={category.name} className="h-full">
                  <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="tips" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">نصائح وإرشادات الطوارئ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyTips.map((tip) => (
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
                <h2 className="text-2xl font-bold text-gray-900">مقالات طبية في {data.emergencyCategoryName}</h2>
                <p className="text-gray-600">محتوى متجدد يساعدك على الاستعداد للطوارئ.</p>
              </div>
              <Link href="/articles?category=emergency-medicine" className="text-primary-600 hover:underline">
                عرض كل المقالات
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emergencyArticles.map((article) => (
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
                        {article.excerpt || 'اقرأ المزيد عن الإرشادات والإسعافات الأولية.'}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            {emergencyArticles.length === 0 && (
              <div className="text-center py-10 text-gray-500">لا توجد مقالات طوارئ متاحة حالياً.</div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
