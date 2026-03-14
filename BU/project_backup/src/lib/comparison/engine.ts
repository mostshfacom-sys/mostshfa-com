/**
 * Comparison Engine - محرك المقارنة
 * يدعم مقارنة الكيانات الطبية المختلفة (مستشفيات، عيادات، معامل، صيدليات)
 */

export type EntityType = 'hospital' | 'clinic' | 'lab' | 'pharmacy';

export interface ComparisonItem {
  id: number;
  type: EntityType;
  nameAr: string;
  nameEn?: string;
  slug: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  governorate?: string;
  city?: string;
  ratingAvg: number;
  ratingCount: number;
  lat?: number;
  lng?: number;
  // Hospital specific
  hasEmergency?: boolean;
  hospitalType?: string;
  specialties?: string[];
  // Lab specific
  hasHomeSampling?: boolean;
  // Pharmacy specific
  hasDeliveryService?: boolean;
  is24h?: boolean;
  // Clinic specific
  hours?: string;
  isOpen?: boolean;
}

export interface ComparisonField {
  key: string;
  labelAr: string;
  labelEn: string;
  type: 'text' | 'boolean' | 'rating' | 'list' | 'location';
  icon?: string;
  highlight?: 'higher' | 'lower' | 'boolean';
}

// الحقول المشتركة لجميع الكيانات
const commonFields: ComparisonField[] = [
  { key: 'nameAr', labelAr: 'الاسم', labelEn: 'Name', type: 'text' },
  { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', type: 'text', icon: '📞' },
  { key: 'whatsapp', labelAr: 'واتساب', labelEn: 'WhatsApp', type: 'text', icon: '💬' },
  { key: 'website', labelAr: 'الموقع', labelEn: 'Website', type: 'text', icon: '🌐' },
  { key: 'governorate', labelAr: 'المحافظة', labelEn: 'Governorate', type: 'text', icon: '📍' },
  { key: 'city', labelAr: 'المدينة', labelEn: 'City', type: 'text', icon: '🏙️' },
  { key: 'address', labelAr: 'العنوان', labelEn: 'Address', type: 'text', icon: '📌' },
  { key: 'ratingAvg', labelAr: 'التقييم', labelEn: 'Rating', type: 'rating', highlight: 'higher', icon: '⭐' },
  { key: 'ratingCount', labelAr: 'عدد التقييمات', labelEn: 'Reviews', type: 'text', highlight: 'higher', icon: '📊' },
];

// حقول خاصة بالمستشفيات
const hospitalFields: ComparisonField[] = [
  { key: 'hospitalType', labelAr: 'نوع المستشفى', labelEn: 'Hospital Type', type: 'text', icon: '🏥' },
  { key: 'hasEmergency', labelAr: 'طوارئ', labelEn: 'Emergency', type: 'boolean', highlight: 'boolean', icon: '🚑' },
  { key: 'specialties', labelAr: 'التخصصات', labelEn: 'Specialties', type: 'list', icon: '🩺' },
];

// حقول خاصة بالمعامل
const labFields: ComparisonField[] = [
  { key: 'hasHomeSampling', labelAr: 'سحب منزلي', labelEn: 'Home Sampling', type: 'boolean', highlight: 'boolean', icon: '🏠' },
];

// حقول خاصة بالصيدليات
const pharmacyFields: ComparisonField[] = [
  { key: 'hasDeliveryService', labelAr: 'توصيل', labelEn: 'Delivery', type: 'boolean', highlight: 'boolean', icon: '🚚' },
  { key: 'is24h', labelAr: '24 ساعة', labelEn: '24 Hours', type: 'boolean', highlight: 'boolean', icon: '🕐' },
];

// حقول خاصة بالعيادات
const clinicFields: ComparisonField[] = [
  { key: 'hours', labelAr: 'ساعات العمل', labelEn: 'Working Hours', type: 'text', icon: '🕒' },
  { key: 'isOpen', labelAr: 'مفتوح الآن', labelEn: 'Open Now', type: 'boolean', highlight: 'boolean', icon: '✅' },
  { key: 'specialties', labelAr: 'التخصصات', labelEn: 'Specialties', type: 'list', icon: '🩺' },
];

/**
 * الحصول على حقول المقارنة حسب نوع الكيان
 */
export function getComparisonFields(entityType: EntityType): ComparisonField[] {
  const fields = [...commonFields];
  
  switch (entityType) {
    case 'hospital':
      fields.push(...hospitalFields);
      break;
    case 'lab':
      fields.push(...labFields);
      break;
    case 'pharmacy':
      fields.push(...pharmacyFields);
      break;
    case 'clinic':
      fields.push(...clinicFields);
      break;
  }
  
  return fields;
}

/**
 * حساب نقاط المقارنة لكل كيان
 */
export function calculateComparisonScore(item: ComparisonItem): number {
  let score = 0;
  
  // التقييم (0-50 نقطة)
  score += (item.ratingAvg / 5) * 50;
  
  // عدد التقييمات (0-20 نقطة)
  score += Math.min(item.ratingCount / 100, 1) * 20;
  
  // معلومات الاتصال (0-15 نقطة)
  if (item.phone) score += 5;
  if (item.whatsapp) score += 5;
  if (item.website) score += 5;
  
  // الموقع الجغرافي (0-5 نقاط)
  if (item.lat && item.lng) score += 5;
  
  // ميزات خاصة (0-10 نقاط)
  if (item.hasEmergency) score += 5;
  if (item.hasHomeSampling) score += 5;
  if (item.hasDeliveryService) score += 5;
  if (item.is24h) score += 5;
  
  return Math.min(score, 100);
}

/**
 * مقارنة قيمتين وتحديد الأفضل
 */
export function compareValues(
  value1: unknown,
  value2: unknown,
  highlight?: 'higher' | 'lower' | 'boolean'
): { winner: 1 | 2 | 0; diff?: number } {
  if (value1 === value2) return { winner: 0 };
  
  if (highlight === 'boolean') {
    if (value1 === true && value2 !== true) return { winner: 1 };
    if (value2 === true && value1 !== true) return { winner: 2 };
    return { winner: 0 };
  }
  
  if (typeof value1 === 'number' && typeof value2 === 'number') {
    const diff = Math.abs(value1 - value2);
    if (highlight === 'higher') {
      return { winner: value1 > value2 ? 1 : 2, diff };
    }
    if (highlight === 'lower') {
      return { winner: value1 < value2 ? 1 : 2, diff };
    }
  }
  
  return { winner: 0 };
}

/**
 * تحويل الكيان من قاعدة البيانات إلى عنصر مقارنة
 */
export function toComparisonItem(entity: Record<string, unknown>, type: EntityType): ComparisonItem {
  return {
    id: entity.id as number,
    type,
    nameAr: entity.nameAr as string,
    nameEn: entity.nameEn as string | undefined,
    slug: entity.slug as string,
    logo: entity.logo as string | undefined,
    phone: entity.phone as string | undefined,
    whatsapp: entity.whatsapp as string | undefined,
    website: entity.website as string | undefined,
    address: (entity.address || entity.addressAr) as string | undefined,
    governorate: (entity.governorate as { nameAr?: string })?.nameAr,
    city: (entity.city as { nameAr?: string })?.nameAr,
    ratingAvg: (entity.ratingAvg as number) || 0,
    ratingCount: (entity.ratingCount as number) || 0,
    lat: entity.lat as number | undefined,
    lng: entity.lng as number | undefined,
    hasEmergency: entity.hasEmergency as boolean | undefined,
    hospitalType: (entity.type as { nameAr?: string })?.nameAr,
    specialties: (entity.specialties as { nameAr: string }[])?.map(s => s.nameAr),
    hasHomeSampling: entity.hasHomeSampling as boolean | undefined,
    hasDeliveryService: entity.hasDeliveryService as boolean | undefined,
    is24h: entity.is24h as boolean | undefined,
    hours: entity.hours as string | undefined,
    isOpen: entity.isOpen as boolean | undefined,
  };
}

/**
 * الحصول على ملخص المقارنة
 */
export interface ComparisonSummary {
  items: ComparisonItem[];
  scores: number[];
  winner: number; // index of winner
  highlights: {
    field: string;
    labelAr: string;
    winner: number;
    values: unknown[];
  }[];
}

export function getComparisonSummary(items: ComparisonItem[]): ComparisonSummary {
  const scores = items.map(calculateComparisonScore);
  const maxScore = Math.max(...scores);
  const winner = scores.indexOf(maxScore);
  
  const fields = getComparisonFields(items[0]?.type || 'hospital');
  const highlights: ComparisonSummary['highlights'] = [];
  
  for (const field of fields) {
    if (!field.highlight) continue;
    
    const values = items.map(item => item[field.key as keyof ComparisonItem]);
    const uniqueValues = new Set(values.map(v => JSON.stringify(v)));
    
    if (uniqueValues.size > 1) {
      // Find winner for this field
      let fieldWinner = 0;
      let bestValue = values[0];
      
      for (let i = 1; i < values.length; i++) {
        const result = compareValues(bestValue, values[i], field.highlight);
        if (result.winner === 2) {
          fieldWinner = i;
          bestValue = values[i];
        }
      }
      
      highlights.push({
        field: field.key,
        labelAr: field.labelAr,
        winner: fieldWinner,
        values,
      });
    }
  }
  
  return { items, scores, winner, highlights };
}

// الحد الأقصى للعناصر في المقارنة
export const MAX_COMPARISON_ITEMS = 4;

// مفتاح التخزين المحلي
export const COMPARISON_STORAGE_KEY = 'mostshfa_comparison';

/**
 * حفظ عناصر المقارنة في التخزين المحلي
 */
export function saveComparisonToStorage(items: { id: number; type: EntityType }[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(items));
  }
}

/**
 * استرجاع عناصر المقارنة من التخزين المحلي
 */
export function loadComparisonFromStorage(): { id: number; type: EntityType }[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * مسح عناصر المقارنة من التخزين المحلي
 */
export function clearComparisonStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COMPARISON_STORAGE_KEY);
  }
}
