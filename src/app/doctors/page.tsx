'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaffCard, StaffFilters } from '@/components/staff';

interface Doctor {
  id: number;
  nameAr: string;
  nameEn?: string;
  slug: string;
  title?: string;
  image?: string;
  experience?: number;
  consultationFee?: string;
  isFeatured?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  specialty?: { nameAr: string; slug: string } | null;
}

interface Specialty {
  id: number;
  nameAr: string;
  slug: string;
}

function DoctorsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const specialtyParam = searchParams.get('specialtyId');
  const resolvedSpecialty = specialtyParam ? parseInt(specialtyParam) : undefined;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | undefined>(resolvedSpecialty);
  const [featuredTotal, setFeaturedTotal] = useState(0);
  const [specialtiesTotal, setSpecialtiesTotal] = useState(0);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    setSelectedSpecialty(Number.isNaN(resolvedSpecialty) ? undefined : resolvedSpecialty);
  }, [resolvedSpecialty]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch('/api/specialties');
        if (response.ok) {
          const payload = await response.json();
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
          setSpecialties(list);
          setSpecialtiesTotal(list.length);
        }
      } catch (error) {
        console.error('Error fetching specialties:', error);
      }
    };

    fetchSpecialties();
  }, []);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
        });
        if (selectedSpecialty) {
          params.set('specialtyId', selectedSpecialty.toString());
        }
        if (searchTerm) {
          params.set('search', searchTerm);
        }

        const [res, featuredRes] = await Promise.all([
          fetch(`/api/doctors?${params.toString()}`),
          fetch(`/api/doctors?featured=true${selectedSpecialty ? `&specialtyId=${selectedSpecialty}` : ''}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`),
        ]);

        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
        }

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setFeaturedTotal(data.pagination?.total || 0);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [page, selectedSpecialty, searchTerm]);

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedSpecialty) params.set('specialtyId', selectedSpecialty.toString());
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
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleSpecialtyChange = (specialtyId: number | undefined) => {
    setSelectedSpecialty(specialtyId);
    setPage(1);
    updateQuery({
      specialtyId: specialtyId ? specialtyId.toString() : undefined,
      page: '1',
    });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    updateQuery({ page: nextPage.toString() });
  };

  const headerCounters: HeaderCounterConfig[] = useMemo(
    () => [
      {
        id: 'total',
        label: 'إجمالي الأطباء',
        value: total,
        icon: 'building',
        color: '#38bdf8',
        isHighlighted: true,
      },
      {
        id: 'featured',
        label: 'أطباء مميزون',
        value: featuredTotal,
        icon: 'star',
        color: '#f59e0b',
      },
      {
        id: 'specialties',
        label: 'التخصصات',
        value: specialtiesTotal,
        icon: 'group',
        color: '#22c55e',
      },
      {
        id: 'rating',
        label: 'التقييمات',
        value: doctors.reduce((sum, doctor) => sum + (doctor.ratingCount || 0), 0),
        icon: 'heart',
        color: '#ec4899',
      },
    ],
    [doctors, featuredTotal, specialtiesTotal, total]
  );

  const quickFilters = useMemo(
    () => [
      {
        id: 'all',
        label: 'كل التخصصات',
        active: !selectedSpecialty,
        href: buildLink({ specialtyId: undefined }),
      },
      ...specialties.slice(0, 4).map((specialty) => ({
        id: `specialty-${specialty.id}`,
        label: specialty.nameAr,
        active: selectedSpecialty === specialty.id,
        href: buildLink({ specialtyId: specialty.id.toString() }),
      })),
    ],
    [specialties, selectedSpecialty, searchTerm]
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UniversalHeaderClient
          prefix="doctors"
          title="دليل الأطباء"
          subtitle={total > 0 ? `عرض ${doctors.length} من ${total} طبيب` : 'لا توجد نتائج'}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={total}
          showMapButton
          mapEntityTypes={['clinic', 'hospital']}
          mapTitle="خريطة أماكن الأطباء"
          mapSubtitle="استعرض مواقع العيادات والمستشفيات المرتبطة بالأطباء"
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
          <Breadcrumb items={[{ label: 'دليل الأطباء' }]} className="mb-6" />

          {/* Filters */}
          <StaffFilters
            selectedSpecialty={selectedSpecialty}
            onSpecialtyChange={handleSpecialtyChange}
          />

          {/* Doctors Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-24 h-24 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <StaffCard
                  key={doctor.id}
                  staff={{
                    id: doctor.id,
                    nameAr: doctor.nameAr,
                    nameEn: doctor.nameEn,
                    slug: doctor.slug,
                    title: doctor.title,
                    image: doctor.image,
                    experience: doctor.experience,
                    ratingAvg: doctor.ratingAvg || 0,
                    ratingCount: doctor.ratingCount || 0,
                    isFeatured: doctor.isFeatured || false,
                    specialty: doctor.specialty,
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">جرب تغيير معايير البحث</p>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="px-4 py-2 bg-primary-500 text-white rounded-lg">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DoctorsPageContent />
    </Suspense>
  );
}
