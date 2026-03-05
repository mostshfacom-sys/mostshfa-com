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
  title: 'الأطباء',
  description: 'دليل شامل للأطباء والاستشاريين في مصر',
  openGraph: {
    title: 'الأطباء | مستشفى',
    description: 'دليل شامل للأطباء والاستشاريين في مصر',
  },
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    specialtyId?: string;
    featured?: string;
  };
}

async function getDoctors(searchParams: PageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  const search = searchParams.search || '';
  const specialtyId = searchParams.specialtyId ? parseInt(searchParams.specialtyId) : undefined;
  const featured = searchParams.featured === 'true';

  const where: any = { isActive: true };

  if (search) {
    const normalizedSearch = normalizeArabic(search);
    where.OR = [
      { nameAr: { contains: normalizedSearch } },
      { nameEn: { contains: search } },
      { bio: { contains: normalizedSearch } },
      { specialty: { nameAr: { contains: normalizedSearch } } },
    ];
  }

  if (specialtyId) where.specialtyId = specialtyId;
  if (featured) where.isFeatured = true;

  const [total, doctors, specialties, featuredCount] = await Promise.all([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      include: { specialty: true },
      orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.specialty.findMany({ orderBy: { nameAr: 'asc' } }),
    prisma.staff.count({ where: { ...where, isFeatured: true } }),
  ]);

  return {
    page,
    totalPages: Math.ceil(total / limit),
    total,
    doctors,
    specialties,
    featuredCount,
  };
}

export default async function DoctorsPage({ searchParams }: PageProps) {
  const data = await getDoctors(searchParams);
  const headerSubtitle = data.total > 0 ? `عرض ${data.doctors.length} من ${data.total} طبيب` : 'لا توجد نتائج';
  const headerCounters: HeaderCounterConfig[] = [
    { id: 'total', label: 'إجمالي الأطباء', value: data.total, icon: 'users', color: '#0ea5e9', isHighlighted: true },
    { id: 'featured', label: 'أطباء مميزون', value: data.featuredCount, icon: 'star', color: '#f59e0b' },
    { id: 'specialties', label: 'التخصصات', value: data.specialties.length, icon: 'group', color: '#22c55e' },
  ];

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.specialtyId) params.set('specialtyId', searchParams.specialtyId);
    if (searchParams.featured) params.set('featured', searchParams.featured);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set('page', '1');
    return params.toString();
  };

  const buildLink = (updates: Record<string, string | undefined>) => {
    const query = buildQuery(updates);
    return query ? `/doctors?${query}` : '/doctors';
  };

  const quickFilters = [
    { id: 'all', label: 'كل الأطباء', active: !searchParams.featured, href: buildLink({ featured: undefined }) },
    { id: 'featured', label: 'مميز', icon: 'star' as const, active: searchParams.featured === 'true', href: buildLink({ featured: 'true' }) },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UniversalHeaderClient
          prefix="doctors"
          title="دليل الأطباء"
          subtitle={headerSubtitle}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={data.total}
          showMapButton
          mapEntityTypes={['hospital', 'clinic']}
          mapTitle="خريطة الأطباء"
          mapSubtitle="استعرض أماكن تقديم الخدمة للأطباء"
          searchPlaceholder="ابحث عن طبيب أو تخصص..."
          searchParamKey="search"
          pageParamKey="page"
          resetPageOnSearch
          showFilters={false}
          showViewToggle={false}
          gradientFrom="from-cyan-500"
          gradientTo="to-blue-600"
          className="mb-8"
        />
        <div className="container-custom pb-8">
          <Breadcrumb items={[{ label: 'الأطباء' }]} className="mb-6" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit lg:sticky lg:top-24">
              <Card className="p-5">
                <h2 className="mb-4 text-lg font-bold text-slate-900">تصفية النتائج</h2>
                <form className="space-y-4">
                  <input type="hidden" name="search" defaultValue={searchParams.search} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">التخصص</label>
                    <select
                      name="specialtyId"
                      defaultValue={searchParams.specialtyId}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">كل التخصصات</option>
                      {data.specialties.map((s) => (
                        <option key={s.id} value={s.id}>{s.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer">
                    <input type="checkbox" name="featured" value="true" defaultChecked={searchParams.featured === 'true'} className="h-4 w-4 rounded text-primary-500" />
                    <span className="text-sm text-slate-700">الأطباء المميزون فقط</span>
                  </label>
                  <button type="submit" className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors">
                    تطبيق الفلاتر
                  </button>
                </form>
              </Card>
            </aside>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.doctors.map((doctor, index) => {
                  const mappedDoctor = {
                    id: doctor.id,
                    name_ar: `${doctor.title ? `${doctor.title} ` : ''}${doctor.nameAr}`,
                    logo_url: doctor.image,
                    hospital_type_name_ar: doctor.specialty?.nameAr || 'طبيب',
                    governorate_name: '',
                    city_name: '',
                    rating_avg: doctor.ratingAvg,
                    rating_count: doctor.ratingCount,
                    is_featured: doctor.isFeatured,
                    is_open: true,
                    has_emergency: false,
                    has_ambulance: false,
                    phone: doctor.phone,
                    branches_count: doctor.experience || 0,
                    specialties: doctor.specialty
                      ? [{ id: doctor.specialty.id, name_ar: doctor.specialty.nameAr }]
                      : [],
                  } as any;

                  return (
                    <HospitalCardPro
                      key={doctor.id}
                      hospital={mappedDoctor}
                      index={index}
                      href={`/doctors/${doctor.id}`}
                      typeLabel="طبيب"
                    />
                  );
                })}
              </div>

              {data.doctors.length === 0 && (
                <Card className="text-center py-12 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500">جرّب تغيير البحث أو الفلاتر</p>
                </Card>
              )}

              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/doctors?page=${p}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.specialtyId ? `&specialtyId=${searchParams.specialtyId}` : ''}${searchParams.featured ? `&featured=${searchParams.featured}` : ''}`}
                      className={`px-4 py-2 rounded-lg ${p === data.page ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
