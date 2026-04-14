import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import {
  buildDrugsLabWhere,
  DRUG_IMAGE_AVAILABILITY_FILTERS,
  DRUGS_LAB_LIMIT,
  filterAndRankDrugsLabResults,
  getDrugsLabOrderBy,
  parseDrugsLabPage,
  sanitizeDrugSearchInput,
} from '@/lib/search/drugs-lab';
import type { Metadata } from 'next';
import { DrugsSmartFiltersEnhanced } from '../drugs-lab/DrugsSmartFiltersEnhanced';
import DrugsSearchStatusBar from '../drugs-lab/DrugsSearchStatusBar';
import DrugsLabResultsClient from '../drugs-lab/ui/DrugsLabResultsClient';
import { 
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BeakerIcon,
  CurrencyPoundIcon,
  PhotoIcon,
  ShieldCheckIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function ChevronDownIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
  );
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دليل الأدوية في مصر | مستشفى.كوم',
  description: 'دليل أدوية حديث في مصر مع فلترة ذكية وتصنيفات واضحة وبطاقات عرض محسنة للوصول السريع إلى الدواء.',
  alternates: {
    canonical: '/drugs',
  },
  openGraph: {
    title: 'دليل الأدوية في مصر | مستشفى.كوم',
    description: 'دليل أدوية حديث في مصر مع فلترة ذكية وتصنيفات واضحة وبطاقات عرض محسنة للوصول السريع إلى الدواء.',
    url: '/drugs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل الأدوية في مصر | مستشفى.كوم',
    description: 'دليل أدوية حديث في مصر مع فلترة ذكية وتصنيفات واضحة وبطاقات عرض محسنة للوصول السريع إلى الدواء.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqItems: Array<{ question: string; answer: string; wide?: boolean }> = [
  {
    question: 'كيف أتأكد من صحة سعر الدواء؟',
    answer:
      'الأسعار في دليلنا يتم تحديثها دوريًا بناءً على البيانات المتاحة، لكن يبقى السعر النهائي المعتمد هو السعر المطبوع على العبوة وقت الشراء داخل الصيدلية.',
  },
  {
    question: 'هل يمكنني طلب الدواء من الموقع؟',
    answer:
      'الموقع دليل معلوماتي وليس صيدلية أونلاين، لذلك يمكنك استخدامه للبحث والمقارنة وفهم التركيبة، ثم الحصول على الدواء من القنوات الطبية المرخصة.',
  },
  {
    question: 'ماذا أفعل إذا لم أجد الدواء الذي أبحث عنه؟',
    answer:
      'جرّب الاسم الإنجليزي أو جزءًا من المادة الفعالة أو الشكل الدوائي مثل أقراص أو شراب أو كريم. وإذا لم تظهر النتيجة فقد يكون المنتج جديدًا جدًا أو غير مضاف بعد ضمن البيانات الحالية.',
    wide: true,
  },
  {
    question: 'هل يمكنني البحث باسم غير مكتمل أو مع نقاط وشرطات؟',
    answer:
      'نعم، لأن محرك البحث يطبّع كثيرًا من الفروقات الكتابية الشائعة في العربية ويزيل جزءًا كبيرًا من علامات الترقيم لتقريب النتائج الصحيحة.',
  },
  {
    question: 'كيف أستخدم التصنيف والشكل الدوائي معًا؟',
    answer:
      'اختر التصنيف أولًا لتقليل نطاق البحث، ثم استخدم الشكل الدوائي مثل مرهم أو شراب أو حقن للوصول إلى نتائج أكثر ارتباطًا بالحالة التي تبحث عنها.',
  },
  {
    question: 'هل يمكنني البحث بالمادة الفعالة بدل الاسم التجاري؟',
    answer:
      'نعم، ويمكن أن تكون هذه الطريقة أفضل للوصول إلى المثائل والبدائل. اكتب اسم المادة الفعالة ثم فعّل الفلاتر المناسبة لتضييق النتائج حسب الشكل أو التصنيف.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    hasPrice?: string;
    hasImage?: string;
    hasIngredient?: string;
    sort?: string;
    form?: string;
    view?: string;
    filterSearch?: string;
  };
}

