'use client';

import Link from 'next/link';

export function CallToAction() {
  return (
    <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="cta-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="white"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="container-custom relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            ابدأ البحث عن أقرب خدمة طبية إليك
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            أكثر من 400 مستشفى وعيادة ومعمل وصيدلية في جميع أنحاء مصر
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/hospitals"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              تصفح المستشفيات
            </Link>
            <Link
              href="/search"
              className="px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-400 transition-colors border border-primary-400"
            >
              بحث متقدم
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
