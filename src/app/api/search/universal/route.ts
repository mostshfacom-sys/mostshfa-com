import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { buildSearchTerms, normalizeArabic } from '@/lib/search/arabic-normalization';
import { GUIDES } from '@/config/guide-config';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Schema للتحقق من صحة المدخلات
const UniversalSearchSchema = z.object({
  query: z.string().min(1),
  entityTypes: z.array(z.enum(['hospital', 'clinic', 'lab', 'pharmacy', 'article', 'tool', 'drug', 'guide'])).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['relevance', 'rating', 'popularity', 'date']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filters: z.record(z.any()).optional(),
});

const getQueryTerms = (query: string) => {
  return buildSearchTerms(query, 16);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: any = Object.fromEntries(searchParams.entries());
    
    // معالجة entityTypes كـ array
    if (params.entityTypes) {
      try {
        params.entityTypes = JSON.parse(params.entityTypes);
      } catch {
        params.entityTypes = params.entityTypes.split(',').filter(Boolean);
      }
    }
    
    // التحقق من صحة المدخلات
    const searchParams_validated = UniversalSearchSchema.parse(params);
    
    const results = await performUniversalSearch(searchParams_validated);
    
    return NextResponse.json({
      success: true,
      ...results
    });
    
  } catch (error) {
    console.error('خطأ في البحث الموحد:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'معاملات البحث غير صحيحة',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي'
    }, { status: 500 });
  }
}

