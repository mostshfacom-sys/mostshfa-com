'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getDefaultImage, normalizeImagePath, isValidImageUrl } from '@/lib/images/default-images';
import { useImageSettings } from '@/components/ui/ImageSettingsProvider';

interface EntityImageProps {
  src: string | null | undefined;
  alt: string;
  entityType: 'hospital' | 'clinic' | 'pharmacy' | 'lab' | 'drug' | 'doctor' | 'nursing' | 'article' | 'general';
  entityId?: number | string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * الحصول على الصورة المناسبة
 * يدعم: الصور المحلية، الروابط الخارجية (http/https)، Pexels، Unsplash، إلخ
 */
function getImageSource(
  src: string | null | undefined,
  entityType: string,
  entityId?: number | string,
  fallbackImage?: string
): string {
  const fallback = fallbackImage?.trim() ? fallbackImage.trim() : getDefaultImage(entityType);
  const trimmedSrc = typeof src === 'string' ? src.trim() : '';
  const defaultImage = getDefaultImage(entityType);
  const isEmpty =
    !trimmedSrc || trimmedSrc === 'null' || trimmedSrc === 'undefined';
  const isDefaultImage =
    trimmedSrc === defaultImage || trimmedSrc === fallback;
  const allowIdFallback = entityType !== 'hospital';
  
  if (isEmpty || isDefaultImage) {
    // محاولة البحث عن صورة محلية بناءً على الـ ID (لغير المستشفيات)
    if (entityId && allowIdFallback) {
      const folderMap: Record<string, string> = {
        hospital: 'hospitals',
        clinic: 'clinics',
        pharmacy: 'pharmacies',
        lab: 'labs',
        drug: 'drugs',
        article: 'articles',
        doctor: 'staff',
        nursing: 'nursing',
      };
      const folder = folderMap[entityType] || 'general';
      // جرب صيغ مختلفة للصورة
      return `/images/${folder}/${entityId}.jpg`;
    }
    return fallback;
  }
  
  // إذا كان رابط خارجي (http/https)، أرجعه كما هو
  // يشمل: Pexels, Unsplash, mostshfa.com, وأي رابط خارجي آخر
  if (trimmedSrc.startsWith('http://') || trimmedSrc.startsWith('https://')) {
    return trimmedSrc;
  }
  
  // إذا كان مسار محلي يبدأ بـ /، أرجعه كما هو
  if (trimmedSrc.startsWith('/')) {
    return trimmedSrc;
  }
  
  // تحقق من صحة الرابط (ليس placeholder أو no-image)
  if (!isValidImageUrl(trimmedSrc)) {
    return fallback;
  }
  
  // تطبيع المسار (إضافة مجلد الصور المناسب)
  return normalizeImagePath(trimmedSrc, entityType);
}

/**
 * مكون صورة ذكي يعرض صورة الكيان أو صورة افتراضية مناسبة
 */
export function EntityImage(props: any) {
  const {
    src,
    alt,
    entityType,
    entityId,
    width,
    height,
    fill = false,
    className = '',
    priority = false,
    sizes,
  } = props;

  const { hospitalDefaultImage } = useImageSettings?.() || {};
  
  const safeEntityType = (entityType && typeof entityType === 'string') ? entityType : 'default';

  const resolvedFallback =
    safeEntityType === 'hospital' && hospitalDefaultImage?.trim()
      ? hospitalDefaultImage.trim()
      : getDefaultImage(safeEntityType);

  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (src) return src;
    return resolvedFallback;
  });
  
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    setHasError(true);
    setImgSrc(resolvedFallback);
  };

  // Ensure width/height are provided if not fill
  const finalFill = fill || (!width && !height);
  const finalWidth = !finalFill ? (width || 400) : undefined;
  const finalHeight = !finalFill ? (height || 300) : undefined;

  return (
    <Image
      src={imgSrc || resolvedFallback}
      alt={alt || 'Image'}
      width={finalWidth}
      height={finalHeight}
      fill={finalFill}
      className={className}
      priority={priority}
      sizes={sizes || (finalFill ? '100vw' : undefined)}
      onError={handleError}
    />
  );
}

/**
 * مكون صورة مصغرة للكيان
 */
export function EntityThumbnail({
  src,
  alt,
  entityType,
  entityId,
  size = 'md',
  className = '',
}: {
  src: string | null | undefined;
  alt: string;
  entityType: EntityImageProps['entityType'];
  entityId?: number | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: { width: 48, height: 48 },
    md: { width: 80, height: 80 },
    lg: { width: 120, height: 120 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ width, height }}
    >
      <EntityImage
        src={src}
        alt={alt}
        entityType={entityType}
        entityId={entityId}
        fill
        className="object-cover"
      />
    </div>
  );
}

/**
 * مكون صورة البطاقة
 */
export function EntityCardImage({
  src,
  alt,
  entityType,
  entityId,
  aspectRatio = '16/9',
  className = '',
}: {
  src: string | null | undefined;
  alt: string;
  entityType: EntityImageProps['entityType'];
  entityId?: number | string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <EntityImage
        src={src}
        alt={alt}
        entityType={entityType}
        entityId={entityId}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

export default EntityImage;
