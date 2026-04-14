import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { buildSearchTerms, compactArabic, normalizeArabic } from '@/lib/search/arabic-normalization';
import { GUIDES } from '@/config/guide-config';
import { DEFAULT_NAVBAR_CONFIG } from '@/lib/navigation/navbarConfig';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const SEARCH_ENTITY_TYPES = [
  'hospital',
  'clinic',
  'lab',
  'pharmacy',
  'article',
  'tool',
  'drug',
  'medical_info',
  'guide',
  'doctor',
  'video',
  'section',
] as const;

type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

type SearchCandidate = {
  entityId: string;
  title: string;
  excerpt?: string | null;
  image?: string | null;
  rating?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  slug?: string;
  createdAt?: string;
  views?: number;
  usageCount?: number;
  toolType?: string | null;
  activeIngredient?: string | null;
  category?: string | null;
  url: string;
  searchText?: string;
  relevanceScore?: number;
};

type SearchResultItem = SearchCandidate & { entityType: SearchEntityType };

type SearchCacheEntry = {
  createdAt: number;
  sortedResults: SearchResultItem[];
  entityCounts: Record<string, number>;
  suggestions: string[];
  facets: ReturnType<typeof generateFacets>;
  query: string;
};

const SEARCH_STOP_WORDS = new Set([
  'في',
  'من',
  'على',
  'عن',
  'الى',
  'إلى',
  'او',
  'أو',
  'ثم',
  'مع',
  'بعد',
  'قبل',
  'بين',
  'عند',
  'هذا',
  'هذه',
  'ذلك',
  'التي',
  'الذي',
  'هناك',
  'كل',
  'site',
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'to',
  'in',
]);

const SEARCH_CACHE_TTL_MS = 2 * 60 * 1000;
const universalSearchCache = new Map<string, SearchCacheEntry>();
const pendingUniversalSearches = new Map<string, Promise<SearchCacheEntry>>();
const DB_RETRY_DELAYS_MS = [140, 320];
const MAX_LOOKUP_TERMS = 14;