async function getDrugs(searchParams: PageProps['searchParams']) {
  const page = parseDrugsLabPage(searchParams.page || '1');
  const limit = DRUGS_LAB_LIMIT;
  const sort = (searchParams.sort || '').trim();
  const normalizedSearch = sanitizeDrugSearchInput(searchParams.search || '');
  const where = buildDrugsLabWhere(searchParams);
  const orderBy = getDrugsLabOrderBy(sort);

  let total = 0;
  let availableImagesCount = 0;
  let categories: any[] = [];
  let pricedCount = 0;
  let ingredientCount = 0;
  let lastUpdatedResult: any = { _max: { updatedAt: null } };
  let topIngredients: any[] = [];
  let dbError: string | null = null;

  try {
    const results = await Promise.all([
      prisma.drug.count({ where }),
      prisma.drug.count({
        where: {
          ...where,
          ...DRUG_IMAGE_AVAILABILITY_FILTERS,
        },
      }),
      prisma.drugCategory.findMany({
        include: { _count: { select: { drugs: true } } },
        orderBy: { drugs: { _count: 'desc' } },
      }),
      prisma.drug.count({
        where: {
          ...where,
          priceText: { not: null, notIn: ['', '0', '0.00', '0.0'] },
        },
      }),
      prisma.drug.count({
        where: {
          ...where,
          activeIngredient: { not: null, notIn: ['', 'N/A'] },
        },
      }),
      prisma.drug.aggregate({ where, _max: { updatedAt: true } }),
      prisma.drug.groupBy({
        by: ['activeIngredient'],
        _count: { _all: true },
        orderBy: { _count: { activeIngredient: 'desc' } },
        take: 10,
        where: { activeIngredient: { not: null, notIn: ['', 'N/A'] } },
      }),
    ]) as [number, number, any[], number, number, any, any[]];

    [total, availableImagesCount, categories, pricedCount, ingredientCount, lastUpdatedResult, topIngredients] =
      results as any;
    topIngredients = (topIngredients as any[]) || [];
  } catch (e: any) {
    dbError = e?.message ? String(e.message) : 'Database connection error';
  }

  const drugForms = [
    { label: 'أقراص', value: 'أقراص' },
    { label: 'شراب', value: 'شراب' },
    { label: 'حقن', value: 'حقن' },
    { label: 'كبسول', value: 'كبسول' },
    { label: 'مرهم', value: 'مرهم' },
    { label: 'كريم', value: 'كريم' },
    { label: 'نقط', value: 'نقط' },
  ];

  const skip = (page - 1) * limit;
  let drugs: any[] = [];

  const shouldForceRealImagesOnly =
    (searchParams.hasImage || '').trim() === '1' || (searchParams.hasImage || '').trim() === 'true';

  if (!dbError) {
    try {
      if (normalizedSearch) {
        const candidates = await prisma.drug.findMany({
          where,
          include: { category: true },
          orderBy: { updatedAt: 'desc' },
          take: Math.max(limit * 30, 600),
        });
        const ranked = filterAndRankDrugsLabResults(candidates, normalizedSearch, sort);
        total = ranked.length;
        availableImagesCount = ranked.filter((drug) => {
          const image = String(drug.image || '').trim();
          return Boolean(image) && !image.startsWith('/images/defaults/');
        }).length;
        pricedCount = ranked.filter((drug) => {
          const value = String(drug.priceText || '').trim();
          return Boolean(value) && !['0', '0.0', '0.00'].includes(value);
        }).length;
        ingredientCount = ranked.filter((drug) => {
          const value = String(drug.activeIngredient || '').trim();
          return Boolean(value) && value !== 'N/A';
        }).length;
        const ingredientCounts = new Map<string, number>();
        ranked.forEach((drug) => {
          const key = String(drug.activeIngredient || '').trim();
          if (!key || key === 'N/A') return;
          ingredientCounts.set(key, (ingredientCounts.get(key) || 0) + 1);
        });
        topIngredients = Array.from(ingredientCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([activeIngredient, count]) => ({ activeIngredient, _count: { _all: count } }));
        drugs = ranked.slice(skip, skip + limit);
      } else if (shouldForceRealImagesOnly) {
        drugs = await prisma.drug.findMany({
          where: {
            ...where,
            ...DRUG_IMAGE_AVAILABILITY_FILTERS,
          },
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        });
      } else if (skip < availableImagesCount) {
        const realDrugs = await prisma.drug.findMany({
          where: {
            ...where,
            ...DRUG_IMAGE_AVAILABILITY_FILTERS,
          },
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        });
        drugs = [...realDrugs];

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
            orderBy,
            skip: 0,
            take: limit - drugs.length,
          });
          drugs = [...drugs, ...defaultDrugs];
        }
      } else {
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
          orderBy,
          skip: defaultSkip,
          take: limit,
        });
      }
    } catch (e: any) {
      dbError = dbError || (e?.message ? String(e.message) : 'Database connection error');
      drugs = [];
    }
  }

  return {
    drugs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories,
    availableImagesCount,
    pricedCount,
    ingredientCount,
    lastUpdated: lastUpdatedResult._max.updatedAt,
    drugForms,
    topIngredients,
    dbError,
  };
}

