import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="hidden" name="search" defaultValue={searchParams.search} />
              <select
                name="governorate"
                defaultValue={searchParams.governorate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">كل المحافظات</option>
                {data.governorates.map((g) => (
                  <option key={g.id} value={g.id}>{g.nameAr}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="homeSampling"
                  value="true"
                  defaultChecked={searchParams.homeSampling === 'true'}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <span className="text-gray-700">سحب منزلي</span>
              </label>
              <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                تطبيق الفلاتر
              </button>
            </form>
          </div>

          {/* Labs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.labs.map((lab) => (
              <Link key={lab.id} href={`/labs/${lab.slug}`}>
                <Card variant="hover" className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{lab.nameAr}</h3>
                      {lab.governorate && (
                        <p className="text-sm text-gray-500">{lab.governorate.nameAr}{lab.city ? ` - ${lab.city.nameAr}` : ''}</p>
                      )}
                      {lab.phone && <p className="text-sm text-primary-600 mt-1" dir="ltr">{lab.phone}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lab.hasHomeSampling && <Badge variant="success" size="sm">سحب منزلي</Badge>}
                        {lab.isOpen && <Badge variant="secondary" size="sm">مفتوح</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
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
