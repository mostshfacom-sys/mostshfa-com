import { buildSearchTerms, normalizeArabic } from '@/lib/search/arabic-normalization';

export const DRUGS_LAB_LIMIT = 24;
export const DRUGS_LAB_QUERY_CHANGE_EVENT = 'drugsLab:queryChange';
export const DRUGS_LAB_QUERY_KEYS = [
  'page',
  'limit',
  'search',
  'category',
  'hasPrice',
  'hasImage',
  'hasIngredient',
  'sort',
  'form',
  'view',
  'filterSearch',
] as const;

export type DrugsLabQueryInput = {
  page?: string;
  limit?: string;
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

type DrugsLabQueryKey = (typeof DRUGS_LAB_QUERY_KEYS)[number];

export function createDrugsLabQueryParams(
  current: URLSearchParams | string,
  updates: Partial<Record<DrugsLabQueryKey, string | null | undefined>>,
  options?: {
    resetPage?: boolean;
  }
) {
  const params = new URLSearchParams(
    typeof current === 'string' ? current : current.toString()
  );

  if (options?.resetPage !== false) {
    params.set('page', '1');
  }

  Object.entries(updates).forEach(([key, value]) => {
    if (!DRUGS_LAB_QUERY_KEYS.includes(key as DrugsLabQueryKey)) {
      return;
    }

    if (value === null || value === undefined || value === '') {
      params.delete(key);
      return;
    }

    params.set(key, value);
  });

  return params;
}

export function buildDrugsLabUrl(
  pathname: string,
  current: URLSearchParams | string,
  updates: Partial<Record<DrugsLabQueryKey, string | null | undefined>>,
  options?: {
    resetPage?: boolean;
  }
) {
  const params = createDrugsLabQueryParams(current, updates, options);
  const queryString = params.toString();
  return {
    params,
    queryString,
    nextUrl: queryString ? `${pathname}?${queryString}` : pathname,
  };
}

export const DRUG_IMAGE_AVAILABILITY_FILTERS = {
  AND: [
    { image: { not: null } },
    { image: { not: '' } },
    { NOT: [{ image: { startsWith: '/images/defaults/' } }] },
  ],
};

export function sanitizeDrugSearchInput(value: string) {
  return normalizeArabic(String(value || ''))
    .replace(/[\[\]{}()<>«»"'`~!@#$%^&*_+=|\\/:;.,?-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeQuery(value: string, tokenLimit = 6) {
  const sanitized = sanitizeDrugSearchInput(value);
  if (!sanitized) return [];
  return sanitized.split(' ').filter(Boolean).slice(0, tokenLimit);
}

function buildTokenVariants(value: string, variantLimit = 10) {
  const sanitized = sanitizeDrugSearchInput(value);
  if (!sanitized) return [];
  return Array.from(
    new Set(
      [sanitized, ...buildSearchTerms(sanitized, variantLimit).map((term) => sanitizeDrugSearchInput(term))]
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

function buildCombinedText(...values: Array<string | null | undefined>) {
  return sanitizeDrugSearchInput(values.filter(Boolean).join(' '));
}

export function buildDrugSearchClause(search: string) {
  const tokens = tokenizeQuery(search);
  if (!tokens.length) return null;

  return {
    AND: tokens.map((token) => {
      const variants = buildTokenVariants(token);
      return {
        OR: variants.flatMap((term) => [
          { nameAr: { contains: term, mode: 'insensitive' as const } },
          { nameEn: { contains: term, mode: 'insensitive' as const } },
          { activeIngredient: { contains: term, mode: 'insensitive' as const } },
          { slug: { contains: term, mode: 'insensitive' as const } },
          { company: { contains: term, mode: 'insensitive' as const } },
        ]),
      };
    }),
  };
}

export function buildDrugFormClause(form: string) {
  const sanitized = sanitizeDrugSearchInput(form);
  const synonymMap: Record<string, string[]> = {
    'أقراص': ['أقراص', 'اقراص', 'قرص'],
    'كبسولات': ['كبسولات', 'كبسول', 'كبسولة'],
    'شراب': ['شراب', 'معلق', 'syrup'],
    'حقن': ['حقن', 'امبول', 'أمبول', 'فيال'],
    'مرهم': ['مرهم', 'كريم'],
    'كريم': ['كريم', 'مرهم'],
    'مرهم كريم': ['مرهم', 'كريم'],
  };

  const rawTerms = sanitized
    .split(/[/\s]+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const normalizedTerms = rawTerms.length ? rawTerms : [sanitized];
  const variants = Array.from(
    new Set(
      normalizedTerms.flatMap((term) => {
        const mapped = synonymMap[term] || [term];
        return mapped.flatMap((item) => buildTokenVariants(item));
      })
    )
  );

  if (!variants.length) return null;

  return {
    OR: variants.flatMap((term) => [
      { nameAr: { contains: term, mode: 'insensitive' as const } },
      { nameEn: { contains: term, mode: 'insensitive' as const } },
      { dosage: { contains: term, mode: 'insensitive' as const } },
      { usage: { contains: term, mode: 'insensitive' as const } },
    ]),
  };
}

export function buildDrugsLabWhere(input: DrugsLabQueryInput) {
  const where: Record<string, unknown> = {};
  const andClauses: unknown[] = [];

  const search = sanitizeDrugSearchInput(String(input.search || ''));
  const form = sanitizeDrugSearchInput(String(input.form || ''));
  const category = String(input.category || '').trim();
  const hasPrice = String(input.hasPrice || '').trim();
  const hasImage = String(input.hasImage || '').trim();
  const hasIngredient = String(input.hasIngredient || '').trim();

  if (search) {
    const searchClause = buildDrugSearchClause(search);
    if (searchClause) andClauses.push(searchClause);
  }

  if (form) {
    const formClause = buildDrugFormClause(form);
    if (formClause) andClauses.push(formClause);
  }

  if (hasImage === '1' || hasImage === 'true') {
    andClauses.push(DRUG_IMAGE_AVAILABILITY_FILTERS);
  }

  if (andClauses.length) {
    where.AND = andClauses;
  }

  const categoryId = Number.parseInt(category, 10);
  if (!Number.isNaN(categoryId) && categoryId > 0) {
    where.categoryId = categoryId;
  }

  if (hasPrice === '1' || hasPrice === 'true') {
    where.priceText = {
      not: null,
      notIn: ['', '0', '0.00', '0.0'],
    };
  }

  if (hasIngredient === '1' || hasIngredient === 'true') {
    where.activeIngredient = {
      not: null,
      notIn: ['', 'N/A'],
    };
  }

  return where;
}

export function getDrugsLabOrderBy(sort: string) {
  switch (String(sort || '').trim()) {
    case 'nameDesc':
      return { nameAr: 'desc' as const };
    case 'updatedDesc':
      return { updatedAt: 'desc' as const };
    case 'nameAsc':
    default:
      return { nameAr: 'asc' as const };
  }
}

export function parseDrugsLabPage(value?: string, fallback = 1) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseDrugsLabLimit(value?: string, fallback = DRUGS_LAB_LIMIT) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(50, parsed);
}

export type DrugsLabSortableDrug = {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
  slug?: string | null;
  activeIngredient?: string | null;
  company?: string | null;
  dosage?: string | null;
  usage?: string | null;
  image?: string | null;
  priceText?: string | null;
  updatedAt?: string | Date | null;
};

export function hasRealDrugImage(image?: string | null) {
  const value = String(image || '').trim();
  return Boolean(value) && !value.startsWith('/images/defaults/');
}

function scoreField(text: string, terms: string[], weights: {
  exact: number;
  startsWith: number;
  includes: number;
  token: number;
}) {
  const normalizedText = sanitizeDrugSearchInput(text);
  if (!normalizedText) return 0;

  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (normalizedText === term) {
      score += weights.exact;
      continue;
    }
    if (normalizedText.startsWith(term)) {
      score += weights.startsWith;
      continue;
    }
    if (normalizedText.includes(` ${term} `) || normalizedText.endsWith(` ${term}`) || normalizedText.startsWith(`${term} `)) {
      score += weights.token;
      continue;
    }
    if (normalizedText.includes(term)) {
      score += weights.includes;
    }
  }
  return score;
}

export function getDrugMatchScore(drug: DrugsLabSortableDrug, query: string) {
  const normalizedQuery = sanitizeDrugSearchInput(query);
  const terms = tokenizeQuery(normalizedQuery, 8);
  if (!terms.length) {
    return hasRealDrugImage(drug.image) ? 20 : 0;
  }

  const phraseVariants = buildTokenVariants(normalizedQuery, 8);
  const primaryText = buildCombinedText(
    drug.nameAr,
    drug.nameEn,
    drug.slug,
    drug.activeIngredient,
    drug.company
  );
  const supportText = buildCombinedText(drug.dosage, drug.usage);
  const combinedText = buildCombinedText(primaryText, supportText);

  let phraseBonus = 0;
  for (const phrase of phraseVariants) {
    if (!phrase) continue;
    if (sanitizeDrugSearchInput(drug.nameAr || '') === phrase) phraseBonus += 320;
    else if (sanitizeDrugSearchInput(drug.nameAr || '').startsWith(phrase)) phraseBonus += 240;
    else if (sanitizeDrugSearchInput(drug.nameEn || '') === phrase) phraseBonus += 250;
    else if (sanitizeDrugSearchInput(drug.nameEn || '').startsWith(phrase)) phraseBonus += 190;
    else if (sanitizeDrugSearchInput(drug.activeIngredient || '') === phrase) phraseBonus += 220;
    else if (sanitizeDrugSearchInput(drug.slug || '') === phrase) phraseBonus += 140;
    else if (primaryText.includes(phrase)) phraseBonus += 110;
    else if (combinedText.includes(phrase)) phraseBonus += 70;
  }

  const score =
    phraseBonus +
    scoreField(drug.nameAr || '', terms, { exact: 260, startsWith: 190, includes: 100, token: 135 }) +
    scoreField(drug.nameEn || '', terms, { exact: 190, startsWith: 140, includes: 78, token: 105 }) +
    scoreField(drug.activeIngredient || '', terms, { exact: 170, startsWith: 130, includes: 72, token: 95 }) +
    scoreField(drug.slug || '', terms, { exact: 120, startsWith: 85, includes: 45, token: 62 }) +
    scoreField(drug.company || '', terms, { exact: 60, startsWith: 42, includes: 20, token: 28 }) +
    scoreField(drug.dosage || '', terms, { exact: 90, startsWith: 64, includes: 28, token: 48 }) +
    scoreField(drug.usage || '', terms, { exact: 46, startsWith: 32, includes: 18, token: 24 });

  const imageBonus = hasRealDrugImage(drug.image) ? 20 : 0;
  const priceBonus = String(drug.priceText || '').trim() ? 6 : 0;
  const alphaTokens = terms.filter((term) => /[A-Za-z\u0600-\u06FF]/.test(term));
  const numericTokens = terms.filter((term) => /\d/.test(term));
  const coverageBonus =
    (alphaTokens.length === 0 || alphaTokens.every((term) => primaryText.includes(term)) ? 45 : 0) +
    (numericTokens.length === 0 || numericTokens.every((term) => combinedText.includes(term)) ? 30 : 0);
  return score + imageBonus + priceBonus + coverageBonus;
}

export function isRelevantDrugMatch(drug: DrugsLabSortableDrug, query: string, score?: number) {
  const normalizedQuery = sanitizeDrugSearchInput(query);
  if (!normalizedQuery) return true;

  const terms = tokenizeQuery(normalizedQuery, 8);
  const alphaTokens = terms.filter((term) => /[A-Za-z\u0600-\u06FF]/.test(term));
  const numericTokens = terms.filter((term) => /\d/.test(term));
  const primaryText = buildCombinedText(
    drug.nameAr,
    drug.nameEn,
    drug.slug,
    drug.activeIngredient,
    drug.company
  );
  const supportText = buildCombinedText(drug.dosage, drug.usage);
  const combinedText = buildCombinedText(primaryText, supportText);
  const variants = buildTokenVariants(normalizedQuery, 8);
  const phraseHit = variants.some((term) => term && primaryText.includes(term));
  const alphaCovered = alphaTokens.length === 0 || alphaTokens.every((term) => primaryText.includes(term));
  const numericCovered = numericTokens.length === 0 || numericTokens.every((term) => combinedText.includes(term));
  const minimumScore = normalizedQuery.length <= 4 ? 85 : terms.length >= 2 ? 125 : 100;
  const actualScore = typeof score === 'number' ? score : getDrugMatchScore(drug, normalizedQuery);

  if (!numericCovered) return false;
  if (phraseHit) return true;
  if (alphaCovered && actualScore >= minimumScore) return true;
  return actualScore >= minimumScore + 70;
}

export function sortDrugsLabResults<T extends DrugsLabSortableDrug>(drugs: T[], query: string, sort?: string) {
  const normalizedQuery = sanitizeDrugSearchInput(query);
  const sortValue = String(sort || '').trim();

  return [...drugs].sort((a, b) => {
    const scoreDiff = getDrugMatchScore(b, normalizedQuery) - getDrugMatchScore(a, normalizedQuery);
    if (scoreDiff !== 0) return scoreDiff;

    const imageDiff = Number(hasRealDrugImage(b.image)) - Number(hasRealDrugImage(a.image));
    if (imageDiff !== 0) return imageDiff;

    if (sortValue === 'updatedDesc') {
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    }

    const nameA = sanitizeDrugSearchInput(a.nameAr || a.nameEn || '');
    const nameB = sanitizeDrugSearchInput(b.nameAr || b.nameEn || '');

    if (sortValue === 'nameDesc') {
      return nameB.localeCompare(nameA, 'ar');
    }

    return nameA.localeCompare(nameB, 'ar');
  });
}

export function filterAndRankDrugsLabResults<T extends DrugsLabSortableDrug>(drugs: T[], query: string, sort?: string) {
  const normalizedQuery = sanitizeDrugSearchInput(query);
  const ranked = sortDrugsLabResults(drugs, normalizedQuery, sort);

  if (!normalizedQuery) {
    return ranked;
  }

  return ranked.filter((drug, index) => {
    const score = getDrugMatchScore(drug, normalizedQuery);
    if (index < 3 && score > 0) {
      return true;
    }
    return isRelevantDrugMatch(drug, normalizedQuery, score);
  });
}