function isDatabaseConnectionError(error: unknown) {
  const name = String((error as { name?: string } | null)?.name || '');
  const message = String((error as { message?: string } | null)?.message || '');
  return (
    name.includes('PrismaClientInitializationError') ||
    message.includes("Can't reach database server") ||
    message.includes('Timed out fetching a new connection')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withDatabaseRetry<T>(handler: () => Promise<T>) {
  let attempt = 0;
  while (attempt <= DB_RETRY_DELAYS_MS.length) {
    try {
      return await handler();
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }
      if (attempt >= DB_RETRY_DELAYS_MS.length) {
        throw error;
      }
      const delay = DB_RETRY_DELAYS_MS[attempt];
      attempt += 1;
      await sleep(delay);
    }
  }

  throw new Error('unreachable_retry_state');
}

const MANUAL_SITE_SECTIONS = [
  {
    id: 'search',
    title: 'البحث العام',
    description: 'ابحث في كل أقسام الموقع ونتائج الأدلة والمحتوى الطبي.',
    url: '/search',
    keywords: ['بحث', 'محرك البحث', 'نتائج', 'كل الموقع'],
    category: 'صفحات الموقع',
  },
  {
    id: 'about',
    title: 'من نحن',
    description: 'تعرف على منصة مستشفى.كوم وما نقدمه من أدلة ومحتوى طبي.',
    url: '/about',
    keywords: ['عن الموقع', 'حول الموقع', 'معلومات عنا'],
    category: 'صفحات الموقع',
  },
  {
    id: 'contact',
    title: 'اتصل بنا',
    description: 'راسل فريق الموقع أو أرسل استفسارك الطبي أو التقني.',
    url: '/contact',
    keywords: ['تواصل', 'راسلنا', 'الدعم'],
    category: 'صفحات الموقع',
  },
  {
    id: 'privacy',
    title: 'سياسة الخصوصية',
    description: 'تفاصيل حماية البيانات والخصوصية داخل الموقع.',
    url: '/privacy',
    keywords: ['الخصوصية', 'البيانات', 'policy'],
    category: 'صفحات الموقع',
  },
  {
    id: 'terms',
    title: 'الشروط والأحكام',
    description: 'شروط استخدام الموقع والخدمات المتاحة.',
    url: '/terms',
    keywords: ['الشروط', 'الأحكام', 'الاستخدام'],
    category: 'صفحات الموقع',
  },
];

// Schema للتحقق من صحة المدخلات
const UniversalSearchSchema = z.object({
  query: z.string().min(1),
  entityTypes: z.array(z.enum(SEARCH_ENTITY_TYPES)).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['relevance', 'rating', 'popularity', 'date']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  refreshToken: z.string().optional(),
  filters: z.record(z.any()).optional(),
});

const getQueryTerms = (query: string) => {
  return buildSearchTerms(query, 16);
};

function getSearchTokens(query: string) {
  const tokens = new Set<string>();
  const normalizedQuery = normalizeArabic(query);

  const pushToken = (value: string) => {
    const token = normalizeArabic(value);
    if (!token || SEARCH_STOP_WORDS.has(token)) return;
    if (token.length === 1 && normalizedQuery.length > 2) return;
    tokens.add(token);

    const prefixes = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل'];
    prefixes.forEach((prefix) => {
      if (token.startsWith(prefix) && token.length > prefix.length + 1) {
        const stripped = token.slice(prefix.length);
        if (stripped && !SEARCH_STOP_WORDS.has(stripped)) {
          tokens.add(stripped);
        }
      }
    });
  };

  getQueryTerms(query)
    .flatMap((term) => normalizeArabic(term).split(' '))
    .forEach(pushToken);

  if (!tokens.size && normalizedQuery) {
    tokens.add(normalizedQuery);
  }

  return Array.from(tokens);
}

function getLookupTerms(query: string) {
  const terms = new Set(getQueryTerms(query));
  const normalizedTokens = normalizeArabic(query).split(' ').filter(Boolean);

  normalizedTokens.forEach((token) => {
    if (token.length >= 4) {
      for (let length = Math.min(5, token.length - 1); length >= 3; length -= 1) {
        terms.add(token.slice(0, length));
      }
    }
  });

  return Array.from(terms).filter(Boolean).slice(0, MAX_LOOKUP_TERMS);
}

function getPreciseLookupTerms(query: string) {
  const normalizedQuery = normalizeArabic(query);
  const minimumLength = normalizedQuery.length <= 4 ? 2 : Math.min(4, normalizedQuery.length);

  return Array.from(
    new Set([
      query.trim(),
      normalizedQuery,
      ...buildSearchTerms(query, 20),
    ])
  )
    .map((term) => term.trim())
    .filter((term) => normalizeArabic(term).length >= minimumLength)
    .slice(0, 20);
}

function stripHtml(value?: string | null) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength = 180) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}…`;
}

function escapeSearchRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getApproximateLookupFragments(query: string) {
  const fragments = new Set<string>();
  const compactTokens = normalizeArabic(query)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

  compactTokens.forEach((token) => {
    if (token.length < 3) {
      return;
    }

    const windowSize = Math.min(4, token.length);
    fragments.add(token.slice(0, windowSize));
    fragments.add(token.slice(Math.max(0, token.length - windowSize)));

    if (token.length > windowSize) {
      const middleStart = Math.max(0, Math.floor((token.length - windowSize) / 2));
      fragments.add(token.slice(middleStart, middleStart + windowSize));
    }
  });

  return Array.from(fragments).filter((fragment) => fragment.length >= 3).slice(0, 12);
}

function buildExcerptForQuery(query: string, ...parts: Array<string | null | undefined>) {
  const cleanedParts = parts.map((part) => stripHtml(part)).filter(Boolean);
  if (cleanedParts.length === 0) {
    return '';
  }

  const searchTokens = getSearchTokens(query);
  const rawTerms = Array.from(
    new Set([
      query,
      ...getQueryTerms(query),
      ...searchTokens,
    ])
  )
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  const candidateSegments = cleanedParts.flatMap((part) => {
    const segments = part
      .split(/(?<=[.!?؟؛\n])/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    return (segments.length > 0 ? segments : [part]).map((segment) => {
      const normalizedSegment = normalizeArabic(segment);
      const compactSegment = compactArabic(segment);
      let score = 0;

      rawTerms.forEach((term) => {
        const normalizedTerm = normalizeArabic(term);
        const compactTerm = compactArabic(term);
        if (!normalizedTerm) {
          return;
        }

        if (compactTerm && compactSegment.includes(compactTerm)) {
          score += normalizedTerm.length * 6;
        } else if (normalizedSegment.includes(normalizedTerm)) {
          score += normalizedTerm.length * 4;
        }
      });

      searchTokens.forEach((token) => {
        if (normalizedSegment.includes(token)) {
          score += 18;
        }
      });

      return { segment, score };
    });
  });

  const bestSegment =
    candidateSegments
      .sort((left, right) => right.score - left.score || left.segment.length - right.segment.length)
      .find((item) => item.score > 0)?.segment || cleanedParts[0];

  for (const term of rawTerms) {
    const match = bestSegment.match(new RegExp(escapeSearchRegExp(term), 'i'));
    if (match?.index === undefined) {
      continue;
    }

    const start = Math.max(0, match.index - 60);
    const end = Math.min(bestSegment.length, match.index + match[0].length + 110);
    const snippet = bestSegment.slice(start, end).trim();
    return `${start > 0 ? '…' : ''}${snippet}${end < bestSegment.length ? '…' : ''}`;
  }

  return truncateText(bestSegment, 180);
}

function getLevenshteinDistance(left: string, right: string, maxDistance = 2) {
  if (left === right) {
    return 0;
  }

  if (!left || !right) {
    return Math.max(left.length, right.length);
  }

  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    let rowMin = current[0];

    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      const value = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      );
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    previous = current;
  }

  return previous[right.length];
}

function getClosestDistance(target: string, candidates: string[], maxDistance = 2) {
  let bestDistance: number | null = null;

  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }

    const distance = getLevenshteinDistance(target, candidate, maxDistance);
    if (distance <= maxDistance && (bestDistance === null || distance < bestDistance)) {
      bestDistance = distance;
    }
  });

  return bestDistance;
}

function scoreSearchCandidate(query: string, item: SearchCandidate) {
  const normalizedQuery = normalizeArabic(query);
  const compactQuery = compactArabic(query);
  const normalizedTitle = normalizeArabic(item.title);
  const normalizedExcerpt = normalizeArabic(item.excerpt || '');
  const normalizedCategory = normalizeArabic(item.category || '');
  const normalizedSearchText = normalizeArabic(
    `${item.title} ${item.excerpt || ''} ${item.searchText || ''} ${item.category || ''}`
  );
  const compactTitle = compactArabic(item.title);
  const compactExcerpt = compactArabic(item.excerpt || '');
  const compactCategory = compactArabic(item.category || '');
  const compactSearchText = compactArabic(`${item.title} ${item.excerpt || ''} ${item.searchText || ''} ${item.category || ''}`);
  const titleWords = new Set(normalizedTitle.split(' ').filter(Boolean));
  const searchWords = new Set(normalizedSearchText.split(' ').filter(Boolean));
  const tokens = getSearchTokens(query);
  const compactTitleWords = Array.from(titleWords).map((word) => compactArabic(word)).filter(Boolean);
  const compactSearchWords = Array.from(searchWords).map((word) => compactArabic(word)).filter(Boolean);

  let score = 0;
  let matchedTokens = 0;

  if (compactQuery && compactTitle === compactQuery) {
    score += 260;
  } else if (compactQuery && compactTitle.startsWith(compactQuery)) {
    score += 195;
  } else if (normalizedTitle === normalizedQuery) {
    score += 220;
  } else if (titleWords.has(normalizedQuery)) {
    score += 180;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 150;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 120;
  }

  if (normalizedExcerpt.includes(normalizedQuery)) {
    score += 35;
  }

  if (compactQuery && compactExcerpt.includes(compactQuery)) {
    score += 24;
  }

  if (compactQuery && compactCategory === compactQuery) {
    score += 150;
  } else if (compactQuery && compactCategory.startsWith(compactQuery)) {
    score += 108;
  } else if (compactQuery && compactCategory.includes(compactQuery)) {
    score += 78;
  }

  if (normalizedSearchText.includes(normalizedQuery)) {
    score += 60;
  }

  if (compactQuery && compactSearchText.includes(compactQuery)) {
    score += 72;
  }

  const titleFuzzyDistance = compactQuery ? getClosestDistance(compactQuery, [compactTitle, ...compactTitleWords], 2) : null;
  const textFuzzyDistance = compactQuery ? getClosestDistance(compactQuery, compactSearchWords, 2) : null;

  if (titleFuzzyDistance === 1) {
    score += 105;
  } else if (titleFuzzyDistance === 2 && compactQuery.length >= 5) {
    score += 54;
  }

  if (textFuzzyDistance === 1) {
    score += 44;
  } else if (textFuzzyDistance === 2 && compactQuery.length >= 6) {
    score += 20;
  }

  tokens.forEach((token) => {
    let tokenScore = 0;

    if (titleWords.has(token)) {
      tokenScore = 42;
    } else if (normalizedTitle.includes(token)) {
      tokenScore = 30;
    } else if (normalizedCategory === token) {
      tokenScore = 32;
    } else if (normalizedCategory.includes(token)) {
      tokenScore = 24;
    } else if (searchWords.has(token)) {
      tokenScore = 22;
    } else if (normalizedSearchText.includes(token)) {
      tokenScore = 14;
    }

    if (tokenScore > 0) {
      matchedTokens += 1;
      score += tokenScore;
    }
  });

  if (tokens.length > 1 && matchedTokens === tokens.length) {
    score += 50;
  } else if (tokens.length > 2 && matchedTokens >= Math.ceil(tokens.length * 0.7)) {
    score += 24;
  }

  const minimumMatchedTokens =
    tokens.length <= 1 ? 1 : tokens.length === 2 ? 2 : Math.max(2, Math.ceil(tokens.length * 0.7));

  const isRelevant =
    compactTitle === compactQuery ||
    compactTitle.startsWith(compactQuery) ||
    normalizedTitle === normalizedQuery ||
    normalizedTitle.startsWith(normalizedQuery) ||
    normalizedCategory.includes(normalizedQuery) ||
    normalizedSearchText.includes(normalizedQuery) ||
    compactCategory.includes(compactQuery) ||
    compactSearchText.includes(compactQuery) ||
    matchedTokens >= minimumMatchedTokens ||
    titleFuzzyDistance !== null ||
    textFuzzyDistance === 1;

  return { score, isRelevant };
}

function rankSearchResults(query: string, items: SearchCandidate[]) {
  return items
    .map((item) => {
      const { score, isRelevant } = scoreSearchCandidate(query, item);
      return {
        ...item,
        relevanceScore: score,
        isRelevant,
      };
    })
    .filter((item) => item.isRelevant && (item.relevanceScore || 0) > 0)
    .sort((a, b) => {
      const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (relevanceDiff !== 0) return relevanceDiff;

      const popularityDiff =
        (b.usageCount || b.views || b.ratingCount || 0) - (a.usageCount || a.views || a.ratingCount || 0);
      if (popularityDiff !== 0) return popularityDiff;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .map(({ searchText, isRelevant, ...item }) => item);
}

function buildSearchCacheKey(params: z.infer<typeof UniversalSearchSchema>) {
  return JSON.stringify({
    query: normalizeArabic(params.query),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    refreshToken: params.refreshToken || '',
    filters: params.filters || {},
  });
}

function getCachedSearchEntry(cacheKey: string) {
  const cached = universalSearchCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > SEARCH_CACHE_TTL_MS) {
    universalSearchCache.delete(cacheKey);
    return null;
  }

  return cached;
}

function setCachedSearchEntry(cacheKey: string, entry: SearchCacheEntry) {
  universalSearchCache.set(cacheKey, entry);
}

async function buildSearchCacheEntry(params: z.infer<typeof UniversalSearchSchema>) {
  const { query, sortBy, sortOrder, filters } = params;
  const searchResults: SearchResultItem[] = [];
  const entityCounts: Record<string, number> = {};
  const searchEntities = SEARCH_ENTITY_TYPES;

  const appendResults = (entityType: SearchEntityType, items: SearchCandidate[]) => {
    searchResults.push(
      ...items.map((item) => ({
        ...item,
        entityType,
      }))
    );
    entityCounts[entityType] = items.length;
  };

  const searchTasks: Array<Promise<readonly [SearchEntityType, SearchCandidate[]]>> = [];
  const pushTask = (entityType: SearchEntityType, handler: () => Promise<SearchCandidate[]> | SearchCandidate[]) => {
    const task = (async (): Promise<readonly [SearchEntityType, SearchCandidate[]]> => {
      const items = await handler();
      return [entityType, items] as const;
    })();
    searchTasks.push(task);
  };

  if (searchEntities.includes('section')) {
    pushTask('section', () => safeSearchSync('صفحات الموقع', () => searchSections(query)));
  }

  if (searchEntities.includes('guide')) {
    pushTask('guide', () => safeSearchSync('الأدلة الطبية', () => searchGuides(query)));
  }

  if (searchEntities.includes('hospital')) {
    pushTask('hospital', () => safeSearch('المستشفيات', () => searchHospitals(query, filters)));
  }

  if (searchEntities.includes('clinic')) {
    pushTask('clinic', () => safeSearch('العيادات', () => searchClinics(query, filters)));
  }

  if (searchEntities.includes('lab')) {
    pushTask('lab', () => safeSearch('المعامل', () => searchLabs(query, filters)));
  }

  if (searchEntities.includes('pharmacy')) {
    pushTask('pharmacy', () => safeSearch('الصيدليات', () => searchPharmacies(query, filters)));
  }

  if (searchEntities.includes('doctor')) {
    pushTask('doctor', () => safeSearch('الأطباء', () => searchDoctors(query, filters)));
  }

  if (searchEntities.includes('article')) {
    pushTask('article', () => safeSearch('المقالات', () => searchArticles(query, filters)));
  }

  if (searchEntities.includes('video')) {
    pushTask('video', () => safeSearch('الفيديوهات', () => searchVideos(query, filters)));
  }

  if (searchEntities.includes('tool')) {
    pushTask('tool', () => safeSearch('الأدوات الطبية', () => searchMedicalTools(query, filters)));
  }

  if (searchEntities.includes('drug')) {
    pushTask('drug', () => safeSearch('الأدوية', () => searchDrugs(query, filters)));
  }

  if (searchEntities.includes('medical_info')) {
    pushTask('medical_info', () => safeSearch('المعلومات الطبية', () => searchMedicalInfo(query, filters)));
  }

  const resolvedSearches = await Promise.all(searchTasks);
  resolvedSearches.forEach(([entityType, items]) => appendResults(entityType, items));

  const sortedResults = sortResults(query, searchResults, sortBy, sortOrder);
  const facets = generateFacets(searchResults, entityCounts);
  const suggestions = generateSearchSuggestions(query, sortedResults);
  const cacheEntry: SearchCacheEntry = {
    createdAt: Date.now(),
    sortedResults,
    entityCounts,
    suggestions,
    facets,
    query,
  };

  return cacheEntry;
}

function buildPaginatedSearchResponse(
  entry: SearchCacheEntry,
  page: number,
  pageSize: number,
  entityTypes?: SearchEntityType[]
) {
  const filteredResults =
    entityTypes && entityTypes.length > 0
      ? entry.sortedResults.filter((item) => entityTypes.includes(item.entityType))
      : entry.sortedResults;
  const totalResults = filteredResults.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    results: filteredResults.slice(startIndex, endIndex),
    pagination: {
      page,
      pageSize,
      total: totalResults,
      totalPages: Math.ceil(totalResults / pageSize),
      hasNext: endIndex < totalResults,
      hasPrev: page > 1,
    },
    facets: entry.facets,
    suggestions: entry.suggestions,
    query: entry.query,
  };
}

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

    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        success: false,
        error: 'تعذر الاتصال بقاعدة البيانات حالياً. حاول مرة أخرى خلال لحظات.',
      }, { status: 503 });
    }
    
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
  const { query, entityTypes, page, pageSize } = params;
  const startedAt = Date.now();
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
      searchTime: 0,
      query,
    };
  }

  const cacheKey = buildSearchCacheKey(params);
  const cachedEntry = getCachedSearchEntry(cacheKey);

  if (cachedEntry) {
    return {
      ...buildPaginatedSearchResponse(cachedEntry, page, pageSize, entityTypes),
      searchTime: Date.now() - startedAt,
    };
  }

  const pendingEntry =
    pendingUniversalSearches.get(cacheKey) ||
    buildSearchCacheEntry(params).finally(() => {
      pendingUniversalSearches.delete(cacheKey);
    });

  if (!pendingUniversalSearches.has(cacheKey)) {
    pendingUniversalSearches.set(cacheKey, pendingEntry);
  }

  let cacheEntry: SearchCacheEntry;
  try {
    cacheEntry = await pendingEntry;
    setCachedSearchEntry(cacheKey, cacheEntry);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const staleEntry = universalSearchCache.get(cacheKey);
      if (staleEntry) {
        return {
          ...buildPaginatedSearchResponse(staleEntry, page, pageSize, entityTypes),
          searchTime: Date.now() - startedAt,
        };
      }
    }
    throw error;
  }

  return {
    ...buildPaginatedSearchResponse(cacheEntry, page, pageSize, entityTypes),
    searchTime: Date.now() - startedAt,
  };
}

async function safeSearch<T>(label: string, handler: () => Promise<T[]>): Promise<T[]> {
  try {
    return await withDatabaseRetry(handler);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw error;
    }
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
  const terms = getLookupTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { type: { is: { nameAr: { contains: term, mode: 'insensitive' } } } },
      { governorate: { is: { nameAr: { contains: term, mode: 'insensitive' } } } },
      { city: { is: { nameAr: { contains: term, mode: 'insensitive' } } } },
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
      address: true,
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
      },
      city: {
        select: { nameAr: true }
      }
    },
    take: 80
  });
  
  return rankSearchResults(query, hospitals.map((hospital) => ({
    entityId: hospital.id.toString(),
    title: hospital.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      hospital.description,
      hospital.address,
      `مستشفى ${hospital.type?.nameAr || ''} في ${[hospital.governorate?.nameAr, hospital.city?.nameAr].filter(Boolean).join('، ')}`
    ),
    image: hospital.logo,
    rating: hospital.ratingAvg,
    ratingCount: hospital.ratingCount,
    isFeatured: hospital.isFeatured,
    slug: hospital.slug,
    createdAt: hospital.createdAt.toISOString(),
    category: hospital.type?.nameAr || 'مستشفى',
    url: `/hospitals-pro/${hospital.id}`,
    searchText: [
      hospital.nameAr,
      hospital.nameEn,
      hospital.description,
      hospital.address,
      hospital.slug,
      hospital.type?.nameAr,
      hospital.governorate?.nameAr,
      hospital.city?.nameAr,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchClinics(query: string, filters?: any) {
  const terms = getLookupTerms(query);
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
      addressAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      },
      city: {
        select: { nameAr: true }
      },
      specialties: {
        select: { nameAr: true, nameEn: true }
      }
    },
    take: 80
  });
  
  return rankSearchResults(query, clinics.map((clinic) => ({
    entityId: clinic.id.toString(),
    title: clinic.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      clinic.descriptionAr,
      clinic.addressAr,
      clinic.specialties.map((specialty) => `${specialty.nameAr || ''} ${specialty.nameEn || ''}`).join(' '),
      `عيادة في ${[clinic.governorate?.nameAr, clinic.city?.nameAr].filter(Boolean).join('، ')}`
    ),
    image: clinic.logo,
    rating: clinic.ratingAvg,
    ratingCount: clinic.ratingCount,
    isFeatured: clinic.isFeatured,
    slug: clinic.slug,
    createdAt: clinic.createdAt.toISOString(),
    category: clinic.specialties[0]?.nameAr || 'عيادة',
    url: `/clinics/${clinic.slug}`,
    searchText: [
      clinic.nameAr,
      clinic.nameEn,
      clinic.descriptionAr,
      clinic.addressAr,
      clinic.slug,
      clinic.governorate?.nameAr,
      clinic.city?.nameAr,
      clinic.specialties.map((specialty) => `${specialty.nameAr || ''} ${specialty.nameEn || ''}`).join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchLabs(query: string, filters?: any) {
  const terms = getLookupTerms(query);
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
      addressAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      },
      city: {
        select: { nameAr: true }
      }
    },
    take: 80
  });
  
  return rankSearchResults(query, labs.map((lab) => ({
    entityId: lab.id.toString(),
    title: lab.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      lab.descriptionAr,
      lab.addressAr,
      `معمل في ${[lab.governorate?.nameAr, lab.city?.nameAr].filter(Boolean).join('، ')}`
    ),
    image: lab.logo,
    rating: lab.ratingAvg,
    ratingCount: lab.ratingCount,
    isFeatured: lab.isFeatured,
    slug: lab.slug,
    createdAt: lab.createdAt.toISOString(),
    category: 'معمل',
    url: `/labs/${lab.slug}`,
    searchText: [
      lab.nameAr,
      lab.nameEn,
      lab.descriptionAr,
      lab.addressAr,
      lab.slug,
      lab.governorate?.nameAr,
      lab.city?.nameAr,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchPharmacies(query: string, filters?: any) {
  const terms = getLookupTerms(query);
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
      addressAr: true,
      logo: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      is24h: true,
      createdAt: true,
      governorate: {
        select: { nameAr: true }
      },
      city: {
        select: { nameAr: true }
      }
    },
    take: 80
  });
  
  return rankSearchResults(query, pharmacies.map((pharmacy) => ({
    entityId: pharmacy.id.toString(),
    title: pharmacy.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      pharmacy.descriptionAr,
      pharmacy.addressAr,
      `صيدلية ${pharmacy.is24h ? '24 ساعة ' : ''}في ${[pharmacy.governorate?.nameAr, pharmacy.city?.nameAr].filter(Boolean).join('، ')}`
    ),
    image: pharmacy.logo,
    rating: pharmacy.ratingAvg,
    ratingCount: pharmacy.ratingCount,
    isFeatured: pharmacy.isFeatured,
    slug: pharmacy.slug,
    createdAt: pharmacy.createdAt.toISOString(),
    category: pharmacy.is24h ? 'صيدلية 24 ساعة' : 'صيدلية',
    url: `/pharmacies/${pharmacy.slug}`,
    searchText: [
      pharmacy.nameAr,
      pharmacy.nameEn,
      pharmacy.descriptionAr,
      pharmacy.addressAr,
      pharmacy.slug,
      pharmacy.governorate?.nameAr,
      pharmacy.city?.nameAr,
      pharmacy.is24h ? '24 ساعة' : '',
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchArticles(query: string, filters?: any) {
  const baseTerms = getLookupTerms(query);
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

  return rankSearchResults(query, matchedArticles.map((article) => ({
    entityId: article.id.toString(),
    title: article.title,
    excerpt: buildExcerptForQuery(query, article.excerpt, article.content, article.tags, article.author, article.title),
    image: article.image,
    rating: 0,
    ratingCount: 0,
    isFeatured: article.isFeatured,
    slug: article.slug,
    createdAt: article.createdAt.toISOString(),
    views: article.views,
    category: article.category?.nameAr || 'مقال طبي',
    url: `/articles/${article.slug}`,
    searchText: [
      article.title,
      article.excerpt,
      article.content?.replace(/<[^>]+>/g, ' '),
      article.tags,
      article.slug,
      article.author,
      article.category?.nameAr,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchMedicalTools(query: string, filters?: any) {
  const terms = getLookupTerms(query);
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
      descriptionEn: true,
      featuredImage: true,
      averageRating: true,
      ratingCount: true,
      usageCount: true,
      isFeatured: true,
      toolType: true,
      targetConditions: true,
      medicalSpecialties: true,
      instructionsAr: true,
      createdAt: true
    },
    take: 80
  });
  
  return rankSearchResults(query, tools.map((tool) => ({
    entityId: tool.id,
    title: tool.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      tool.descriptionAr,
      tool.descriptionEn,
      tool.instructionsAr,
      tool.targetConditions,
      tool.medicalSpecialties
    ),
    image: tool.featuredImage,
    rating: parseFloat(tool.averageRating.toString()),
    ratingCount: tool.ratingCount,
    isFeatured: tool.isFeatured,
    slug: tool.slug,
    createdAt: tool.createdAt.toISOString(),
    usageCount: tool.usageCount,
    toolType: tool.toolType,
    category: tool.toolType || 'أداة طبية',
    url: '/tools',
    searchText: [
      tool.nameAr,
      tool.nameEn,
      tool.descriptionAr,
      tool.descriptionEn,
      tool.toolType,
      tool.targetConditions,
      tool.medicalSpecialties,
      tool.instructionsAr,
      tool.slug,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchMedicalInfo(query: string, filters?: any) {
  const terms = getLookupTerms(query);
  const where: any = {
    AND: [
      { isActive: true },
      {
        OR: terms.flatMap((term) => ([
          { titleAr: { contains: term, mode: 'insensitive' } },
          { titleEn: { contains: term, mode: 'insensitive' } },
          { contentAr: { contains: term, mode: 'insensitive' } },
          { contentEn: { contains: term, mode: 'insensitive' } },
          { category: { is: { nameAr: { contains: term, mode: 'insensitive' } } } },
        ])),
      },
    ],
  };

  const healthTips = await prisma.healthTip.findMany({
    where,
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      contentAr: true,
      contentEn: true,
      image: true,
      viewCount: true,
      likeCount: true,
      shareCount: true,
      createdAt: true,
      category: {
        select: { nameAr: true, slug: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 60,
  });

  return rankSearchResults(query, healthTips.map((tip) => ({
    entityId: tip.id.toString(),
    title: tip.titleAr,
    excerpt: buildExcerptForQuery(
      query,
      tip.contentAr,
      tip.contentEn,
      tip.category?.nameAr,
      tip.titleAr
    ),
    image: tip.image,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    createdAt: tip.createdAt.toISOString(),
    views: tip.viewCount,
    usageCount: tip.viewCount + tip.likeCount + tip.shareCount,
    category: tip.category?.nameAr || 'معلومة طبية',
    url: `/medical-info?q=${encodeURIComponent(tip.titleAr)}`,
    searchText: [
      tip.titleAr,
      tip.titleEn,
      tip.contentAr,
      tip.contentEn,
      tip.category?.nameAr,
      tip.category?.slug,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchDrugs(query: string, filters?: any) {
  const terms = getLookupTerms(query);
  const preciseTerms = getPreciseLookupTerms(query);
  const preferredDrugTerms = preciseTerms.length > 0 ? preciseTerms : terms;
  const approximateFragments = getApproximateLookupFragments(query);
  const createDrugConditions = (lookupTerms: string[]): any[] =>
    lookupTerms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { activeIngredient: { contains: term, mode: 'insensitive' } },
      { usage: { contains: term, mode: 'insensitive' } },
      { barcode: { contains: term, mode: 'insensitive' } },
      { company: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
      { category: { is: { name: { contains: term, mode: 'insensitive' } } } },
    ]));

  const select = {
    id: true,
    nameAr: true,
    nameEn: true,
    slug: true,
    usage: true,
    image: true,
    activeIngredient: true,
    contraindications: true,
    dosage: true,
    company: true,
    barcode: true,
    priceText: true,
    createdAt: true,
    category: {
      select: { name: true }
    }
  } as const;

  const [preciseDrugs, broadDrugs, approximateDrugs] = await Promise.all([
    prisma.drug.findMany({
      where: {
        OR: createDrugConditions(preferredDrugTerms),
      },
      select,
      take: 160,
    }),
    prisma.drug.findMany({
      where: {
        OR: createDrugConditions(terms),
      },
      select,
      take: 120,
    }),
    approximateFragments.length > 0
      ? prisma.drug.findMany({
          where: {
            OR: approximateFragments.flatMap((fragment) => ([
              { nameAr: { contains: fragment, mode: 'insensitive' } },
              { nameEn: { contains: fragment, mode: 'insensitive' } },
              { activeIngredient: { contains: fragment, mode: 'insensitive' } },
              { company: { contains: fragment, mode: 'insensitive' } },
              { category: { is: { name: { contains: fragment, mode: 'insensitive' } } } },
            ]))
          },
          select,
          take: 100,
        })
      : Promise.resolve([] as any[]),
  ]);

  const drugs = Array.from(
    new Map([...preciseDrugs, ...broadDrugs, ...approximateDrugs].map((drug) => [drug.id, drug])).values()
  );

  return rankSearchResults(query, drugs.map((drug) => ({
    entityId: drug.id.toString(),
    title: drug.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      drug.usage,
      drug.activeIngredient,
      drug.contraindications,
      drug.dosage,
      drug.company,
      drug.category?.name,
      drug.priceText,
      `دواء من فئة ${drug.category?.name || ''}`
    ),
    image: drug.image,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    slug: drug.slug,
    createdAt: drug.createdAt.toISOString(),
    activeIngredient: drug.activeIngredient,
    category: drug.category?.name || 'دواء',
    url: `/drugs/${encodeURIComponent(drug.slug)}`,
    searchText: [
      drug.nameAr,
      drug.nameEn,
      drug.usage,
      drug.activeIngredient,
      drug.category?.name,
      drug.contraindications,
      drug.dosage,
      drug.company,
      drug.barcode,
      drug.priceText,
      drug.slug,
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

function searchGuides(query: string) {
  return rankSearchResults(query, Object.values(GUIDES).map((guide) => ({
      entityId: guide.slug,
      title: guide.title,
      excerpt: buildExcerptForQuery(query, guide.subtitle, guide.description, guide.keywords.join(' ')),
      image: guide.heroImage,
      rating: 0,
      ratingCount: 0,
      isFeatured: true,
      slug: guide.slug,
      createdAt: new Date().toISOString(),
      category: 'دليل طبي',
      url: `/${guide.slug}`,
      searchText: [
        guide.title,
        guide.subtitle,
        guide.description,
        guide.keywords.join(' '),
        guide.relatedSpecialties?.join(' '),
        guide.featuredTopics?.join(' '),
        guide.tools?.map((tool) => `${tool.title} ${tool.description}`).join(' '),
      ]
        .filter(Boolean)
        .join(' '),
    })));
}

function searchSections(query: string) {
  const navbarItems = [
    ...DEFAULT_NAVBAR_CONFIG.primaryLinks.map((item) => ({
      id: item.id,
      title: item.label,
      description: item.description || '',
      url: item.href,
      keywords: [item.icon || '', 'صفحات الموقع'],
      category: 'صفحات الموقع',
    })),
    ...Object.values(DEFAULT_NAVBAR_CONFIG.sections).flatMap((section) => [
      {
        id: section.id,
        title: section.label,
        description: section.description || '',
        url: `/${section.id === 'medical-brief' ? 'medical-brief' : section.id}`,
        keywords: [section.icon || '', ...section.items.map((item) => item.label)],
        category: 'أقسام الموقع',
      },
      ...section.items.map((item) => ({
        id: item.id,
        title: item.label,
        description: item.description || section.description || '',
        url: item.href,
        keywords: [section.label, section.description || '', item.icon || '', item.badge || ''],
        category: section.label,
      })),
    ]),
    {
      id: DEFAULT_NAVBAR_CONFIG.contactLink.id,
      title: DEFAULT_NAVBAR_CONFIG.contactLink.label,
      description: 'التواصل مع فريق الموقع وإرسال الرسائل.',
      url: DEFAULT_NAVBAR_CONFIG.contactLink.href,
      keywords: [DEFAULT_NAVBAR_CONFIG.contactLink.icon || '', 'تواصل', 'رسائل'],
      category: 'صفحات الموقع',
    },
    ...MANUAL_SITE_SECTIONS,
  ];

  const uniqueSections = Array.from(new Map(navbarItems.map((item) => [item.url, item])).values());

  return rankSearchResults(query, uniqueSections.map((item) => ({
    entityId: item.id,
    title: item.title,
    excerpt: item.description,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    category: item.category,
    url: item.url,
    searchText: [item.title, item.description, item.keywords.join(' ')].filter(Boolean).join(' '),
  })));
}

async function searchDoctors(query: string, filters?: any) {
  const terms = getLookupTerms(query);
  const where: any = {
    isActive: true,
    OR: terms.flatMap((term) => ([
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { title: { contains: term, mode: 'insensitive' } },
      { bio: { contains: term, mode: 'insensitive' } },
      { specialty: { is: { nameAr: { contains: term, mode: 'insensitive' } } } },
      { specialty: { is: { nameEn: { contains: term, mode: 'insensitive' } } } },
    ])),
  };

  const doctors = await prisma.staff.findMany({
    where,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      title: true,
      bio: true,
      image: true,
      ratingAvg: true,
      ratingCount: true,
      isFeatured: true,
      createdAt: true,
      specialty: {
        select: { nameAr: true, nameEn: true },
      },
      hospitalStaff: {
        take: 3,
        select: {
          hospital: {
            select: { nameAr: true },
          },
        },
      },
      clinicStaff: {
        take: 3,
        select: {
          clinic: {
            select: { nameAr: true },
          },
        },
      },
    },
    take: 80,
  });

  return rankSearchResults(query, doctors.map((doctor) => ({
    entityId: doctor.id.toString(),
    title: doctor.nameAr,
    excerpt: buildExcerptForQuery(
      query,
      doctor.bio,
      doctor.title,
      doctor.specialty?.nameAr,
      doctor.specialty?.nameEn,
      doctor.hospitalStaff.map((item) => item.hospital.nameAr).join(' '),
      doctor.clinicStaff.map((item) => item.clinic.nameAr).join(' '),
      `${doctor.title || 'طبيب'} ${doctor.specialty?.nameAr || ''}`.trim()
    ),
    image: doctor.image,
    rating: doctor.ratingAvg,
    ratingCount: doctor.ratingCount,
    isFeatured: doctor.isFeatured,
    createdAt: doctor.createdAt.toISOString(),
    category: doctor.specialty?.nameAr || 'طبيب',
    url: `/doctors/${doctor.id}`,
    searchText: [
      doctor.nameAr,
      doctor.nameEn,
      doctor.title,
      doctor.bio,
      doctor.specialty?.nameAr,
      doctor.specialty?.nameEn,
      doctor.hospitalStaff.map((item) => item.hospital.nameAr).join(' '),
      doctor.clinicStaff.map((item) => item.clinic.nameAr).join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  })));
}

async function searchVideos(query: string, filters?: any) {
  const terms = getLookupTerms(query);
  const where: any = {
    OR: terms.flatMap((term) => ([
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { channelTitle: { contains: term, mode: 'insensitive' } },
    ])),
  };

  const videos = await prisma.youtubeVideo.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      channelTitle: true,
      videoId: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 60,
  });

  return rankSearchResults(query, videos.map((video) => ({
    entityId: video.id.toString(),
    title: video.title,
    excerpt: buildExcerptForQuery(query, video.description, video.channelTitle, `فيديو طبي من ${video.channelTitle || 'يوتيوب'}`),
    image: video.thumbnailUrl,
    rating: 0,
    ratingCount: 0,
    isFeatured: false,
    createdAt: (video.publishedAt || video.createdAt).toISOString(),
    category: video.channelTitle || 'فيديو طبي',
    url: `/medical-videos?q=${encodeURIComponent(video.title)}`,
    searchText: [video.title, video.description, video.channelTitle, video.videoId].filter(Boolean).join(' '),
  })));
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
function sortResults(query: string, results: any[], sortBy: string, sortOrder: string) {
  const compactQuery = compactArabic(query);
  const drugItems = results.filter((item) => item.entityType === 'drug');
  const bestDrugRelevance = drugItems.reduce((best, item) => Math.max(best, item.relevanceScore || 0), 0);
  const hasStrongDrugMatch = drugItems.some((item) => {
    const compactTitle = compactArabic(String(item.title || ''));
    return compactTitle === compactQuery || compactTitle.startsWith(compactQuery) || compactTitle.includes(compactQuery);
  });
  const preferDrugResults =
    sortBy === 'relevance' &&
    compactQuery.length >= 2 &&
    drugItems.length > 0 &&
    (hasStrongDrugMatch || bestDrugRelevance >= 190);

  const getEntityBoost = (item: any) => {
    if (!preferDrugResults) {
      return 0;
    }

    if (item.entityType !== 'drug') {
      return -20;
    }

    const compactTitle = compactArabic(String(item.title || ''));
    if (compactTitle === compactQuery) {
      return 300;
    }
    if (compactTitle.startsWith(compactQuery)) {
      return 240;
    }
    if (compactTitle.includes(compactQuery)) {
      return 180;
    }

    return 120;
  };

  return results.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'relevance':
        comparison = ((b.relevanceScore || 0) + getEntityBoost(b)) - ((a.relevanceScore || 0) + getEntityBoost(a));
        if (comparison === 0 && preferDrugResults && a.entityType !== b.entityType) {
          if (a.entityType === 'drug') return sortOrder === 'asc' ? 1 : -1;
          if (b.entityType === 'drug') return sortOrder === 'asc' ? -1 : 1;
        }
        break;
      case 'rating':
        comparison = (b.rating || 0) - (a.rating || 0);
        break;
      case 'popularity':
        comparison = (b.usageCount || b.views || b.ratingCount || 0) - (a.usageCount || a.views || a.ratingCount || 0);
        break;
      case 'date':
        comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        break;
      default:
        comparison = (b.relevanceScore || 0) - (a.relevanceScore || 0);
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });
}

// دالة إنشاء اقتراحات البحث
function generateSearchSuggestions(query: string, sortedResults: SearchResultItem[]): string[] {
  const suggestions: string[] = [];
  if (!normalizeArabic(query)) {
    return [];
  }
  const compactQuery = compactArabic(query);
  const terms = getLookupTerms(query);
  const resultBasedSuggestions = sortedResults.slice(0, 24).flatMap((item) => [
    item.title,
    item.category || '',
    item.activeIngredient || '',
    item.toolType || '',
  ]);

  suggestions.push(...resultBasedSuggestions.filter(Boolean));

  const guideSuggestions = Object.values(GUIDES)
    .filter((guide) => {
      const haystack = normalizeArabic(`${guide.title} ${guide.description} ${guide.keywords.join(' ')}`);
      return terms.some((term) => haystack.includes(normalizeArabic(term)));
    })
    .map((guide) => guide.title);
  suggestions.push(...guideSuggestions);

  const sectionSuggestions = searchSections(query).slice(0, 3).map((item) => item.title);
  suggestions.push(...sectionSuggestions);

  return Array.from(new Set(suggestions))
    .sort((left, right) => {
      const leftCompact = compactArabic(left);
      const rightCompact = compactArabic(right);

      const leftExact = leftCompact === compactQuery;
      const rightExact = rightCompact === compactQuery;
      if (leftExact !== rightExact) {
        return leftExact ? -1 : 1;
      }

      const leftStarts = leftCompact.startsWith(compactQuery);
      const rightStarts = rightCompact.startsWith(compactQuery);
      if (leftStarts !== rightStarts) {
        return leftStarts ? -1 : 1;
      }

      const leftContains = leftCompact.includes(compactQuery);
      const rightContains = rightCompact.includes(compactQuery);
      if (leftContains !== rightContains) {
        return leftContains ? -1 : 1;
      }

      if (left.length !== right.length) {
        return left.length - right.length;
      }

      return left.localeCompare(right, 'ar');
    })
    .slice(0, 5);
}

// دالة إنشاء الفلاتر المتاحة
function generateFacets(results: any[], entityCounts: Record<string, number>) {
  const entityTypes = Object.entries(entityCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
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
    section: 'صفحات الموقع',
    hospital: 'مستشفيات',
    clinic: 'عيادات',
    lab: 'مختبرات',
    pharmacy: 'صيدليات',
    doctor: 'أطباء',
    article: 'مقالات',
    video: 'فيديوهات',
    tool: 'أدوات طبية',
    drug: 'أدوية',
    medical_info: 'المعلومات الطبية',
    guide: 'الأدلة الطبية'
  };
  return labels[type] || type;
}
