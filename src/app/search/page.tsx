import { Header, Footer, Breadcrumb } from '@/components/shared';
import UniversalHeaderClient from '@/components/shared/UniversalHeaderClient';
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
      ? `نتائج البحث عن "${query}" في دليل الخدمات الطبية`
      : 'ابحث في دليل الخدمات الطبية الشامل',
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const headerTitle = query ? 'نتائج البحث' : 'البحث';
  const headerSubtitle = query
    ? `نتائج البحث عن "${query}" في دليل الخدمات الطبية`
    : 'ابحث في دليل الخدمات الطبية الشامل';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UniversalHeaderClient
          prefix="search"
          title={headerTitle}
          subtitle={headerSubtitle}
          searchPlaceholder="ابحث عن مستشفى، عيادة، طبيب..."
          searchParamKey="q"
          searchAction="/search"
          resetPageOnSearch={false}
          showViewToggle={false}
          showVoiceSearch
          showMapButton={false}
          useBannerText={false}
          className="mb-8"
        />
        <div className="container-custom py-8">
          <Breadcrumb items={[{ label: 'البحث' }]} className="mb-6" />
          <AdvancedSearchClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
