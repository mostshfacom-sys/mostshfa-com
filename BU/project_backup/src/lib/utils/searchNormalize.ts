/**
 * تطبيع النص العربي للبحث الشامل
 * يتجاهل الهمزات، التشكيل، الياء/ى، التاء المربوطة/الهاء، وعلامات الترقيم
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // توحيد الهمزات - تحويل جميع أنواع الألف إلى "ا"
    .replace(/[أإآءئؤ]/g, 'ا')
    // توحيد الياء والألف المقصورة → ي
    .replace(/[ىي]/g, 'ي')
    // توحيد التاء المربوطة والهاء → ه
    .replace(/[ةه]/g, 'ه')
    // إزالة التشكيل (الفتحة، الضمة، الكسرة، السكون، الشدة، إلخ) + التطويل
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // إزالة علامات الترقيم والرموز
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،۔'"«»\[\]<>@]/g, '')
    // إزالة المسافات المتعددة
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * فحص إذا كان النص يحتوي على كلمة البحث (مع التطبيع)
 */
export function searchIncludes(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  
  const normalizedText = normalizeArabicText(text);
  const normalizedSearch = normalizeArabicText(searchTerm);
  
  return normalizedText.includes(normalizedSearch);
}

/**
 * فلترة قائمة بناءً على البحث (مع التطبيع)
 */
export function filterBySearch<T extends { nameAr?: string; name_ar?: string }>(
  items: T[],
  searchTerm: string
): T[] {
  if (!searchTerm) return items;
  
  const normalizedSearch = normalizeArabicText(searchTerm);
  
  return items.filter(item => {
    const name = item.nameAr || item.name_ar || '';
    const normalizedName = normalizeArabicText(name);
    return normalizedName.includes(normalizedSearch);
  });
}