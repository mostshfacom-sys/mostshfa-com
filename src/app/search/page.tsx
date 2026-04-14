import { Header, Footer, Breadcrumb } from '@/components/shared';
import AdvancedSearchClient from '@/components/search/AdvancedSearchClient';
import type { Metadata } from 'next';

interface PageProps {
  searchParams: {
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = searchParams.q || '';
  return {
    title: query ? `نتائج البحث: ${query}` : 'البحث',
    description: query
      ? `نتائج البحث عن "${query}" داخل كل أقسام موقع مستشفى.كوم`
      : 'ابحث في كل أقسام موقع مستشفى.كوم بنتائج أدق وتصنيفات أوضح',
    alternates: {
      canonical: '/search',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/40 to-white transition-colors duration-300 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="container-custom py-8 md:py-10">
          <Breadcrumb items={[{ label: 'البحث' }]} className="mb-6" />
          <AdvancedSearchClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
