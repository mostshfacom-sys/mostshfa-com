import { notFound } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { EntityThumbnail } from '@/components/ui/EntityImage';
import LabDetailMap from '@/components/labs/LabDetailMap';
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

  const hasMap = typeof lab.lat === 'number' && typeof lab.lng === 'number';
  const locationText = [lab.governorate?.nameAr, lab.city?.nameAr].filter(Boolean).join(' - ');
  const contactRows = [
    { label: 'الهاتف', value: lab.phone, href: lab.phone ? `tel:${lab.phone}` : undefined },
    {
      label: 'واتساب',
      value: lab.whatsapp,
      href: lab.whatsapp ? `https://wa.me/${lab.whatsapp.replace(/\D/g, '')}` : undefined,
    },
    { label: 'البريد', value: lab.email, href: lab.email ? `mailto:${lab.email}` : undefined },
    { label: 'الموقع', value: lab.website ? 'زيارة الموقع' : undefined, href: lab.website || undefined },
  ].filter((row) => row.value);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative container-custom py-10 text-white">
            <Breadcrumb
              items={[
                { label: 'المعامل', href: '/labs' },
                { label: lab.nameAr },
              ]}
              className="mb-6"
            />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <EntityThumbnail
                  src={lab.logo}
                  alt={lab.nameAr}
                  entityType="lab"
                  size="lg"
                  className="shrink-0 border-4 border-white/30"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{lab.nameAr}</h1>
                  {lab.nameEn && <p className="mt-1 text-white/80" dir="ltr">{lab.nameEn}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {lab.isOpen && <Badge variant="success">مفتوح الآن</Badge>}
                    {lab.hasHomeSampling && <Badge variant="primary">سحب منزلي</Badge>}
                    {lab.isFeatured && <Badge variant="warning">مميز</Badge>}
                    {locationText && <Badge variant="secondary">{locationText}</Badge>}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3">
                {lab.ratingAvg > 0 ? (
                  <div className="flex items-center gap-3">
                    <Rating value={Number(lab.ratingAvg)} count={lab.ratingCount} />
                  </div>
                ) : (
                  <span className="text-white/80">لا توجد تقييمات حتى الآن</span>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="container-custom py-8">
          <Breadcrumb
            items={[
              { label: 'المعامل', href: '/labs' },
              { label: lab.nameAr },
            ]}
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card padding="lg">
                <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">عن المعمل</h2>
                <p className="leading-8 text-slate-600 dark:text-slate-300">
                  {lab.descriptionAr || `معمل ${lab.nameAr} يقدم خدمات التحاليل الطبية في ${locationText || 'مصر'}.`}
                </p>
              </Card>

              <Card padding="lg">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">الخدمات والمميزات</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-xl border p-4 ${lab.hasHomeSampling ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                    <p className="font-semibold text-slate-900 dark:text-white">السحب المنزلي</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lab.hasHomeSampling ? 'متاح لهذا المعمل' : 'غير متاح حالياً'}</p>
                  </div>
                  <div className={`rounded-xl border p-4 ${lab.isOpen ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                    <p className="font-semibold text-slate-900 dark:text-white">حالة المعمل</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lab.isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</p>
                  </div>
                </div>
              </Card>

              {hasMap && (
                <Card padding="lg">
                  <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">الخريطة التفاعلية</h2>
                  <LabDetailMap
                    id={lab.id}
                    name={lab.nameAr}
                    slug={lab.slug}
                    lat={lab.lat as number}
                    lng={lab.lng as number}
                    address={lab.addressAr}
                    rating={lab.ratingAvg}
                  />
                </Card>
              )}
            </div>

            <aside className="space-y-6">
              <Card padding="lg">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">معلومات التواصل</h3>
                <div className="space-y-3">
                  {contactRows.map((row) => (
                    row.href ? (
                      <a
                        key={row.label}
                        href={row.href}
                        target={row.href.startsWith('http') ? '_blank' : undefined}
                        rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                        <span className="text-slate-900 dark:text-white" dir={row.label === 'الهاتف' ? 'ltr' : 'rtl'}>{row.value}</span>
                      </a>
                    ) : null
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">الموقع</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {lab.governorate && <p><span className="font-semibold">المحافظة:</span> {lab.governorate.nameAr}</p>}
                  {lab.city && <p><span className="font-semibold">المدينة:</span> {lab.city.nameAr}</p>}
                  {lab.addressAr && <p><span className="font-semibold">العنوان:</span> {lab.addressAr}</p>}
                  {!hasMap && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      لا تتوفر إحداثيات دقيقة لهذا المعمل حالياً.
                    </p>
                  )}
                </div>
              </Card>

              {lab.hours && (
                <Card padding="lg">
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">ساعات العمل</h3>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{lab.hours}</p>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
