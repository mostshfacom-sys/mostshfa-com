import { notFound } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DrugAlternatives, DrugInteractions, PriceHistory } from '@/components/drugs';
import { EntityThumbnail } from '@/components/ui/EntityImage';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getDrug(slug: string) {
  const drug = await prisma.drug.findUnique({
    where: { slug },
    include: { category: true },
  });
  return drug;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const drug = await getDrug(slug);
  if (!drug) return { title: 'دواء غير موجود' };
  
  return {
    title: `${drug.nameAr} - دليل الأدوية | مستشفى`,
    description: drug.usage || `معلومات شاملة عن دواء ${drug.nameAr} - الاستخدامات، الجرعات، الآثار الجانبية، والتحذيرات`,
    keywords: [drug.nameAr, drug.nameEn || '', drug.activeIngredient || '', 'دواء', 'علاج'].filter(Boolean).join(', '),
    openGraph: {
      title: `${drug.nameAr} - دليل الأدوية`,
      description: drug.usage || `معلومات شاملة عن دواء ${drug.nameAr}`,
      type: 'article',
    },
  };
}

export default async function DrugDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const drug = await getDrug(slug);
  if (!drug) notFound();

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: drug.nameAr,
    alternateName: drug.nameEn,
    activeIngredient: drug.activeIngredient,
    description: drug.usage,
    dosageForm: drug.dosage,
    warning: drug.contraindications,
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container-custom py-8">
          <Breadcrumb items={[{ label: 'دليل الأدوية', href: '/drugs' }, { label: drug.nameAr }]} className="mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Drug Header Card */}
              <Card>
                <div className="flex items-start gap-4">
                  <EntityThumbnail
                    src={drug.image}
                    alt={drug.nameAr}
                    entityType="drug"
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{drug.nameAr}</h1>
                    {drug.nameEn && <p className="text-slate-500 dark:text-slate-400 mb-2" dir="ltr">{drug.nameEn}</p>}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {drug.category && <Badge variant="info">{drug.category.name}</Badge>}
                      {drug.activeIngredient && <Badge variant="success">المادة الفعالة: {drug.activeIngredient}</Badge>}
                    </div>
                    {drug.priceText && (
                      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">السعر الحالي</p>
                            <span className="text-2xl text-emerald-700 dark:text-emerald-300 font-bold">{drug.priceText}</span>
                          </div>
                          {drug.oldPrice && (
                            <div className="opacity-70">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">السعر القديم</p>
                              <span className="text-lg text-slate-500 dark:text-slate-400 font-medium line-through">{drug.oldPrice} جنيه</span>
                            </div>
                          )}
                          {drug.unitPrice && (
                            <div className="hidden sm:block pl-4 border-r border-emerald-200 dark:border-emerald-800">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">سعر الوحدة</p>
                              <span className="text-lg text-emerald-700 dark:text-emerald-300 font-medium">{drug.unitPrice} جنيه</span>
                            </div>
                          )}
                        </div>
                        {drug.lastUpdatedPrice && (
                          <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
                            <span className="text-emerald-600/80 dark:text-emerald-400/80">آخر تحديث للسعر: {drug.lastUpdatedPrice}</span>
                            {drug.units && <span className="text-emerald-600/80 dark:text-emerald-400/80">العبوة: {drug.units} وحدة</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Data Grid Card - New Fields */}
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                  </svg>
                  بيانات تفصيلية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {drug.company && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الشركة المنتجة</span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">{drug.company}</span>
                    </div>
                  )}
                  {drug.barcode && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الباركود الدولي</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-200 tracking-wider">{drug.barcode}</span>
                    </div>
                  )}
                  {drug.activeIngredient && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg md:col-span-2">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">المادة الفعالة</span>
                      <span className="font-medium text-slate-900 dark:text-slate-200" dir="ltr">{drug.activeIngredient}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Usage Section */}
              {drug.usage && (
                <Card>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    دواعي الاستعمال
                  </h2>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {drug.usage.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('-') || line.startsWith('•') ? 'mr-4' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </Card>
              )}

              {/* Dosage Section */}
              {drug.dosage && (
                <Card>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    الجرعة وطريقة الاستعمال
                  </h2>
                  <div className="text-slate-600 dark:text-slate-200 leading-relaxed bg-green-50 p-4 rounded-lg border border-green-100 dark:bg-emerald-900/30 dark:border-emerald-900/40">
                    {drug.dosage.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('-') || line.startsWith('•') ? 'mr-4 mb-1' : 'mb-2'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </Card>
              )}

              {/* Contraindications Section */}
              {drug.contraindications && (
                <Card>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    موانع الاستعمال والتحذيرات
                  </h2>
                  <div className="text-slate-600 dark:text-slate-200 leading-relaxed bg-red-50 p-4 rounded-lg border border-red-100 dark:bg-rose-900/30 dark:border-rose-900/40">
                    {drug.contraindications.split('\n').map((line, idx) => (
                      <p key={idx} className={line.startsWith('-') || line.startsWith('•') ? 'mr-4 mb-1' : 'mb-2'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </Card>
              )}

              {/* Share Section */}
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">مشاركة</h2>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    فيسبوك
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    واتساب
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    نسخ الرابط
                  </button>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Active Ingredient Card */}
              {drug.activeIngredient && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/40 dark:to-slate-900 dark:border-blue-800/40">
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    المادة الفعالة
                  </h2>
                  <p className="text-blue-800 dark:text-blue-200 font-medium text-lg">{drug.activeIngredient}</p>
                </Card>
              )}

              {/* Price History Component */}
              <PriceHistory currentPrice={drug.priceText || undefined} />

              {/* Drug Alternatives Component */}
              <DrugAlternatives drugSlug={drug.slug} />

              {/* Drug Interactions Component */}
              <DrugInteractions currentDrug={{ id: drug.id, nameAr: drug.nameAr }} />

              {/* Disclaimer Card */}
              {drug.disclaimer && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    تنبيه هام
                  </h2>
                  <p className="text-yellow-700 text-sm">{drug.disclaimer}</p>
                </Card>
              )}

              {/* Medical Advice Card */}
              <Card className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-800 font-medium mb-1">نصيحة طبية</p>
                    <p className="text-blue-700 text-sm">
                      المعلومات المذكورة هنا للإرشاد فقط. يرجى استشارة الطبيب أو الصيدلي قبل استخدام أي دواء.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">إجراءات سريعة</h2>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    البحث عن صيدليات قريبة
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    إضافة للمفضلة
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    طباعة المعلومات
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
