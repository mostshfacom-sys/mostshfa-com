import { Metadata } from 'next';
import { Suspense } from 'react';
import { Header, Footer } from '@/components/shared';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'اتصل بنا | مستشفى.كوم',
  description:
    'تواصل مع فريق مستشفى.كوم للاستفسارات والشراكات والدعم الفني على مدار الساعة.',
};

const contactHighlights = [
  { label: 'متوسط زمن الرد', value: 'أقل من 24 ساعة' },
  { label: 'فريق الدعم', value: 'متاح يومياً' },
  { label: 'الشراكات الطبية', value: 'حلول مخصصة' },
  { label: 'رضا العملاء', value: '96% تقييم إيجابي' },
];

const contactTeams = [
  { title: 'الدعم الفني', value: 'حلول فورية' },
  { title: 'المبيعات', value: 'شراكات طبية' },
  { title: 'الإعلانات', value: 'حملات فعالة' },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="contact"
            title="اتصل بنا"
            subtitle="تواصل مع فريق مستشفى.كوم للاستفسارات والشراكات والدعم الفني على مدار الساعة."
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

        <section className="container-custom pb-10">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {contactHighlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-base font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-primary-600">فرق التواصل</p>
              <div className="mt-4 space-y-3">
                {contactTeams.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container-custom pb-16">
          <ContactClient />
        </section>
      </main>
      <Footer />
    </>
  );
}
