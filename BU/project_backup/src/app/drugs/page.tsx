import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityThumbnail } from '@/components/ui/EntityImage';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';
import type { Metadata } from 'next';
import {
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  CurrencyPoundIcon,
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دليل الأدوية في مصر | مستشفى.كوم',
  description:
    'دليل أدوية شامل في مصر مع البحث السريع، الأسعار المتاحة، البدائل، التفاعلات الدوائية، ومعلومات الاستخدام والجرعات.',
  openGraph: {
    title: 'دليل الأدوية في مصر | مستشفى.كوم',
    description:
      'استكشف الأدوية المصرية مع تصنيفات واضحة، معلومات الاستخدام، الأسعار المتاحة، والبدائل.',
  },
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
  };
}

async function getDrugs(searchParams: PageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 24;
  const search = searchParams.search || '';
  const category = searchParams.category;

  const where: any = {};
  const imageAvailabilityFilters = {
    AND: [
      { image: { not: null } },
      { image: { not: '' } },
      { NOT: [{ image: { startsWith: '/images/defaults/' } }] },
    ],
  };

  if (search) {
    const normalizedSearch = normalizeArabic(search);
    where.OR = [
      { nameAr: { contains: normalizedSearch } },
      { nameEn: { contains: search } },
      { activeIngredient: { contains: search } },
      // Add search by active ingredient in Arabic if possible, or assume user might type it
      { activeIngredient: { contains: normalizedSearch } }
    ];
  }

  if (category) {
    where.categoryId = parseInt(category);
  }

  const [total, availableImagesCount, categories, pricedCount, lastUpdatedResult] = await Promise.all([
    prisma.drug.count({ where }),
    prisma.drug.count({
      where: {
        ...where,
        ...imageAvailabilityFilters,
      },
    }),
    prisma.drugCategory.findMany({
      include: {
        _count: {
          select: { drugs: true },
        },
      },
      orderBy: {
        drugs: {
          _count: 'desc',
        },
      },
    }),
    // Simplified count for priced items to ensure we catch everything
    prisma.drug.count({
      where: {
        ...where,
        priceText: {
          not: null,
          notIn: ['', '0', '0.00', '0.0'] // Exclude empty or zero strings if any
        }
      },
    }),
    prisma.drug.aggregate({
      where,
      _max: { updatedAt: true },
    }),
  ]);

  const skip = (page - 1) * limit;
  let drugs: any[] = [];

  // حساب أي قسم من البيانات نحتاج
  if (skip < availableImagesCount) {
    // نحتاج بعض أو كل الأدوية ذات الصور الحقيقية
    const realDrugs = await prisma.drug.findMany({
      where: {
        ...where,
        ...imageAvailabilityFilters,
      },
      include: { category: true },
      orderBy: { nameAr: 'asc' },
      skip: skip,
      take: limit,
    });
    drugs = [...realDrugs];

    // إذا لم نملأ الصفحة، نجلب من الأدوية الافتراضية
    if (drugs.length < limit) {
      const defaultDrugs = await prisma.drug.findMany({
        where: {
          ...where,
          OR: [
            { image: null },
            { image: '' },
            { image: { startsWith: '/images/defaults/' } },
          ],
        },
        include: { category: true },
        orderBy: { nameAr: 'asc' },
        skip: 0,
        take: limit - drugs.length,
      });
      drugs = [...drugs, ...defaultDrugs];
    }
  } else {
    // نحتاج فقط الأدوية ذات الصور الافتراضية
    const defaultSkip = skip - availableImagesCount;
    drugs = await prisma.drug.findMany({
      where: {
        ...where,
        OR: [
          { image: null },
          { image: '' },
          { image: { startsWith: '/images/defaults/' } },
        ],
      },
      include: { category: true },
      orderBy: { nameAr: 'asc' },
      skip: defaultSkip,
      take: limit,
    });
  }

  return {
    drugs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories,
    availableImagesCount,
    pricedCount,
    lastUpdated: lastUpdatedResult._max.updatedAt,
  };
}

