import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';

export const metadata: Metadata = {
  title: 'من نحن | مستشفى.كوم',
  description:
    'تعرف على رؤية مستشفى.كوم وكيف نعيد تعريف تجربة البحث عن الخدمات والمقالات الطبية في مصر.',
};

const highlights = [
  {
    title: 'رؤية واضحة',
    description: 'نهدف لتقديم تجربة صحية رقمية متكاملة تجمع بين الدقة وسهولة الوصول.',
  },
  {
    title: 'محتوى طبي موثوق',
    description: 'نراجع المحتوى الطبي مع مختصين لضمان وصول المعلومة الصحيحة بسرعة.',
  },
  {
    title: 'بيانات محدثة',
    description: 'نحدث أدلة المستشفيات والعيادات والمعامل بشكل دوري لضمان دقة البيانات.',
  },
  {
    title: 'تجربة عربية عصرية',
    description: 'واجهة عربية مصممة خصيصاً لتسهيل الوصول إلى الخدمات الطبية بلمسة واحدة.',
  },
];

const milestones = [
  { label: 'مستخدم نشط', value: '120K+' },
  { label: 'مقال طبي', value: '4,800+' },
  { label: 'دليل طبي', value: '2,100+' },
  { label: 'شراكة طبية', value: '320+' },
];

const values = [
  'الشفافية في تقديم المعلومات',
  'الدقة العلمية في المقالات الطبية',
  'التواصل السريع مع المستخدمين',
  'الابتكار المستمر في تجربة البحث',
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="about"
            title="من نحن"
            subtitle="تعرف على رؤية مستشفى.كوم وكيف نعيد تعريف تجربة البحث عن الخدمات والمقالات الطبية في مصر."
            searchPlaceholder="ابحث في الموقع..."
            searchParamKey="q"
            searchAction="/search"
            resetPageOnSearch={false}
            showViewToggle={false}
            showVoiceSearch
            showResultsCount={false}
            showMapButton={false}
            useBannerText={false}
            className="mb-10"
          />
        </Suspense>

        <section className="container-custom pb-16 space-y-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">رسالتنا</h2>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  نسعى إلى تمكين المستخدمين من اتخاذ قرارات صحية سليمة عبر محتوى عربي موثوق، وأدلة
                  طبية دقيقة، وأدوات رقمية تدعم الحياة اليومية.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                <p className="text-xs font-semibold text-indigo-700">قيمنا الأساسية</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {values.map((value) => (
                    <li key={value} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">تواصل معنا</h3>
                <p className="mt-3 text-sm text-gray-600">
                  نرحب بجميع المقترحات والشراكات الطبية التي تساهم في تطوير المنصة.
                </p>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  ابدأ الآن
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
