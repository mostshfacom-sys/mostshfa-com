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
  
  return text
    // Normalize Alef variants
    .replace(/[أإآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Normalize Taa Marbuta to Haa
    .replace(/ة/g, 'ه')
    // Normalize Alef Maqsura to Yaa
    .replace(/ى/g, 'ي')
    // Remove Tashkeel (diacritics)
    .replace(/[\u064B-\u065F]/g, '')
    // Remove Tatweel
    .replace(/ـ/g, '')
    .replace(/[^0-9A-Za-z\u0600-\u06FF\s]/g, '')
    // Normalize whitespace
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

export function buildSearchTerms(query: string, limit = 12): string[] {
  const trimmed = query.trim();
  const normalized = normalizeArabic(trimmed);
  const terms = new Set<string>();
  if (normalized) terms.add(normalized);
  if (trimmed) terms.add(trimmed);
  expandArabicVariants(normalized, limit).forEach((term) => terms.add(term));
  return Array.from(terms).filter((term) => normalizeArabic(term).length > 0);
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
