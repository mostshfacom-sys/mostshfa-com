'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
// Direct import to avoid barrel export issues

const services = [
  {
    href: '/directories',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7M4 10h7M4 14h7M4 18h7M15 6h5M15 10h5M15 14h5M15 18h5" />
      </svg>
    ),
    title: 'الأدلة الطبية',
    description: 'صفحة مجمعة لكل الأدلة الطبية الأساسية والمتخصصة',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    href: '/emergency',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    title: 'دليل الطوارئ',
    description: 'أقسام الطوارئ وأرقام الإسعاف والأدوية العاجلة',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    href: '/hospitals',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'المستشفيات',
    description: 'ابحث عن أفضل المستشفيات والمراكز الطبية',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    href: '/clinics',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'العيادات',
    description: 'عيادات متخصصة في جميع التخصصات الطبية',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    href: '/labs',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'المعامل',
    description: 'معامل تحاليل معتمدة مع خدمة السحب المنزلي',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    href: '/pharmacies',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'الصيدليات',
    description: 'صيدليات 24 ساعة مع خدمة التوصيل',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    href: '/nursing',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'التمريض المنزلي',
    description: 'خدمات تمريض منزلية متخصصة',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    href: '/drugs',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'دليل الأدوية',
    description: 'معلومات شاملة عن الأدوية والبدائل',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
];

export function ServiceCategories() {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            خدماتنا الطبية
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            نوفر لك دليلاً شاملاً لجميع الخدمات الطبية في مصر، من المستشفيات والعيادات إلى المعامل والصيدليات
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link key={service.href} href={service.href}>
              <Card variant="hover" className="h-full group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${service.lightColor} ${service.textColor} group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {service.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
