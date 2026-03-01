import { notFound } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { EntityThumbnail } from '@/components/ui/EntityImage';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getLab(slug: string) {
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: { governorate: true, city: true },
  });
  return lab;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lab = await getLab(slug);
  if (!lab) return { title: 'معمل غير موجود' };
  
  return {
    title: lab.nameAr,
    description: lab.descriptionAr || `${lab.nameAr} - معمل تحاليل طبية في ${lab.governorate?.nameAr || 'مصر'}`,
    openGraph: {
      title: `${lab.nameAr} | مستشفى`,
      description: lab.descriptionAr || `${lab.nameAr} - معمل تحاليل طبية`,
    },
  };
}

export default async function LabDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lab = await getLab(slug);
  if (!lab) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <Breadcrumb
            items={[
              { label: 'المعامل', href: '/labs' },
              { label: lab.nameAr },
            ]}
            className="mb-6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card>
                <div className="flex items-start gap-4">
                  <EntityThumbnail
                    src={lab.logo}
                    alt={lab.nameAr}
                    entityType="lab"
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{lab.nameAr}</h1>
                    {lab.nameEn && <p className="text-gray-500 mb-2" dir="ltr">{lab.nameEn}</p>}
                    <div className="flex items-center gap-4 flex-wrap">
                      {lab.ratingAvg > 0 && (
                        <Rating value={Number(lab.ratingAvg)} count={lab.ratingCount} />
                      )}
                      {lab.isOpen && <Badge variant="success">مفتوح الآن</Badge>}
                      {lab.hasHomeSampling && <Badge variant="primary">سحب منزلي</Badge>}
                      {lab.isFeatured && <Badge variant="warning">مميز</Badge>}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description */}
              {lab.descriptionAr && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">عن المعمل</h2>
                  <p className="text-gray-600 leading-relaxed">{lab.descriptionAr}</p>
                </Card>
              )}

              {/* Services */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">الخدمات</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${lab.hasHomeSampling ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${lab.hasHomeSampling ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className={`font-medium ${lab.hasHomeSampling ? 'text-green-700' : 'text-gray-500'}`}>سحب منزلي</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {lab.hasHomeSampling ? 'متاح' : 'غير متاح'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الاتصال</h2>
                <div className="space-y-3">
                  {lab.phone && (
                    <a href={`tel:${lab.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-primary-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span dir="ltr">{lab.phone}</span>
                    </a>
                  )}
                  {lab.whatsapp && (
                    <a href={`https://wa.me/${lab.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>واتساب</span>
                    </a>
                  )}
                  {lab.website && (
                    <a href={lab.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-primary-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>الموقع الإلكتروني</span>
                    </a>
                  )}
                </div>
              </Card>

              {/* Location */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">الموقع</h2>
                <div className="space-y-2 text-gray-600">
                  {lab.governorate && (
                    <p><span className="font-medium">المحافظة:</span> {lab.governorate.nameAr}</p>
                  )}
                  {lab.city && (
                    <p><span className="font-medium">المدينة:</span> {lab.city.nameAr}</p>
                  )}
                  {lab.addressAr && (
                    <p><span className="font-medium">العنوان:</span> {lab.addressAr}</p>
                  )}
                </div>
              </Card>

              {/* Working Hours */}
              {lab.hours && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">ساعات العمل</h2>
                  <p className="text-gray-600">{lab.hours}</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
