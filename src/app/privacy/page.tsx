import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | مستشفى.كوم',
  description:
    'اطلع على سياسة الخصوصية الخاصة بمستشفى.كوم وكيف نحمي بياناتك أثناء استخدامك للموقع والخدمات الطبية.',
};

const privacySections = [
  {
    title: 'المعلومات التي نجمعها',
    items: [
      'البيانات الأساسية التي تزودنا بها عند التواصل أو التسجيل.',
      'معلومات الاستخدام لتحسين تجربة البحث والخدمات.',
      'تفضيلات المحتوى التي تساعدنا على تخصيص الاقتراحات الطبية.',
    ],
  },
  {
    title: 'كيفية استخدام البيانات',
    items: [
      'تحسين جودة الخدمات الطبية وتجربة المستخدم.',
      'إرسال تحديثات أو تنبيهات عند طلبك لذلك.',
      'إعداد تقارير تحليلية داخلية لتحسين المحتوى.',
    ],
  },
  {
    title: 'المشاركة والإفصاح',
    items: [
      'لا نشارك بياناتك مع أطراف خارجية بدون موافقتك.',
      'قد نستخدم مزودي خدمة موثوقين لدعم تشغيل الموقع.',
      'نلتزم بالمتطلبات القانونية عند الطلب الرسمي.',
    ],
  },
  {
    title: 'الأمان وحماية البيانات',
    items: [
      'نستخدم إجراءات تقنية وتنظيمية لحماية بياناتك.',
      'يتم تقييد الوصول للبيانات الحساسة على الفريق المخول فقط.',
      'نراجع أنظمة الأمان بشكل دوري لضمان أفضل حماية.',
    ],
  },
  {
    title: 'حقوقك وخياراتك',
    items: [
      'يمكنك طلب تحديث أو حذف بياناتك الشخصية.',
      'لك الحق في معرفة كيفية استخدام بياناتك.',
      'نوفر لك وسائل سهلة للتواصل وتقديم الاستفسارات.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="privacy"
            title="سياسة الخصوصية"
            subtitle="نلتزم بحماية بياناتك وشفافية كيفية استخدامها لضمان تجربة آمنة وموثوقة على مستشفى.كوم."
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
              {privacySections.map((section) => (
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
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-semibold text-amber-700">معلومة سريعة</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">نراجع السياسة دورياً</h3>
                <p className="mt-3 text-sm text-gray-600">
                  نعمل باستمرار على تحديث السياسة بما يتوافق مع القوانين المحلية وأفضل الممارسات.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">هل لديك استفسار؟</h3>
                <p className="mt-3 text-sm text-gray-600">
                  يسعدنا الرد على جميع أسئلتك المتعلقة بالخصوصية وحماية البيانات.
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