export default async function DrugsLabPage({ searchParams }: PageProps) {
  const data = await getDrugs(searchParams);
  const headerSubtitle =
    data.total > 0 ? `عرض ${data.drugs.length} من ${data.total} دواء` : 'لا توجد نتائج';
  const currentCategoryId = (searchParams.category || '').trim();
  const currentSearch = sanitizeDrugSearchInput(searchParams.search || '');
  const lastUpdatedLabel = data.lastUpdated
    ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(data.lastUpdated)
    : 'غير متوفر';
  const topIngredientLabels = data.topIngredients
    .map((item: any) => String(item.activeIngredient || '').trim())
    .filter(Boolean)
    .slice(0, 8);
  const seoHighlights = [
    {
      title: 'إجمالي الأدوية المفهرسة',
      value: data.total.toLocaleString('ar-EG'),
      description: 'نتائج قابلة للتصفية حسب المادة الفعالة والتصنيف.',
      icon: <TagIcon className="w-5 h-5" />,
      tone: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300',
    },
    {
      title: 'أسعار متاحة',
      value: data.pricedCount.toLocaleString('ar-EG'),
      description: 'تسهل مقارنة السعر الحالي قبل زيارة الصيدلية.',
      icon: <CurrencyPoundIcon className="w-5 h-5" />,
      tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    {
      title: 'أدوية مصوّرة',
      value: data.availableImagesCount.toLocaleString('ar-EG'),
      description: 'تقلل أخطاء اختيار العبوة وتسرّع الوصول للمنتج.',
      icon: <PhotoIcon className="w-5 h-5" />,
      tone: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
    {
      title: 'مواد فعالة مفهرسة',
      value: data.ingredientCount.toLocaleString('ar-EG'),
      description: 'تدعم الوصول للبدائل والمثائل بسهولة أكبر.',
      icon: <BeakerIcon className="w-5 h-5" />,
      tone: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300',
    },
  ];
  const seoTips = [
    'اكتب الاسم التجاري أو جزءًا من المادة الفعالة فقط، وسيتم تجاهل أغلب النقاط والشرطات والرموز.',
    'يمكنك الجمع بين البحث والنوع والتصنيف للحصول على نتائج أقرب وأسرع.',
    'فلتر الصور مناسب عند الحاجة إلى التعرف على العبوة قبل الشراء أو السؤال في الصيدلية.',
    'إذا لم تجد النتيجة المطلوبة جرّب صيغة عربية مختلفة مثل ا/أ/إ أو ة/ه وسيتم التطبيع تلقائيًا.',
  ];
  const seoUserJourneys = [
    {
      title: 'البحث عن دواء معروف',
      description: 'اكتب الاسم التجاري مباشرة وستظهر النتائج مع الصورة والسعر والتصنيف وروابط التفاصيل.',
      icon: <TagIcon className="w-5 h-5" />,
      tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    },
    {
      title: 'الوصول إلى البدائل',
      description: 'ابدأ بالمادة الفعالة أو الشكل الدوائي ثم راجع النتائج الأقرب من حيث التركيب والتحديث.',
      icon: <BeakerIcon className="w-5 h-5" />,
      tone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    },
    {
      title: 'مراجعة السعر والصورة',
      description: 'استخدم النتائج لتمييز العبوة سريعًا ومعرفة أحدث سعر متاح قبل الذهاب إلى الصيدلية.',
      icon: <CurrencyPoundIcon className="w-5 h-5" />,
      tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
  ];
  const seoTrustSignals = [
    `آخر تحديث ظاهر حاليًا: ${lastUpdatedLabel}`,
    `${data.availableImagesCount.toLocaleString('ar-EG')} دواء بصور فعلية لتقليل أخطاء اختيار العبوة`,
    `${data.pricedCount.toLocaleString('ar-EG')} منتج يحتوي على بيانات سعر تساعد في المقارنة`,
    `${data.ingredientCount.toLocaleString('ar-EG')} سجل بمادة فعالة موثقة يدعم البحث عن البدائل`,
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'دليل الأدوية في مصر',
    description: 'دليل أدوية حديث في مصر مع فلترة ذكية وتصنيفات واضحة وبطاقات عرض محسنة للوصول السريع إلى الدواء.',
    url: '/drugs',
    isPartOf: {
      '@type': 'WebSite',
      name: 'مستشفى.كوم',
      url: '/',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: '/drugs?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const viewMode = (searchParams.view || '').trim() === 'list' ? 'list' : 'grid';

  const initialResults = {
    total: data.total,
    totalPages: data.totalPages,
    page: data.page,
    drugs: data.drugs.map((drug: any) => ({
      id: drug.id,
      nameAr: drug.nameAr,
      nameEn: drug.nameEn,
      slug: drug.slug,
      activeIngredient: drug.activeIngredient,
      category: drug.category?.name || null,
      categoryId: drug.categoryId,
      priceText: drug.priceText,
      image: drug.image,
      updatedAt: drug.updatedAt,
      form: drug.form || drug.usage || null,
    })),
  };

  const buildLink = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.hasPrice) params.set('hasPrice', searchParams.hasPrice);
    if (searchParams.hasImage) params.set('hasImage', searchParams.hasImage);
    if (searchParams.hasIngredient) params.set('hasIngredient', searchParams.hasIngredient);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.form) params.set('form', searchParams.form);
    if (searchParams.view) params.set('view', searchParams.view);
    if (searchParams.filterSearch) params.set('filterSearch', searchParams.filterSearch);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    return query ? `/drugs?${query}` : '/drugs';
  };

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
      id: 'ingredients',
      label: 'مادة فعالة',
      value: data.ingredientCount,
      icon: 'group',
      color: '#8b5cf6',
    },
  ];

  const quickFilters = [
    {
      id: 'all',
      label: 'كل الأدوية',
      active: !searchParams.category,
      href: buildLink({ category: undefined, page: '1' }),
    },
    ...data.categories.slice(0, 4).map((category: any) => ({
      id: `category-${category.id}` as string,
      label: category.name,
      active: searchParams.category === String(category.id),
      href: buildLink({ category: String(category.id), page: '1' }),
    })),
  ];

  const seoKeywordGroups = [
    {
      title: 'أشهر أسماء الأدوية',
      description: 'روابط مباشرة لأكثر عمليات البحث شيوعًا داخل الدليل.',
      tone: 'from-sky-50 via-white to-cyan-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20',
      items: ['بانادول', 'أوجمنتين', 'بروفين', 'كونجستال', 'زيثروماكس', 'فولتارين']
        .filter(Boolean)
        .map((label) => ({ label, href: buildLink({ search: label, page: '1' }) })),
    },
    {
      title: 'مواد فعالة مرتبطة بالبدائل',
      description: 'تساعدك في مقارنة التركيبات والبدائل بسرعة.',
      tone: 'from-violet-50 via-white to-fuchsia-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20',
      items: topIngredientLabels.slice(0, 6).map((label) => ({ label, href: buildLink({ search: label, page: '1', hasIngredient: '1' }) })),
    },
    {
      title: 'أشكال دوائية جاهزة',
      description: 'ابدأ مباشرة بالشكل المناسب ثم ضيّق النتائج بعد ذلك.',
      tone: 'from-emerald-50 via-white to-teal-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20',
      items: data.drugForms.slice(0, 6).map((item) => ({ label: item.label, href: buildLink({ form: item.value, page: '1' }) })),
    },
  ].filter((group) => group.items.length > 0);
  const seoHelpfulLinks = [
    { label: 'دليل الأدوية الأساسي', href: '/drugs' },
    { label: 'مقارنة الخدمات الطبية', href: '/compare' },
    { label: 'البحث عن صيدليات', href: '/pharmacies' },
    { label: 'المعامل والتحاليل', href: '/labs' },
  ];
  const seoIntentSections = [
    {
      title: 'أسئلة شائعة يبحث عنها المستخدم',
      description: 'مثل: سعر دواء معين، بديل دواء، شكل الدواء، أو هل توجد صورة للعبوة.',
      items: ['سعر بانادول', 'بديل أوجمنتين', 'أدوية شراب للأطفال', 'مرهم موضعي للجلد'],
      tone: 'from-sky-50 via-white to-cyan-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20',
    },
    {
      title: 'عمليات بحث مرتبطة بالتركيب',
      description: 'تسهل الوصول إلى المثائل والمنتجات المتقاربة في الاستخدام أو المادة الفعالة.',
      items: topIngredientLabels.slice(0, 4),
      tone: 'from-violet-50 via-white to-fuchsia-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20',
    },
    {
      title: 'طرق تصفح سريعة داخل الدليل',
      description: 'ابدأ بالشكل الدوائي أو التصنيف ثم ضيّق النتيجة حسب الحاجة.',
      items: data.drugForms.slice(0, 4).map((item) => item.label),
      tone: 'from-emerald-50 via-white to-teal-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20',
    },
  ].filter((section) => section.items.length > 0);
  const seoCardClass =
    'rounded-[2.5rem] border border-slate-200/70 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none';
  const seoInnerCardClass =
    'rounded-[2rem] border border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40';


  // Schema.org ItemList for SEO
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'دليل الأدوية في مصر',
    description: 'قائمة شاملة بالأدوية المتاحة في السوق المصري مع الأسعار والبدائل.',
    numberOfItems: data.total,
    itemListElement: data.drugs.map((drug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalWebPage',
        name: drug.nameAr,
        url: `https://mostshfa.com/drugs/${encodeURIComponent(drug.slug)}`,
      },
    })),
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <UniversalHeaderClient
          prefix="drugs"
          title="دليل الأدوية"
          subtitle={headerSubtitle}
          counters={headerCounters}
          quickFilters={quickFilters}
          resultsCount={data.total}
          searchPlaceholder="ابحث بالاسم التجاري أو المادة الفعالة..."
          hideSearchOnMobile
          searchJumpTargetId="drugs-lab-search"
          searchJumpInputId="drugs-lab-search-input"
          categoriesHref="/drugs/categories"
          searchParamKey="search"
          pageParamKey="page"
          resetPageOnSearch
          showFilters={false}
          showViewToggle={true}
          gradientFrom="from-sky-500"
          gradientTo="to-blue-600"
          className="mb-8"
        />

        <div className="container-custom pb-16">

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-140px)] lg:overflow-auto scrollbar-hide pb-8 space-y-6">
              <DrugsSmartFiltersEnhanced
                categories={data.categories.map((c: any) => ({ id: c.id, name: c.name, count: c._count.drugs }))}
                activeCategoryId={currentCategoryId ? parseInt(currentCategoryId) : undefined}
                categoryQuery={searchParams.filterSearch}
              />
            </aside>

            <section>
              <DrugsSearchStatusBar
                searchValue={(searchParams.search || '').trim()}
                resultsCount={data.total}
                categories={data.categories.map((c: any) => ({ id: Number(c.id), name: String(c.name) }))}
                mobileFilters={
                  <DrugsSmartFiltersEnhanced
                    variant="mobileSheet"
                    triggerVariant="icon"
                    categories={data.categories.map((c: any) => ({ id: c.id, name: c.name, count: c._count.drugs }))}
                    activeCategoryId={currentCategoryId ? parseInt(currentCategoryId) : undefined}
                    categoryQuery={searchParams.filterSearch}
                  />
                }
              />

              {data.dbError && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  <div className="text-sm font-black">تعذر الاتصال بقاعدة البيانات حاليًا</div>
                  <div className="text-xs font-bold opacity-80">يرجى التأكد من تشغيل قاعدة البيانات/الاتصال ثم إعادة المحاولة.</div>
                </div>
              )}

              <DrugsLabResultsClient initial={initialResults} initialViewMode={viewMode} />

              <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-16">
                <Card
                  className="relative overflow-hidden rounded-[3rem] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-primary-50/70 px-8 py-10 text-slate-900 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-none"
                  padding="none"
                >
                  <div className="absolute inset-0">
                    <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/15" />
                    <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10" />
                  </div>
                  <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                      <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-black text-primary-700 shadow-sm backdrop-blur-md dark:border-primary-800/50 dark:bg-primary-900/30 dark:text-primary-300">
                        دليل أدوية مصر · بحث ذكي · نتائج قابلة للتصفية
                      </span>
                      <div>
                        <h2 className="text-3xl font-black leading-tight text-slate-900 dark:text-white md:text-4xl">
                          منصة عملية للبحث عن الأدوية في مصر بالاسم التجاري أو المادة الفعالة أو الشكل الدوائي
                        </h2>
                        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300 md:text-base">
                          تجمع هذه الصفحة بين سهولة التصفح وسرعة الوصول إلى نتائج دقيقة، مع إبراز الأسعار المتاحة والصور الحقيقية والتصنيفات الشائعة ومواد فعالة تساعد على مقارنة المثائل والبدائل قبل زيارة الصيدلية أو مراجعة الطبيب.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {seoHighlights.map((item) => (
                          <div key={item.title} className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>{item.icon}</div>
                            <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white">{item.value}</div>
                            <div className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">{item.title}</div>
                            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {seoUserJourneys.map((item) => (
                        <div key={item.title} className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                          <div className={`inline-flex rounded-2xl p-3 ${item.tone}`}>{item.icon}</div>
                          <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card className={`${seoCardClass} p-8`} padding="none">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary-100 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        <AdjustmentsHorizontalIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">كيف تستفيد من الصفحة عمليًا؟</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">سيناريوهات مفيدة للمستخدم وللبحث الداخلي بالموقع</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {seoTips.map((tip) => (
                        <div key={tip} className={`flex items-start gap-3 p-4 ${seoInnerCardClass}`}>
                          <div className="mt-1 rounded-xl bg-primary-100 p-2 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            <SparklesIcon className="w-4 h-4" />
                          </div>
                          <p className="text-sm font-bold leading-7 text-slate-700 dark:text-slate-200">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className={`${seoCardClass} p-8`} padding="none">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <ShieldCheckIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">إشارات ثقة ومحتوى داعم</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">عناصر مفيدة للمستخدم وتمنح الصفحة ثراءً أوضح لمحركات البحث</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {seoTrustSignals.map((item) => (
                        <div key={item} className={`${seoInnerCardClass} px-4 py-3 text-sm font-bold leading-7 text-slate-700 dark:text-slate-200`}>
                          {item}
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className={`${seoInnerCardClass} px-4 py-3`}>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">التصنيفات المتاحة</div>
                          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">{data.categories.length.toLocaleString('ar-EG')}</div>
                        </div>
                        <div className={`${seoInnerCardClass} px-4 py-3`}>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">البحث الحالي</div>
                          <div className="mt-1 text-sm font-black text-primary-700 dark:text-primary-300">{currentSearch || 'كل الأدوية'}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {seoIntentSections.length > 0 && (
                  <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {seoIntentSections.map((section) => (
                      <Card
                        key={section.title}
                        className={`rounded-[2.5rem] border border-slate-200/70 bg-gradient-to-br ${section.tone} p-8 shadow-xl shadow-slate-200/30 dark:border-slate-800 dark:shadow-none`}
                        padding="none"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-white/80 p-3 text-primary-600 shadow-sm dark:bg-slate-900/70 dark:text-primary-300">
                            <SparklesIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{section.title}</h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {section.items.map((item) => (
                            <span
                              key={`${section.title}-${item}`}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {seoKeywordGroups.length > 0 && (
                  <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {seoKeywordGroups.map((group) => (
                      <Card
                        key={group.title}
                        className={`rounded-[2.5rem] border border-slate-200/70 bg-gradient-to-br ${group.tone} p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:shadow-none`}
                        padding="none"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-white/80 p-3 text-primary-600 shadow-sm dark:bg-slate-900/70 dark:text-primary-300">
                            <SparklesIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{group.title}</h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {group.items.map((item) => (
                            <Link
                              key={`${group.title}-${item.label}`}
                              href={item.href}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-900/50 dark:hover:text-primary-300"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                  {topIngredientLabels.length > 0 && (
                    <Card className={`${seoCardClass} p-8`} padding="none">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          <BeakerIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">مواد فعالة شائعة في قاعدة البيانات</h3>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">نقطة بداية ممتازة لمن يبحث عن البدائل والمثائل والخيارات القريبة في الاستخدام</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {topIngredientLabels.map((ingredient) => (
                          <Link
                            key={ingredient}
                            href={buildLink({ search: ingredient, hasIngredient: '1', page: '1' })}
                            className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-700 transition-transform hover:-translate-y-0.5 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300"
                          >
                            {ingredient}
                          </Link>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Card className={`${seoCardClass} p-8`} padding="none">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        <ArrowPathIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">روابط مفيدة داخل الموقع</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تدعم تنقل المستخدم بين أقسام مرتبطة وتعزز البنية الداخلية للمحتوى</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {seoHelpfulLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-extrabold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-primary-900/50 dark:hover:text-primary-300"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className={`mt-10 relative overflow-hidden rounded-[3rem] p-8 lg:p-12 ${seoCardClass}`} padding="none">
                  <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-500/5 blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-64 w-64 translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />

                  <div className="relative z-10">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="h-1.5 w-12 rounded-full bg-primary-500" />
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">الأسئلة الشائعة حول الأدوية والبحث داخل الدليل</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {faqItems.map((item) => (
                        <details
                          key={item.question}
                          className={`group p-6 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm open:bg-white open:shadow-xl open:shadow-slate-200/50 dark:open:bg-slate-800 dark:open:shadow-none ${seoInnerCardClass} ${item.wide ? 'lg:col-span-2' : ''}`}
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                            <span className="font-extrabold text-slate-900 dark:text-white">{item.question}</span>
                            <div className="rounded-xl bg-white p-2 shadow-sm transition-transform group-open:rotate-180 dark:bg-slate-700">
                              <ChevronDownIcon className="w-4 h-4 text-primary-500" />
                            </div>
                          </summary>
                          <div className="mt-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                            {item.answer}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
