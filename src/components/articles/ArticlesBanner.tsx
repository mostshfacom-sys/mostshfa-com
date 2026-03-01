'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BannerData {
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isEnabled: boolean;
}

interface ArticlesBannerProps {
  initialData?: BannerData | null;
}

export default function ArticlesBanner({ initialData }: ArticlesBannerProps) {
  const [banner, setBanner] = useState<BannerData | null>(initialData || null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetch('/api/admin/banner?pageKey=articles')
        .then(res => res.json())
        .then(data => {
          if (data.banner) setBanner(data.banner);
        })
        .catch(console.error);
    }
  }, [initialData]);

  // Default banner if no custom banner or disabled
  if (!banner || !banner.isEnabled) {
    return (
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500 text-white overflow-hidden mb-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Medical Icons Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="medical-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1" fill="none"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#medical-pattern)"/>
          </svg>
        </div>

        <div className="container-custom relative py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-right">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="text-sm font-medium">مقالات طبية موثوقة</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                المقالات الطبية
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto md:mx-0 leading-relaxed">
                مقالات طبية موثوقة ومعلومات صحية شاملة من أطباء متخصصين لمساعدتك في الحفاظ على صحتك
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-sm">محتوى موثوق</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">أطباء متخصصين</span>
                </div>
              </div>
            </div>

            {/* Decorative Medical Illustration */}
            <div className="hidden md:block flex-shrink-0">
              <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-3xl -rotate-3" />
                <div className="relative bg-white/30 backdrop-blur-md rounded-3xl p-8 flex items-center justify-center">
                  <svg className="w-32 h-32 lg:w-40 lg:h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Bottom */}
        <div className="relative -mb-1">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>
    );
  }

  // Custom banner with image
  const BannerContent = (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      {banner.imageUrl && !imageError ? (
        <div className="absolute inset-0">
          <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner'}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-700/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500" />
      )}

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container-custom relative py-16 md:py-20 text-white">
        <div className="max-w-3xl mx-auto text-center md:text-right md:mx-0">
          {banner.title && (
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {banner.title}
            </h1>
          )}
          
          {banner.subtitle && (
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="relative -mb-1">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );

  // Wrap with link if linkUrl exists
  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} className="block hover:opacity-95 transition-opacity">
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