async function performUniversalSearch(params: z.infer<typeof UniversalSearchSchema>) {
  const { query, entityTypes, page, pageSize, sortBy, sortOrder, filters } = params;
  
  const searchResults: any[] = [];
  const entityCounts: Record<string, number> = {};
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) {
    return {
      results: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      facets: generateFacets([], {}),
      suggestions: [],
      searchTime: Date.now(),
      query,
    };
  }
  
  // تحديد الكيانات المراد البحث فيها
  const searchEntities = entityTypes || ['hospital', 'clinic', 'lab', 'pharmacy', 'article', 'tool', 'drug', 'guide'];
  
  // البحث في المستشفيات
  if (searchEntities.includes('hospital')) {
    const hospitals = await safeSearch('المستشفيات', () => searchHospitals(query, filters));
    searchResults.push(...hospitals.map(item => ({
      ...item,
      entityType: 'hospital',
      category: 'مستشفى',
      url: `/hospitals/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.hospital = hospitals.length;
  }
  
  // البحث في العيادات
  if (searchEntities.includes('clinic')) {
    const clinics = await safeSearch('العيادات', () => searchClinics(query, filters));
    searchResults.push(...clinics.map(item => ({
      ...item,
      entityType: 'clinic',
      category: 'عيادة',
      url: `/clinics/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.clinic = clinics.length;
  }
  
  // البحث في المختبرات
  if (searchEntities.includes('lab')) {
    const labs = await safeSearch('المختبرات', () => searchLabs(query, filters));
    searchResults.push(...labs.map(item => ({
      ...item,
      entityType: 'lab',
      category: 'مختبر',
      url: `/labs/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.lab = labs.length;
  }
  
  // البحث في الصيدليات
  if (searchEntities.includes('pharmacy')) {
    const pharmacies = await safeSearch('الصيدليات', () => searchPharmacies(query, filters));
    searchResults.push(...pharmacies.map(item => ({
      ...item,
      entityType: 'pharmacy',
      category: 'صيدلية',
      url: `/pharmacies/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.pharmacy = pharmacies.length;
  }
  
  // البحث في المقالات
  if (searchEntities.includes('article')) {
    const articles = await safeSearch('المقالات', () => searchArticles(query, filters));
    searchResults.push(...articles.map(item => ({
      ...item,
      entityType: 'article',
      category: 'مقال',
      url: `/articles/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.article = articles.length;
  }
  
  // البحث في الأدوات الطبية
  if (searchEntities.includes('tool')) {
    const tools = await safeSearch('الأدوات الطبية', () => searchMedicalTools(query, filters));
    searchResults.push(...tools.map(item => ({
      ...item,
      entityType: 'tool',
      category: 'أداة طبية',
      url: `/tools/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.tool = tools.length;
  }
  
  // البحث في الأدوية
  if (searchEntities.includes('drug')) {
    const drugs = await safeSearch('الأدوية', () => searchDrugs(query, filters));
    searchResults.push(...drugs.map(item => ({
      ...item,
      entityType: 'drug',
      category: 'دواء',
      url: `/drugs/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.drug = drugs.length;
  }

  if (searchEntities.includes('guide')) {
    const guides = safeSearchSync('الأدلة الطبية', () => searchGuides(query));
    searchResults.push(...guides.map(item => ({
      ...item,
      entityType: 'guide',
      category: 'دليل طبي',
      url: `/${item.slug}`,
      relevanceScore: calculateRelevanceScore(query, item.title, item.excerpt)
    })));
    entityCounts.guide = guides.length;
  }
  
  // ترتيب النتائج
  const sortedResults = sortResults(searchResults, sortBy, sortOrder);
  
  // تطبيق الصفحات
  const totalResults = sortedResults.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = sortedResults.slice(startIndex, endIndex);
  
  // إنشاء الاقتراحات
  const suggestions = await generateSearchSuggestions(query);
  
  // إنشاء الفلاتر المتاحة
  const facets = generateFacets(searchResults, entityCounts);
  
  return {
    results: paginatedResults,
    pagination: {
      page,
      pageSize,
      total: totalResults,
      totalPages: Math.ceil(totalResults / pageSize),
      hasNext: endIndex < totalResults,
      hasPrev: page > 1
    },
    facets,
    suggestions,
    searchTime: Date.now(), // يمكن تحسينها لحساب الوقت الفعلي
    query
  };
}

async function safeSearch<T>(label: string, handler: () => Promise<T[]>): Promise<T[]> {
  try {
    return await handler();
  } catch (error) {
    console.warn(`تحذير: تعذر البحث في ${label}:`, error);
    return [];
  }
}

function safeSearchSync<T>(label: string, handler: () => T[]): T[] {
  try {
    return handler();
  } catch (error) {
    console.warn(`تحذير: تعذر البحث في ${label}:`, error);
    return [];
  }
}

// دوال البحث للكيانات المختلفة
async function searchHospitals(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } }
    ]))
  };
  
  const hospitals = await prisma.hospital.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      description: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      type: {
        select: { nameAr: true }
      },
      governorate: {
        select: { nameAr: true }
      }
    },
    take: 50
  });
  
  return hospitals.map(hospital => ({
    entityId: hospital.id.toString(),
    title: hospital.nameAr,
    excerpt: hospital.description || `مستشفى ${hospital.type?.nameAr || ''} في ${hospital.governorate?.nameAr || ''}`,
    image: hospital.logo,
    rating: hospital.ratingAvg,
    ratingCount: hospital.ratingCount,
    isFeatured: hospital.isFeatured,
    slug: hospital.slug,
    createdAt: hospital.createdAt.toISOString()
  }));
}

async function searchClinics(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { descriptionAr: { contains: term, mode: 'insensitive' } },
      { addressAr: { contains: term, mode: 'insensitive' } }
    ]))
  };
  
  const clinics = await prisma.clinic.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      descriptionAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      }
    },
    take: 50
  });
  
  return clinics.map(clinic => ({
    entityId: clinic.id.toString(),
    title: clinic.nameAr,
    excerpt: clinic.descriptionAr || `عيادة في ${clinic.governorate?.nameAr || ''}`,
    image: clinic.logo,
    rating: clinic.ratingAvg,
    ratingCount: clinic.ratingCount,
    isFeatured: clinic.isFeatured,
    slug: clinic.slug,
    createdAt: clinic.createdAt.toISOString()
  }));
}

async function searchLabs(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { descriptionAr: { contains: term, mode: 'insensitive' } },
      { addressAr: { contains: term, mode: 'insensitive' } }
    ]))
  };
  
  const labs = await prisma.lab.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      descriptionAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      }
    },
    take: 50
  });
  
  return labs.map(lab => ({
    entityId: lab.id.toString(),
    title: lab.nameAr,
    excerpt: lab.descriptionAr || `مختبر في ${lab.governorate?.nameAr || ''}`,
    image: lab.logo,
    rating: lab.ratingAvg,
    ratingCount: lab.ratingCount,
    isFeatured: lab.isFeatured,
    slug: lab.slug,
    createdAt: lab.createdAt.toISOString()
  }));
}

async function searchPharmacies(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { descriptionAr: { contains: term, mode: 'insensitive' } },
      { addressAr: { contains: term, mode: 'insensitive' } }
    ]))
  };
  
  const pharmacies = await prisma.pharmacy.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      descriptionAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      is24h: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      }
    },
    take: 50
  });
  
  return pharmacies.map(pharmacy => ({
    entityId: pharmacy.id.toString(),
    title: pharmacy.nameAr,
    excerpt: pharmacy.descriptionAr || `صيدلية ${pharmacy.is24h ? '24 ساعة' : ''} في ${pharmacy.governorate?.nameAr || ''}`,
    image: pharmacy.logo,
    rating: pharmacy.ratingAvg,
    ratingCount: pharmacy.ratingCount,
    isFeatured: pharmacy.isFeatured,
    slug: pharmacy.slug,
    createdAt: pharmacy.createdAt.toISOString()
  }));
}

async function searchArticles(query: string, filters?: any) {
  const baseTerms = getQueryTerms(query);
  const normalizedQuery = normalizeArabic(query);
  const rawWords = query.trim().split(' ').filter(Boolean);
  const normalizedWords = normalizedQuery.split(' ').filter(Boolean);
  const wordTerms = new Set<string>([...rawWords, ...normalizedWords]);
  const expandedWordTerms = new Set<string>();

  const addWordVariants = (word: string) => {
    if (!word) return;
    expandedWordTerms.add(word);
    if (word.startsWith('و') && word.length > 1) {
      expandedWordTerms.add(word.slice(1));
    }
    if (word.startsWith('ال') && word.length > 2) {
      expandedWordTerms.add(word.slice(2));
    }
    if (word.startsWith('وال') && word.length > 3) {
      expandedWordTerms.add(word.slice(1));
      expandedWordTerms.add(word.slice(3));
    }
    if (word.startsWith('بال') && word.length > 3) {
      expandedWordTerms.add(word.slice(1));
      expandedWordTerms.add(word.slice(3));
    }
    if (word.startsWith('لل') && word.length > 2) {
      expandedWordTerms.add(word.slice(1));
      expandedWordTerms.add(word.slice(2));
    }
  };

  Array.from(wordTerms).forEach(addWordVariants);

  const terms = Array.from(new Set([
    ...baseTerms,
    ...Array.from(wordTerms),
    ...Array.from(expandedWordTerms),
  ]));
  const where: any = {
    AND: [
      { isPublished: true },
      {
        OR: terms.flatMap((term) => ([
          { title: { contains: term } },
          { excerpt: { contains: term } },
          { content: { contains: term } },
          { tags: { contains: term } },
          { slug: { contains: term } },
          { author: { contains: term } },
          {
            category: {
              is: {
                nameAr: { contains: term }
              }
            }
          }
        ]))
      }
    ]
  };
  
  const articles = await prisma.article.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      content: true,
      author: true,
      tags: true,
      views: true,
      isFeatured: true,
      createdAt: true,
      publishedAt: true,
      category: {
        select: { nameAr: true }
      }
    },
    take: 50
  });

  const fallbackArticles = articles.length
    ? articles
    : await prisma.article.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          image: true,
          author: true,
          tags: true,
          views: true,
          isFeatured: true,
          createdAt: true,
          publishedAt: true,
          category: {
            select: { nameAr: true }
          }
        },
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 200
      });

  const normalizedTerms = terms.map((term) => normalizeArabic(term)).filter(Boolean);
  const matchedArticles = articles.length
    ? fallbackArticles
    : fallbackArticles.filter((article) => {
        const rawText = `${article.title} ${article.excerpt ?? ''} ${article.content ?? ''} ${article.tags ?? ''} ${article.slug ?? ''} ${article.author ?? ''} ${article.category?.nameAr ?? ''}`;
        const haystack = normalizeArabic(rawText.replace(/<[^>]+>/g, ' '));
        const words = new Set(haystack.split(' ').filter(Boolean));
        return normalizedTerms.some((term) => term && (haystack.includes(term) || words.has(term)));
      });

  return matchedArticles.map(article => ({
    entityId: article.id.toString(),
    title: article.title,
    excerpt: article.excerpt || article.title,
    image: article.image,
    rating: 0,
    ratingCount: 0,
    isFeatured: article.isFeatured,
    slug: article.slug,
    createdAt: article.createdAt.toISOString(),
    views: article.views
  }));
}

async function searchMedicalTools(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    AND: [
      { isActive: true },
      {
        OR: terms.flatMap((term) => ([
          { nameAr: { contains: term, mode: 'insensitive' } },
          { nameEn: { contains: term, mode: 'insensitive' } },
          { descriptionAr: { contains: term, mode: 'insensitive' } },
          { descriptionEn: { contains: term, mode: 'insensitive' } }
        ]))
      }
    ]
  };
  
  const tools = await prisma.medicalTool.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      descriptionAr: true,
      featuredImage: true,
      averageRating: true,
      ratingCount: true,
      usageCount: true,
      isFeatured: true,
      toolType: true,
      createdAt: true
    },
    take: 50
  });
  
  return tools.map(tool => ({
    entityId: tool.id,
    title: tool.nameAr,
    excerpt: tool.descriptionAr,
    image: tool.featuredImage,
    rating: parseFloat(tool.averageRating.toString()),
    ratingCount: tool.ratingCount,
    isFeatured: tool.isFeatured,
    slug: tool.slug,
    createdAt: tool.createdAt.toISOString(),
    usageCount: tool.usageCount,
    toolType: tool.toolType
  }));
}

async function searchDrugs(query: string, filters?: any) {
  const terms = getQueryTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { activeIngredient: { contains: term, mode: 'insensitive' } },
      { usage: { contains: term, mode: 'insensitive' } }
    ]))
  };
  
  const drugs = await prisma.drug.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      slug: true,
      usage: true,
      image: true,
      activeIngredient: true,
      createdAt: true,
      category: {
        select: { name: true }
      }
    },
    take: 50
  });
  
  return drugs.map(drug => ({
    entityId: drug.id.toString(),
    title: drug.nameAr,
    excerpt: drug.usage || `دواء من فئة ${drug.category?.name || ''}`,
    image: drug.image,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    slug: drug.slug,
    createdAt: drug.createdAt.toISOString(),
    activeIngredient: drug.activeIngredient
  }));
}

function searchGuides(query: string) {
  const terms = getQueryTerms(query);
  const normalizedTerms = terms.map((term) => normalizeArabic(term));
  return Object.values(GUIDES)
    .filter((guide) => {
      const haystack = normalizeArabic(`${guide.title} ${guide.description} ${guide.keywords.join(' ')}`);
      return normalizedTerms.some((term) => haystack.includes(term));
    })
    .map((guide) => ({
      entityId: guide.slug,
      title: guide.title,
      excerpt: guide.subtitle || guide.description,
      image: guide.heroImage,
      rating: 0,
      ratingCount: 0,
      isFeatured: true,
      slug: guide.slug,
      createdAt: new Date().toISOString()
    }));
}

// دالة حساب درجة الصلة
function calculateRelevanceScore(query: string, title: string, excerpt?: string): number {
  const queryLower = normalizeArabic(query.toLowerCase());
  const titleLower = normalizeArabic(title.toLowerCase());
  const excerptLower = normalizeArabic(excerpt?.toLowerCase() || '');
  
  let score = 0;
  
  // تطابق كامل في العنوان
  if (titleLower === queryLower) score += 100;
  // يبدأ العنوان بالاستعلام
  else if (titleLower.startsWith(queryLower)) score += 80;
  // يحتوي العنوان على الاستعلام
  else if (titleLower.includes(queryLower)) score += 60;
  
  // تطابق في المقتطف
  if (excerptLower.includes(queryLower)) score += 20;
  
  // تطابق الكلمات المنفردة
  const queryWords = queryLower.split(' ');
  const titleWords = titleLower.split(' ');
  
  queryWords.forEach(queryWord => {
    titleWords.forEach(titleWord => {
      if (titleWord.includes(queryWord)) score += 10;
    });
  });
  
  return score;
}

// دالة ترتيب النتائج
function sortResults(results: any[], sortBy: string, sortOrder: string) {
  return results.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'relevance':
        comparison = b.relevanceScore - a.relevanceScore;
        break;
      case 'rating':
        comparison = b.rating - a.rating;
        break;
      case 'popularity':
        comparison = (b.usageCount || b.views || b.ratingCount || 0) - (a.usageCount || a.views || a.ratingCount || 0);
        break;
      case 'date':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      default:
        comparison = b.relevanceScore - a.relevanceScore;
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });
}

// دالة إنشاء اقتراحات البحث
async function generateSearchSuggestions(query: string): Promise<string[]> {
  const suggestions: string[] = [];
  const terms = getQueryTerms(query);
  if (!normalizeArabic(query)) {
    return [];
  }
  
  try {
    const hospitals = await prisma.hospital.findMany({
      where: {
        OR: terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } }))
      },
      select: { nameAr: true },
      take: 3
    });
    
    suggestions.push(...hospitals.map(h => h.nameAr));
    
    const articles = await prisma.article.findMany({
      where: {
        OR: terms.map((term) => ({ title: { contains: term, mode: 'insensitive' } })),
        isPublished: true
      },
      select: { title: true },
      take: 3
    });
    
    suggestions.push(...articles.map(a => a.title));

    const tools = await prisma.medicalTool.findMany({
      where: {
        isActive: true,
        OR: terms.map((term) => ({ nameAr: { contains: term, mode: 'insensitive' } }))
      },
      select: { nameAr: true },
      take: 3
    });
    suggestions.push(...tools.map(t => t.nameAr));
  } catch (error) {
    console.warn('تحذير: لا يمكن إنشاء اقتراحات البحث:', error);
  }

  const guideSuggestions = Object.values(GUIDES)
    .filter((guide) => {
      const haystack = normalizeArabic(`${guide.title} ${guide.description} ${guide.keywords.join(' ')}`);
      return terms.some((term) => haystack.includes(normalizeArabic(term)));
    })
    .map((guide) => guide.title);
  suggestions.push(...guideSuggestions);

  return Array.from(new Set(suggestions)).slice(0, 5);
}

// دالة إنشاء الفلاتر المتاحة
function generateFacets(results: any[], entityCounts: Record<string, number>) {
  const entityTypes = Object.entries(entityCounts).map(([type, count]) => ({
    type,
    count,
    label: getEntityTypeLabel(type)
  }));
  
  const ratings = [
    { range: '5', count: results.filter(r => r.rating >= 5).length },
    { range: '4+', count: results.filter(r => r.rating >= 4).length },
    { range: '3+', count: results.filter(r => r.rating >= 3).length },
    { range: '2+', count: results.filter(r => r.rating >= 2).length },
  ].filter(r => r.count > 0);
  
  return {
    entityTypes,
    ratings,
    featured: results.filter(r => r.isFeatured).length
  };
}

function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    hospital: 'مستشفيات',
    clinic: 'عيادات',
    lab: 'مختبرات',
    pharmacy: 'صيدليات',
    article: 'مقالات',
    tool: 'أدوات طبية',
    drug: 'أدوية',
    guide: 'الأدلة الطبية'
  };
  return labels[type] || type;
}
