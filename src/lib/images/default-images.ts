/**
 * نظام الصور الافتراضية الذكي
 * يوفر صورة مناسبة لكل قسم عندما لا تتوفر صورة خاصة
 */

// الصور الافتراضية لكل قسم
export const DEFAULT_IMAGES = {
  // المستشفيات
  hospital: '/images/defaults/hospital-icon.svg',
  hospitals: '/images/defaults/hospital-icon.svg',
  
  // العيادات
  clinic: '/images/defaults/clinic.svg',
  clinics: '/images/defaults/clinic.svg',
  
  // الصيدليات
  pharmacy: '/images/defaults/pharmacy.svg',
  pharmacies: '/images/defaults/pharmacy.svg',
  
  // المعامل
  lab: '/images/defaults/lab.svg',
  labs: '/images/defaults/lab.svg',
  laboratory: '/images/defaults/lab.svg',
  
  // الأدوية
  drug: '/images/defaults/drug.svg',
  drugs: '/images/defaults/drug.svg',
  medicine: '/images/defaults/drug.svg',
  
  // الأطباء والموظفين
  doctor: '/images/defaults/doctor.svg',
  staff: '/images/defaults/doctor.svg',
  physician: '/images/defaults/doctor.svg',
  
  // التمريض
  nursing: '/images/defaults/nursing.svg',
  nurse: '/images/defaults/nursing.svg',
  
  // المقالات
  article: '/images/defaults/article.svg',
  articles: '/images/defaults/article.svg',
  
  // عام
  general: '/images/defaults/medical.svg',
  default: '/images/defaults/medical.svg',
} as const;

// أنواع الكيانات
export type EntityType = keyof typeof DEFAULT_IMAGES;

/**
 * الحصول على الصورة الافتراضية حسب نوع الكيان
 */
export function getDefaultImage(entityType: string): string {
  if (!entityType) return DEFAULT_IMAGES.default;
  try {
    const type = entityType.toLowerCase() as EntityType;
    return DEFAULT_IMAGES[type] || DEFAULT_IMAGES.default;
  } catch (e) {
    return DEFAULT_IMAGES.default;
  }
}

/**
 * الحصول على الصورة مع fallback للصورة الافتراضية
 */
export function getImageWithFallback(
  imageUrl: string | null | undefined,
  entityType: string
): string {
  if (imageUrl && imageUrl.trim() !== '') {
    // إذا كانت الصورة موجودة، أرجعها
    return imageUrl;
  }
  // وإلا أرجع الصورة الافتراضية
  return getDefaultImage(entityType);
}

/**
 * التحقق من صحة رابط الصورة
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  
  // التحقق من أن الرابط ليس placeholder أو فارغ
  const invalidPatterns = [
    'placeholder',
    'no-image',
    'no_image',
    'default',
    'null',
    'undefined',
  ];
  
  const lowerUrl = url.toLowerCase();
  return !invalidPatterns.some(pattern => lowerUrl.includes(pattern));
}

/**
 * الحصول على الصورة الذكية
 * يتحقق من صحة الرابط ويرجع الصورة الافتراضية إذا لزم الأمر
 */
export function getSmartImage(
  imageUrl: string | null | undefined,
  entityType: string
): string {
  // 1. Check if image is valid
  if (imageUrl && imageUrl.trim() !== '' && isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  // 2. Return default image
  return getDefaultImage(entityType || 'default');
}

/**
 * الحصول على صورة عشوائية من مجموعة صور القسم
 * مفيد لتنويع الصور الافتراضية
 */
export function getRandomDefaultImage(entityType: string): string {
  // يمكن توسيع هذا لاحقاً لدعم صور متعددة لكل قسم
  return getDefaultImage(entityType);
}

/**
 * تحويل مسار الصورة إلى مسار كامل
 * يعالج الحالات المختلفة لمسارات الصور
 */
export function normalizeImagePath(
  imagePath: string | null | undefined,
  entityType: string
): string {
  if (!imagePath || imagePath.trim() === '') {
    return getDefaultImage(entityType);
  }

  const trimmedPath = imagePath.trim();
  const normalizedPath = trimmedPath
    .replace(/\\/g, '/')
    .replace(/&quot;|"/g, '');

  // إذا كان المسار يبدأ بـ http أو https، أرجعه كما هو
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  // إذا كان المسار يبدأ بـ /، أرجعه كما هو
  if (normalizedPath.startsWith('/')) {
    return normalizedPath;
  }

  const cleanedPath = normalizedPath.replace(/^public\//, '');
  const lowerPath = cleanedPath.toLowerCase();

  // مسارات uploads أو images يجب تحويلها إلى مسارات عامة مباشرة
  if (lowerPath.startsWith('uploads/') || lowerPath.startsWith('images/')) {
    return `/${cleanedPath}`;
  }

  const knownFolders = [
    'hospitals',
    'clinics',
    'pharmacies',
    'labs',
    'articles',
    'drugs',
    'staff',
    'nursing',
    'defaults',
    'banners',
    'general',
  ];
  if (knownFolders.some((folder) => lowerPath.startsWith(`${folder}/`))) {
    return `/images/${cleanedPath}`;
  }

  // تحديد مجلد الصور حسب نوع الكيان
  const folderMap: Record<string, string> = {
    drug: '/images/drugs/',
    drugs: '/images/drugs/',
    medicine: '/images/drugs/',
    hospital: '/images/hospitals/',
    hospitals: '/images/hospitals/',
    clinic: '/images/clinics/',
    clinics: '/images/clinics/',
    pharmacy: '/images/pharmacies/',
    pharmacies: '/images/pharmacies/',
    lab: '/images/labs/',
    labs: '/images/labs/',
    laboratory: '/images/labs/',
    article: '/images/articles/',
    articles: '/images/articles/',
    doctor: '/images/staff/',
    staff: '/images/staff/',
    nursing: '/images/nursing/',
    nurse: '/images/nursing/',
  };

  const folder = folderMap[(entityType || 'default').toLowerCase()] || '/images/general/';
  return `${folder}${cleanedPath}`;
}

/**
 * الحصول على الصورة الذكية مع تطبيع المسار
 * يتحقق من صحة الرابط ويطبع المسار ويرجع الصورة الافتراضية إذا لزم الأمر
 */
export function getSmartImageWithNormalization(
  imageUrl: string | null | undefined,
  entityType: string
): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return getDefaultImage(entityType);
  }

  // تطبيع المسار
  const normalizedPath = normalizeImagePath(imageUrl, entityType);
  
  // التحقق من صحة الرابط
  if (isValidImageUrl(normalizedPath)) {
    return normalizedPath;
  }
  
  return getDefaultImage(entityType);
}