export default async function DrugsPage({ searchParams }: PageProps) {
  const data = await getDrugs(searchParams);
  const headerSubtitle =
    data.total > 0
      ? `عرض ${data.drugs.length} من ${data.total} دواء`
      : 'لا توجد نتائج';
  const lastUpdatedLabel = data.lastUpdated
    ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
        data.lastUpdated
      )
    : 'غير متوفر';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'total',
      label: 'إجمالي الأدوية',
      value: data.total,
      icon: 'building',
      color: '#0ea5e9',
      isHighlighted: true,
    },
    {
      id: 'realImages',
      label: 'صور متاحة',
      value: data.availableImagesCount,
      icon: 'check',
      color: '#22c55e',
    },
    {
      id: 'priced',
      label: 'أسعار متاحة',
      value: data.pricedCount,
      icon: 'heart',
      color: '#f43f5e',
    },
    {
      id: 'categories',
      label: 'التصنيفات',
      value: data.categories.length,
      icon: 'group',
      color: '#f59e0b',
    },
  ];

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.category) params.set('category', searchParams.category);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    return params.toString();
  };

  const buildLink = (updates: Record<string, string | undefined>) => {
    const query = buildQuery(updates);
    return query ? `/drugs?${query}` : '/drugs';
  };

  const quickFilters = [
    {
      id: 'all',
      label: 'كل الأدوية',
      active: !searchParams.category,
      href: buildLink({ category: undefined }),
    },
    ...data.categories.slice(0, 4).map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      active: searchParams.category === String(category.id),
      href: buildLink({ category: String(category.id) }),
    })),
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <UniversalHeaderClient
          prefix="drugs"
          title="دليل الأدوية"
          subtitle={headerSubtitle}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={data.total}
          searchPlaceholder="ابحث بالاسم التجاري أو المادة الفعالة..."
          searchParamKey="search"
          pageParamKey="page"
          resetPageOnSearch
          showFilters={false}
          showViewToggle={false}
          gradientFrom="from-sky-500"
          gradientTo="to-blue-600"
          className="mb-8"
        />
        <div className="container-custom pb-10">
          <Breadcrumb items={[{ label: 'دليل الأدوية' }]} className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-200">
                    <SparklesIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">دليل الأدوية الذكي</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      ابحث بسرعة، قارن البدائل، وتابع أحدث البيانات الدوائية المتاحة في مصر.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-center dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">آخر تحديث</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{lastUpdatedLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-center dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">أسعار متاحة</p>
                    <p className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                      {data.pricedCount.toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-center dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400">صور متاحة</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {data.availableImagesCount.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">لماذا هذا الدليل؟</h2>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                    <span>عرض منظم للدواء مع البيانات المتوفرة والبدائل.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-sky-500" />
                    <span>بحث سريع وتصنيفات واضحة للوصول للدواء.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4 text-indigo-500" />
                    <span>أقسام للتفاعلات والجرعات والاحتياطات.</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/drugs"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition"
                >
                  استكشف الدليل
                </Link>
                <Link
                  href="/medical-info"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary-200 hover:text-primary-600 transition dark:border-white/10 dark:text-slate-300 dark:hover:text-primary-300"
                >
                  مقالات دوائية
                </Link>
              </div>
            </Card>
          </div>

          {/* Categories Quick Links - Smart Display */}
          {data.categories.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  التصنيفات الأكثر شيوعاً
                </h2>
                <Link 
                  href="/drugs/categories" 
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  عرض كل التصنيفات
                  <span aria-hidden="true">&larr;</span>
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/drugs"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    !searchParams.category
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:text-primary-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:border-primary-700'
                  }`}
                >
                  الكل
                </Link>
                {data.categories.slice(0, 12).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/drugs?category=${cat.id}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border flex items-center gap-2 ${
                      searchParams.category === String(cat.id)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:text-primary-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:border-primary-700'
                    }`}
                  >
                    {cat.name}
                    <span className={`text-xs ${
                      searchParams.category === String(cat.id) 
                        ? 'text-primary-200' 
                        : 'text-slate-400'
                    }`}>
                      {cat._count.drugs}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center dark:bg-slate-800 dark:text-slate-200">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">بحث ذكي</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">ابحث بالاسم التجاري أو المادة الفعالة للوصول السريع.</p>
              </div>
            </Card>
            <Card className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center dark:bg-emerald-900/40 dark:text-emerald-200">
                <CurrencyPoundIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">أسعار محدثة</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">عرض الأسعار المتاحة وخيارات البدائل القريبة.</p>
              </div>
            </Card>
            <Card className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/40 dark:text-indigo-200">
                <BeakerIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">معلومات مفصلة</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">جرعات، تحذيرات، وتفاعلات دوائية لكل دواء.</p>
              </div>
            </Card>
          </div>

          {/* Drugs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.drugs.map((drug) => (
              <Link key={drug.id} href={`/drugs/${drug.slug}`}>
                <Card variant="hover" className="h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3">
                      <EntityThumbnail
                        src={drug.image}
                        alt={drug.nameAr}
                        entityType="drug"
                        size="md"
                      />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2">{drug.nameAr}</h3>
                    {drug.nameEn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2" dir="ltr">{drug.nameEn}</p>
                    )}
                    {drug.category && (
                      <Badge variant="secondary" size="sm">{drug.category.name}</Badge>
                    )}
                    {drug.priceText && (
                      <p className="text-sm text-primary-600 dark:text-primary-300 font-medium mt-2">{drug.priceText}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">هل الأسعار ثابتة؟</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                الأسعار المعروضة هي أحدث البيانات المتاحة لدينا، وقد تختلف حسب الصيدلية والتحديثات الرسمية.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">كيف أجد البدائل؟</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                افتح صفحة الدواء وستجد قسم البدائل مع نفس المادة الفعالة أو التركيبات القريبة.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">هل توجد تفاعلات دوائية؟</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                نعم، صفحة الدواء تعرض تفاعلات محتملة لتجنب التعارض بين الأدوية.
              </p>
            </Card>
          </div>

          {data.drugs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center dark:bg-slate-800">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400">لا توجد أدوية مطابقة للبحث</p>
              <Link href="/drugs" className="text-primary-600 dark:text-primary-300 hover:underline mt-2 inline-block">
                عرض جميع الأدوية
              </Link>
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {data.page > 1 && (
                <Link
                  href={`/drugs?page=${data.page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                  className="px-4 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  السابق
                </Link>
              )}
              
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                let pageNum;
                if (data.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (data.page <= 3) {
                  pageNum = i + 1;
                } else if (data.page >= data.totalPages - 2) {
                  pageNum = data.totalPages - 4 + i;
                } else {
                  pageNum = data.page - 2 + i;
                }
                return (
                  <Link
                    key={pageNum}
                    href={`/drugs?page=${pageNum}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                    className={`px-4 py-2 rounded-lg ${
                      pageNum === data.page
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {data.page < data.totalPages && (
                <Link
                  href={`/drugs?page=${data.page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                  className="px-4 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  التالي
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
