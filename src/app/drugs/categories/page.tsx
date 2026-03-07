import { Header, Footer, Breadcrumb } from '@/components/shared';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { BeakerIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'تصنيفات الأدوية | مستشفى.كوم',
  description: 'تصفح جميع تصنيفات الأدوية والمواد الفعالة في دليل الأدوية المصري.',
};

export default async function DrugCategoriesPage() {
  const categories = await prisma.drugCategory.findMany({
    include: {
      _count: {
        select: { drugs: true },
      },
    },
    orderBy: {
      drugs: {
        _count: 'desc',
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'دليل الأدوية', href: '/drugs' },
            { label: 'التصنيفات', href: '/drugs/categories' },
          ]}
        />

        <div className="mt-8 mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            تصنيفات الأدوية
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            تصفح الأدوية حسب التصنيف العلاجي أو المادة الفعالة. تم ترتيب التصنيفات حسب عدد الأدوية المتاحة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/drugs?category=${cat.id}`} className="block group">
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-blue-500 hover:border-t-blue-600">
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BeakerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200">
                    {cat._count.drugs} دواء
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
