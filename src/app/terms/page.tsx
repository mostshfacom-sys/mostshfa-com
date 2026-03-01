import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';

export const metadata: Metadata = {
  title: 'الشروط والأحكام | مستشفى.كوم',
  description:
    'تعرف على شروط وأحكام استخدام موقع مستشفى.كوم والخدمات الطبية الرقمية المتاحة عبر المنصة.',
};

const termsSections = [
  {
    title: 'قبول الشروط',
    items: [
      'باستخدامك للموقع فأنت توافق على الالتزام بهذه الشروط.',
      'في حال عدم الموافقة، يرجى التوقف عن استخدام الخدمات فوراً.',
      'قد نطلب منك قبول شروط إضافية لبعض الخدمات المتخصصة.',
    ],
  },
  {
    title: 'استخدام المحتوى الطبي',
    items: [
      'المحتوى الطبي يقدم لأغراض تثقيفية ولا يغني عن استشارة الطبيب.',
      'يحظر نسخ المحتوى أو إعادة نشره دون إذن خطي.',
      'نحرص على تحديث المقالات باستمرار وفق أحدث الإرشادات الطبية.',
    ],
  },
  {
    title: 'الحسابات والتواصل',
    items: [
      'قد يتطلب بعض الخدمات إنشاء حساب بمعلومات صحيحة.',
      'أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بك.',
      'يحق لنا تعليق الحسابات المخالفة للسياسات العامة.',
    ],
  },
  {
    title: 'الإعلانات والمحتوى المدعوم',
    items: [
      'قد تتضمن المنصة إعلانات أو محتوى مدعوم وفق سياسات الشفافية.',
      'لا نضمن دقة المحتوى الإعلاني المقدم من أطراف خارجية.',
      'نحرص على عرض إعلانات تتوافق مع القيم الطبية للموقع.',
    ],
  },
  {
    title: 'حدود المسؤولية',
    items: [
      'لا نتحمل المسؤولية عن أي قرارات طبية يتم اتخاذها اعتماداً على المحتوى فقط.',
      'نحن غير مسؤولين عن أي أضرار ناتجة عن استخدام الموقع بشكل غير مناسب.',
      'يتم توفير الخدمات كما هي دون ضمانات صريحة أو ضمنية.',
    ],
  },
  {
    title: 'التعديلات على الشروط',
    items: [
      'قد نقوم بتحديث الشروط من وقت لآخر، وسيتم إشعار المستخدمين عند التغيير.',
      'استمرارك في استخدام الموقع بعد التحديث يعني موافقتك على الشروط الجديدة.',
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="terms"
            title="الشروط والأحكام"
            subtitle="تساعد هذه الشروط على حماية حقوق المستخدمين وضمان تقديم خدمات طبية رقمية موثوقة."
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

        <section className="container-custom pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-6">
              {termsSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-xs font-semibold text-emerald-700">ملاحظة</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">تحديثات مستمرة</h3>
                <p className="mt-3 text-sm text-gray-600">
                  نراجع الشروط بشكل دوري لضمان توافقها مع أفضل الممارسات الطبية والقانونية.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">هل تحتاج للمساعدة؟</h3>
                <p className="mt-3 text-sm text-gray-600">
                  فريق مستشفى.كوم متاح دائماً للإجابة عن استفسارات الاستخدام.
                </p>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  تواصل معنا
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
