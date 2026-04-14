'use client';

import Link from 'next/link';

const youtubeChannelUrl =
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ||
  'https://www.youtube.com/@%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89%D8%AF%D9%88%D8%AA%D9%83%D9%88%D9%85';

const footerLinks = {
  services: [
    { href: '/directories', label: 'الأدلة الطبية' },
    { href: '/emergency', label: 'دليل الطوارئ' },
    { href: '/hospitals-pro', label: 'المستشفيات' },
    { href: '/clinics', label: 'العيادات' },
    { href: '/labs', label: 'المعامل' },
    { href: '/pharmacies', label: 'الصيدليات' },
    { href: '/nursing', label: 'خدمات التمريض' },
  ],
  content: [
    { href: '/articles', label: 'المقالات الطبية' },
    { href: '/medical-brief', label: 'الموجز الطبي' },
    { href: '/medical-info', label: 'المعلومات الطبية' },
    { href: '/medical-videos', label: 'الفيديوهات الطبية' },
    { href: '/tools', label: 'الأدوات الصحية' },
    { href: '/drugs', label: 'دليل الأدوية' },
    { href: '/first-aid', label: 'الإسعافات الأولية' },
    { href: '/mental-health', label: 'الصحة النفسية' },
  ],
  about: [
    { href: '/about', label: 'من نحن' },
    { href: '/contact', label: 'اتصل بنا' },
    { href: '/privacy', label: 'سياسة الخصوصية' },
    { href: '/terms', label: 'الشروط والأحكام' },
    { href: '/search', label: 'البحث العام' },
    { href: '/map', label: 'الخريطة التفاعلية' },
    { href: '/directories', label: 'الأدلة الطبية' },
  ],
  important: [
    { href: '/medical-info', label: 'المعلومات الطبية' },
    { href: '/medical-videos', label: 'الفيديوهات الطبية' },
    { href: '/first-aid', label: 'الإسعافات الأولية' },
    { href: '/mental-health', label: 'الصحة النفسية' },
    { href: '/fitness-health', label: 'اللياقة والصحة' },
    { href: '/beauty-health', label: 'الجمال والصحة' },
    { href: '/doctors', label: 'دليل الأطباء' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">مستشفى.كوم</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              دليلك الشامل للخدمات الطبية في مصر. ابحث عن أقرب مستشفى، عيادة، معمل، أو صيدلية إليك.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/MostshfaDotCom/?locale=ar_AR"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href={youtubeChannelUrl} className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5a3 3 0 00-2.1 2.1A31.4 31.4 0 000 12a31.4 31.4 0 00.5 5.8 3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1A31.4 31.4 0 0024 12a31.4 31.4 0 00-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">الخدمات الطبية</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-white font-semibold mb-4">المحتوى</h3>
            <ul className="space-y-2">
              {footerLinks.content.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">عن الموقع</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">روابط مهمة</h3>
            <ul className="space-y-2">
              {footerLinks.important.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} مستشفى.كوم - جميع الحقوق محفوظة.</p>
          <div className="mt-2 text-[10px] leading-5 font-light text-gray-500 sm:text-xs">
            <p className="block sm:inline">تنويه: المعلومات المقدمة لأغراض تثقيفية ولا تغني عن الاستشارة الطبية المتخصصة،</p>
            <p className="block sm:inline"> والموقع غير مسؤول عن أي استخدام.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
