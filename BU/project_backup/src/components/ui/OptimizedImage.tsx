'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
};

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  aspectRatio = 'auto',
  className,
  fill,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        loading="lazy"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  );
}

export default OptimizedImage;
