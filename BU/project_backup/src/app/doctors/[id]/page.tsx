import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import DoctorWorkplaceMap from '@/components/doctors/DoctorWorkplaceMap';
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getStaff(id: number) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        specialty: true,
        hospitalStaff: {
          include: {
            hospital: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                phone: true,
                address: true,
                lat: true,
                lng: true,
                governorate: { select: { nameAr: true } },
                city: { select: { nameAr: true } },
              },
            },
          },
        },
        clinicStaff: {
          include: {
            clinic: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                phone: true,
                addressAr: true,
                lat: true,
                lng: true,
                governorate: { select: { nameAr: true } },
                city: { select: { nameAr: true } },
              },
            },
          },
        },
      },
    });
    
    if (!staff) return null;
    
    // Transform to include hospital and clinic directly
    const hospital = staff.hospitalStaff[0]?.hospital || null;
    const clinic = staff.clinicStaff[0]?.clinic || null;
    
    return {
      ...staff,
      hospital,
      clinic,
    };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const staffId = parseInt(id);
  
  if (isNaN(staffId)) {
    return { title: 'الطبيب غير موجود' };
  }

  const staff = await getStaff(staffId);

  if (!staff) {
    return { title: 'الطبيب غير موجود' };
  }

  const title = `${staff.title || 'د.'} ${staff.nameAr}`;
  const description = staff.bio || `${title} - ${staff.specialty?.nameAr || 'طبيب'}`;

  return {
    title: `${title} | مستشفى.كوم`,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: staff.image ? [staff.image] : [],
    },
  };
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const staffId = parseInt(id);

  if (isNaN(staffId)) {
    notFound();
  }

  const staff = await getStaff(staffId);

  if (!staff) {
    notFound();
  }

  const workplace = staff.hospital || staff.clinic;
  const workplaceType = staff.hospital ? 'hospitals' : 'clinics';
  const workplaceAddress = staff.hospital?.address || staff.clinic?.addressAr;
  const workplaceLocation = workplace ? 
    [workplace.governorate?.nameAr, workplace.city?.nameAr].filter(Boolean).join('، ') : '';
  const workplaceLat = staff.hospital?.lat ?? staff.clinic?.lat ?? null;
  const workplaceLng = staff.hospital?.lng ?? staff.clinic?.lng ?? null;
  const hasWorkplaceMap = typeof workplaceLat === 'number' && typeof workplaceLng === 'number';

  const breadcrumbItems = [
    { label: 'الرئيسية', href: '/' },
    { label: 'دليل الأطباء', href: '/doctors' },
    { label: staff.nameAr },
  ];

  // Parse available days if exists
  let availableDays: string[] = [];
  if (staff.availableDays) {
    try {
      availableDays = JSON.parse(staff.availableDays);
    } catch {
      availableDays = staff.availableDays.split(',').map(d => d.trim());
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col lg:flex-row gap-8 mt-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Profile Card */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-l from-primary-500 to-primary-600 p-6 text-white">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Image */}
                    <div className="relative">
                      {staff.image ? (
                        <img
                          src={staff.image}
                          alt={staff.nameAr}
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                          <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {staff.isFeatured && (
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-right">
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        {staff.title && <span className="text-white/80">{staff.title} </span>}
                        {staff.nameAr}
                      </h1>
                      {staff.nameEn && (
                        <p className="text-white/80 mb-3" dir="ltr">{staff.nameEn}</p>
                      )}
                      {staff.specialty && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {staff.specialty.nameAr}
                        </Badge>
                      )}
                      {staff.ratingCount > 0 && (
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                          <Rating value={staff.ratingAvg} size="md" />
                          <span className="text-white/80">({staff.ratingCount} تقييم)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {staff.experience && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{staff.experience}</p>
                        <p className="text-sm text-gray-500">سنة خبرة</p>
                      </div>
                    )}
                    {staff.ratingAvg > 0 && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{staff.ratingAvg.toFixed(1)}</p>
                        <p className="text-sm text-gray-500">التقييم</p>
                      </div>
                    )}
                    {staff.consultationFee && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-primary-600">{staff.consultationFee}</p>
                        <p className="text-sm text-gray-500">جنيه / كشف</p>
                      </div>
                    )}
                    {staff.languages && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-lg font-bold text-primary-600">{staff.languages}</p>
                        <p className="text-sm text-gray-500">اللغات</p>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {staff.bio && (
                    <div className="mb-6">
                      <h2 className="font-semibold text-gray-900 mb-3">نبذة عن الطبيب</h2>
                      <p className="text-gray-600 leading-relaxed">{staff.bio}</p>
                    </div>
                  )}

                  {/* Education */}
                  {staff.education && (
                    <div className="mb-6">
                      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        المؤهلات العلمية
                      </h2>
                      <p className="text-gray-600">{staff.education}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {staff.certifications && (
                    <div className="mb-6">
                      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        الشهادات والزمالات
                      </h2>
                      <p className="text-gray-600">{staff.certifications}</p>
                    </div>
                  )}

                  {/* Available Days */}
                  {availableDays.length > 0 && (
                    <div className="mb-6">
                      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        أيام العمل
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {availableDays.map((day, index) => (
                          <Badge key={index} variant="secondary">{day}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {workplace && hasWorkplaceMap && (
                    <div className="mb-6">
                      <h2 className="font-semibold text-gray-900 mb-3">الخريطة التفاعلية</h2>
                      <DoctorWorkplaceMap
                        marker={{
                          id: `${staff.hospital ? 'hospital' : 'clinic'}-${workplace.id}`,
                          name: workplace.nameAr,
                          type: staff.hospital ? 'hospital' : 'clinic',
                          lat: workplaceLat as number,
                          lng: workplaceLng as number,
                          slug: workplace.slug,
                          address: workplaceAddress || undefined,
                        }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Contact Card */}
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">معلومات الاتصال</h3>
                  <div className="space-y-3">
                    {staff.phone && (
                      <a
                        href={`tel:${staff.phone}`}
                        className="flex items-center gap-3 p-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span dir="ltr">{staff.phone}</span>
                      </a>
                    )}
                    {staff.email && (
                      <a
                        href={`mailto:${staff.email}`}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{staff.email}</span>
                      </a>
                    )}
                  </div>
                </Card>

                {/* Workplace Card */}
                {workplace && (
                  <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">مكان العمل</h3>
                    <Link
                      href={`/${workplaceType}/${workplace.slug}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{workplace.nameAr}</p>
                          {workplaceLocation && (
                            <p className="text-sm text-gray-500 mt-1">{workplaceLocation}</p>
                          )}
                          {workplaceAddress && (
                            <p className="text-sm text-gray-500 mt-1">{workplaceAddress}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                )}

                {/* Quick Links */}
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">روابط سريعة</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/doctors" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        دليل الأطباء
                      </Link>
                    </li>
                    <li>
                      <Link href="/hospitals" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        دليل المستشفيات
                      </Link>
                    </li>
                    <li>
                      <Link href="/clinics" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        دليل العيادات
                      </Link>
                    </li>
                  </ul>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
