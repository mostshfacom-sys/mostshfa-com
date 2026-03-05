import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HospitalCardPro } from '@/components/hospitals-pro/HospitalCardPro';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المعامل',
  description: 'دليل شامل لمعامل التحاليل الطبية في مصر. ابحث عن أقرب معمل إليك مع خدمة السحب المنزلي.',
  openGraph: {
    title: 'المعامل | مستشفى',
    description: 'دليل شامل لمعامل التحاليل الطبية في مصر',
  },
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    governorate?: string;
    homeSampling?: string;
  };
}

async function getLabs(searchParams: PageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  const search = searchParams.search || '';
  const governorate = searchParams.governorate;
  const homeSampling = searchParams.homeSampling === 'true';

  const where: any = { status: 'published' };

  if (search) {
    const normalizedSearch = normalizeArabic(search);
    where.OR = [
      { nameAr: { contains: normalizedSearch } },
      { nameEn: { contains: search } },
      { addressAr: { contains: normalizedSearch } },
    ];
  }

  if (governorate) {
    where.governorateId = parseInt(governorate);
  }

  if (homeSampling) {
    where.hasHomeSampling = true;
  }

  const [total, labs, governorates, openCount, homeSamplingCount, featuredCount] = await Promise.all([
    prisma.lab.count({ where }),
    prisma.lab.findMany({
      where,
      include: { governorate: true, city: true },
      orderBy: { nameAr: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } }),
    prisma.lab.count({ where: { ...where, isOpen: true } }),
    prisma.lab.count({ where: { ...where, hasHomeSampling: true } }),
    prisma.lab.count({ where: { ...where, isFeatured: true } }),
  ]);

  return {
    labs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    governorates,
    openCount,
    homeSamplingCount,
    featuredCount,
  };
}

export default async function LabsPage({ searchParams }: PageProps) {
  const data = await getLabs(searchParams);
  const headerSubtitle =
    data.total > 0
      ? `عرض ${data.labs.length} من ${data.total} معمل`
      : 'لا توجد نتائج';
  const headerCounters: HeaderCounterConfig[] = [
    {
      id: 'total',
      label: 'إجمالي المعامل',
      value: data.total,
      icon: 'building',
      color: '#a855f7',
      isHighlighted: true,
    },
    {
      id: 'homeSampling',
      label: 'سحب منزلي',
      value: data.homeSamplingCount,
      icon: 'heart',
      color: '#ec4899',
    },
    {
      id: 'open',
      label: 'مفتوح الآن',
      value: data.openCount,
      icon: 'clock',
      color: '#10b981',
    },
    {
      id: 'featured',
      label: 'معامل مميزة',
      value: data.featuredCount,
      icon: 'star',
      color: '#f59e0b',
    },
  ];

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.governorate) params.set('governorate', searchParams.governorate);
    if (searchParams.homeSampling) params.set('homeSampling', searchParams.homeSampling);
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
    return query ? `/labs?${query}` : '/labs';
  };

  const quickFilters = [
    {
      id: 'all',
      label: 'كل المعامل',
      active: !searchParams.homeSampling,
      href: buildLink({ homeSampling: undefined }),
    },
    {
      id: 'home-sampling',
      label: 'سحب منزلي',
      icon: 'heart' as const,
      active: searchParams.homeSampling === 'true',
      href: buildLink({ homeSampling: 'true' }),
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UniversalHeaderClient
          prefix="labs"
          title="المعامل"
          subtitle={headerSubtitle}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={data.total}
          showMapButton
          mapEntityTypes={['lab']}
          mapTitle="خريطة المعامل"
          mapSubtitle="استعرض مواقع المعامل المتاحة"
          searchPlaceholder="ابحث عن معمل أو خدمة..."
          searchParamKey="search"
          pageParamKey="page"
          resetPageOnSearch
          showFilters={false}
          showViewToggle={false}
          gradientFrom="from-purple-500"
          gradientTo="to-indigo-600"
          className="mb-8"
        />
        <div className="container-custom pb-8">
          <Breadcrumb items={[{ label: 'المعامل' }]} className="mb-6" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit lg:sticky lg:top-24">
              <Card className="p-5">
                <h2 className="mb-4 text-lg font-bold text-slate-900">تصفية النتائج</h2>
                <form className="space-y-4">
                  <input type="hidden" name="search" defaultValue={searchParams.search} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">المحافظة</label>
                    <select
                      name="governorate"
                      defaultValue={searchParams.governorate}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">كل المحافظات</option>
                      {data.governorates.map((g) => (
                        <option key={g.id} value={g.id}>{g.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="homeSampling"
                      value="true"
                      defaultChecked={searchParams.homeSampling === 'true'}
                      className="h-4 w-4 rounded text-primary-500"
                    />
                    <span className="text-sm text-slate-700">سحب منزلي</span>
                  </label>
                  <button type="submit" className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors">
                    تطبيق الفلاتر
                  </button>
                </form>
              </Card>
            </aside>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.labs.map((lab, index) => {
                  const mappedLab = {
                    id: lab.id,
                    name_ar: lab.nameAr,
                    logo_url: lab.logo,
                    hospital_type_name_ar: 'معمل تحاليل',
                    governorate_name: lab.governorate?.nameAr || '',
                    city_name: lab.city?.nameAr || '',
                    rating_avg: lab.ratingAvg,
                    rating_count: lab.ratingCount,
                    is_featured: lab.isFeatured,
                    is_open: lab.isOpen,
                    has_emergency: lab.hasHomeSampling,
                    has_ambulance: false,
                    phone: lab.phone,
                    branches_count: 0,
                    specialties: [],
                  } as any;

                  return (
                    <HospitalCardPro
                      key={lab.id}
                      hospital={mappedLab}
                      index={index}
                      href={`/labs/${lab.slug}`}
                      entityType="lab"
                      typeLabel="معمل"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {data.labs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">لا توجد معامل مطابقة للبحث</p>
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/labs?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.governorate ? `&governorate=${searchParams.governorate}` : ''}${searchParams.homeSampling ? `&homeSampling=${searchParams.homeSampling}` : ''}`}
                  className={`px-4 py-2 rounded-lg ${p === data.page ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
