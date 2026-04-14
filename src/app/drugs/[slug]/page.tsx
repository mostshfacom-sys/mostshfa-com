import { notFound, redirect } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import AdSensePlacement from '@/components/shared/AdSensePlacement';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DrugAlternatives, DrugDetailActions, DrugInteractions, PriceHistory } from '@/components/drugs';
import DrugImageZoom from '@/components/drugs/DrugImageZoom';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function splitDrugText(value?: string | null) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderDrugText(value?: string | null, tone: 'info' | 'success' | 'danger' = 'info') {
  const lines = splitDrugText(value);
  if (!lines.length) return null;

  const toneClasses = {
    info: {
      wrapper: 'bg-sky-50/70 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/40',
      bullet: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
      text: 'text-slate-700 dark:text-slate-200',
    },
    success: {
      wrapper: 'bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40',
      bullet: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
      text: 'text-slate-700 dark:text-slate-200',
    },
    danger: {
      wrapper: 'bg-rose-50/70 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40',
      bullet: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
      text: 'text-slate-700 dark:text-slate-200',
    },
  }[tone];

  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneClasses.wrapper}`}>
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const isBullet = /^[-•]/.test(line);
          const content = line.replace(/^[-•]\s*/, '');

          if (isBullet) {
            return (
              <div key={`${content}-${idx}`} className="flex items-start gap-3">
                <span className={`mt-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-black ${toneClasses.bullet}`}>
                  ✓
                </span>
                <p className={`text-sm leading-7 font-medium ${toneClasses.text}`}>{content}</p>
              </div>
            );
          }

          return (
            <p key={`${content}-${idx}`} className={`text-sm leading-8 font-medium ${toneClasses.text}`}>
              {content}
            </p>
          );
        })}
      </div>
    </div>
  );
}

async function getDrug(slug: string) {
  const slugCandidates = Array.from(
    new Set(
      [slug, decodeURIComponent(slug)]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .flatMap((value) => [value, value.toLowerCase()])
    )
  );

  for (const candidate of slugCandidates) {
    const drug = await prisma.drug.findUnique({
      where: { slug: candidate },
      include: { category: true },
    });

    if (drug) {
      return drug;
    }
  }

  const drug = await prisma.drug.findFirst({
    where: {
      OR: slugCandidates.map((candidate) => ({
        slug: {
          equals: candidate,
          mode: 'insensitive',
        },
      })),
    },
    include: { category: true },
  });

  return drug;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const drug = await getDrug(slug);
  if (!drug) return { title: 'دواء غير موجود' };

  const canonicalPath = `/drugs/${encodeURIComponent(drug.slug)}`;
  return {
    title: `${drug.nameAr} - دليل الأدوية | مستشفى`,
    description: drug.usage || `معلومات شاملة عن دواء ${drug.nameAr} - الاستخدامات، الجرعات، الآثار الجانبية، والتحذيرات`,
    keywords: [drug.nameAr, drug.nameEn || '', drug.activeIngredient || '', 'دواء', 'علاج'].filter(Boolean).join(', '),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${drug.nameAr} - دليل الأدوية`,
      description: drug.usage || `معلومات شاملة عن دواء ${drug.nameAr}`,
      type: 'article',
      url: canonicalPath,
    },
  };
}

