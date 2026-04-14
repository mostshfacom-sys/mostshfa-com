/**
 * Arabic Text Normalization for Search
 * Normalizes Arabic characters for consistent search results
 */

/**
 * Normalize Arabic text for search
 * - ا/أ/إ/آ → ا
 * - ه/ة → ه
 * - ي/ى → ي
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  const normalizedDigits = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));

  return normalizedDigits
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/ـ/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u060C\u061B\u061F\u066A-\u066D\u06D4]/g, ' ')
    .replace(/[^0-9A-Za-z\u0621-\u063A\u0641-\u064A\u0660-\u0669\u06F0-\u06F9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARABIC_VARIANT_MAP: Record<string, string[]> = {
  ا: ['ا', 'أ', 'إ', 'آ'],
  ه: ['ه', 'ة'],
  ي: ['ي', 'ى', 'ئ'],
  و: ['و', 'ؤ'],
};

export function expandArabicVariants(text: string, limit = 12): string[] {
  if (!text) return [];
  let variants = [''];
  for (const char of text) {
    const options = ARABIC_VARIANT_MAP[char] ?? [char];
    const next: string[] = [];
    for (const base of variants) {
      for (const option of options) {
        if (next.length >= limit) break;
        next.push(`${base}${option}`);
      }
      if (next.length >= limit) break;
    }
    variants = next;
    if (variants.length >= limit) break;
  }
  return Array.from(new Set(variants)).filter(Boolean);
}

const ARABIC_PREFIXES = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل'];

export function compactArabic(text: string): string {
  return normalizeArabic(text).replace(/\s+/g, '');
}

export function buildSearchTerms(query: string, limit = 12): string[] {
  const trimmed = query.trim();
  const normalized = normalizeArabic(trimmed);
  const terms = new Set<string>();

  const pushTerm = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    terms.add(cleanValue);
  };

  const normalizedTokens = normalized.split(' ').filter(Boolean);

  if (normalized) terms.add(normalized);
  if (trimmed) terms.add(trimmed);
  normalizedTokens.forEach(pushTerm);
  normalizedTokens.forEach((token) => {
    ARABIC_PREFIXES.forEach((prefix) => {
      if (token.startsWith(prefix) && token.length > prefix.length + 1) {
        pushTerm(token.slice(prefix.length));
      }
    });
  });
  expandArabicVariants(normalized, limit).forEach((term) => terms.add(term));
  return Array.from(terms)
    .filter((term) => normalizeArabic(term).length > 0)
    .slice(0, limit);
}

/**
 * Create search pattern from query
 * Returns a pattern that matches normalized text
 */
export function createSearchPattern(query: string): string {
  const normalized = normalizeArabic(query);
  // Escape special regex characters
  return normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text matches search query (normalized)
 */
export function matchesSearch(text: string, query: string): boolean {
  const normalizedText = normalizeArabic(text);
  const normalizedQuery = normalizeArabic(query);
  return normalizedText.includes(normalizedQuery);
}

/**
 * Highlight matched text in search results
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  
  const normalizedQuery = normalizeArabic(query);
  const normalizedText = normalizeArabic(text);
  
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text;
  
  // Find the actual position in original text
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  
  return `${before}<mark class="bg-yellow-200">${match}</mark>${after}`;
}