export default async function DrugDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const drug = await getDrug(slug);
  if (!drug) notFound();

  const canonicalSlug = encodeURIComponent(drug.slug);
  if (slug !== drug.slug && slug !== canonicalSlug) {
    redirect(`/drugs/${canonicalSlug}`);
  }

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

  const infoCards = [
    { label: 'التصنيف', value: drug.category?.name || 'غير محدد' },
    { label: 'الشركة المنتجة', value: drug.company || 'غير متوفر' },
    { label: 'عدد الوحدات', value: drug.units ? `${drug.units} وحدة` : 'غير متوفر' },
    { label: 'آخر تحديث للسعر', value: drug.lastUpdatedPrice || 'غير متوفر' },
  ];

  const quickFacts = [
    { label: 'الاسم الإنجليزي', value: drug.nameEn || 'غير متوفر', dir: 'ltr' as const },
    { label: 'المادة الفعالة', value: drug.activeIngredient || 'غير متوفرة', dir: 'ltr' as const },
    { label: 'الشركة', value: drug.company || 'غير متوفرة' },
    { label: 'الباركود', value: drug.barcode || 'غير متوفر', dir: 'ltr' as const },
  ];

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
              <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] dark:bg-slate-900">
                <div className="bg-gradient-to-l from-primary-500/12 via-sky-500/8 to-emerald-500/10 p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="mx-auto sm:mx-0">
                      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-3 shadow-lg dark:border-white/10 dark:bg-slate-950/50">
                        <DrugImageZoom
                          src={drug.image}
                          alt={drug.nameAr}
                          drugId={drug.id}
                          size="lg"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {drug.category && <Badge variant="info">{drug.category.name}</Badge>}
                        {drug.activeIngredient && <Badge variant="success">المادة الفعالة</Badge>}
                        {drug.priceText && <Badge variant="primary">سعر متاح</Badge>}
                      </div>

                      <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{drug.nameAr}</h1>
                        {drug.nameEn && (
                          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400" dir="ltr">
                            {drug.nameEn}
                          </p>
                        )}
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {drug.activeIngredient
                            ? `يعرض هذا الملف الدوائي ملخصًا سريعًا عن ${drug.nameAr} ومادته الفعالة ${drug.activeIngredient} مع الجرعة والتحذيرات والبدائل المتاحة.`
                            : `يعرض هذا الملف الدوائي ملخصًا سريعًا عن ${drug.nameAr} مع أهم البيانات الطبية المتاحة والبدائل والتفاعلات.`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {infoCards.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
                          >
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.label}</div>
                            <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {drug.priceText && (
                        <div className="rounded-[1.75rem] border border-emerald-200/70 bg-emerald-50/90 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">السعر الحالي</div>
                              <div className="mt-1 text-3xl font-black text-emerald-700 dark:text-emerald-300">{drug.priceText}</div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                              {drug.oldPrice && (
                                <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-900/40">
                                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">السعر القديم</div>
                                  <div className="mt-1 font-bold text-slate-500 line-through dark:text-slate-400">{drug.oldPrice} جنيه</div>
                                </div>
                              )}
                              {drug.unitPrice && (
                                <div className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-900/40">
                                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">سعر الوحدة</div>
                                  <div className="mt-1 font-black text-slate-900 dark:text-white">{drug.unitPrice} جنيه</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">بطاقة سريعة للدواء</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">أهم البيانات المختصرة قبل قراءة التفاصيل الكاملة</p>
                  </div>
                  {drug.slug && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {drug.slug}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                      <div className="text-xs font-black text-slate-500 dark:text-slate-400">{fact.label}</div>
                      <div className="mt-2 text-sm font-extrabold text-slate-900 dark:text-slate-100" dir={fact.dir}>
                        {fact.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[2rem]">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                  </svg>
                  بيانات تفصيلية
                </h2>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  {drug.company && (
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الشركة المنتجة</span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">{drug.company}</span>
                    </div>
                  )}
                  {drug.barcode && (
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">الباركود الدولي</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-200 tracking-wider">{drug.barcode}</span>
                    </div>
                  )}
                  {drug.activeIngredient && (
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900 md:col-span-2">
                      <span className="block text-slate-500 dark:text-slate-400 mb-1 text-xs">المادة الفعالة</span>
                      <span className="font-medium text-slate-900 dark:text-slate-200" dir="ltr">{drug.activeIngredient}</span>
                    </div>
                  )}
                </div>
              </Card>

              {drug.usage && (
                <Card className="rounded-[2rem]">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    دواعي الاستعمال
                  </h2>
                  {renderDrugText(drug.usage, 'info')}
                </Card>
              )}

              <AdSensePlacement placementKey="drug_after_usage" fallbackSlot="5678901234" className="my-6" />

              {drug.dosage && (
                <Card className="rounded-[2rem]">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    الجرعة وطريقة الاستعمال
                  </h2>
                  {renderDrugText(drug.dosage, 'success')}
                </Card>
              )}

              {drug.contraindications && (
                <Card className="rounded-[2rem]">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    موانع الاستعمال والتحذيرات
                  </h2>
                  {renderDrugText(drug.contraindications, 'danger')}
                </Card>
              )}

              <DrugAlternatives drugSlug={drug.slug} />
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-primary-950 dark:text-white">
                <div className="space-y-5">
                  <div>
                    <div className="text-xs font-black tracking-[0.2em] text-primary-700 dark:text-primary-200/90">ملخص سريع</div>
                    <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">قبل استخدام الدواء</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      راجع المادة الفعالة والجرعة والتحذيرات، ثم استشر الطبيب أو الصيدلي إذا كانت لديك حالة مرضية مزمنة أو أدوية مرافقة.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {quickFacts.slice(1, 4).map((fact) => (
                      <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{fact.label}</div>
                        <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white" dir={fact.dir}>
                          {fact.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <DrugDetailActions
                drugId={drug.id}
                slug={drug.slug}
                nameAr={drug.nameAr}
                activeIngredient={drug.activeIngredient}
              />

              <PriceHistory currentPrice={drug.priceText || undefined} />

              <DrugInteractions
                currentDrug={{
                  id: drug.id,
                  nameAr: drug.nameAr,
                  nameEn: drug.nameEn || undefined,
                  activeIngredient: drug.activeIngredient || undefined,
                }}
              />

              {drug.disclaimer && (
                <Card className="rounded-[2rem] bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/40">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2 dark:text-yellow-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    تنبيه هام
                  </h2>
                  <p className="text-yellow-700 text-sm leading-7 dark:text-yellow-100/90">{drug.disclaimer}</p>
                </Card>
              )}

              <Card className="rounded-[2rem] bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-800 font-medium mb-1 dark:text-blue-100">نصيحة طبية</p>
                    <p className="text-blue-700 text-sm leading-7 dark:text-blue-100/85">
                      المعلومات المذكورة هنا للإرشاد فقط. يرجى استشارة الطبيب أو الصيدلي قبل استخدام أي دواء.
                    </p>
                  </div>
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
