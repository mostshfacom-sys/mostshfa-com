'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';

const featuredArticles = [
  {
    id: 1,
    title: 'أهمية الفحص الدوري للكشف المبكر عن الأمراض',
    slug: 'importance-of-regular-checkups',
    excerpt: 'تعرف على أهمية إجراء الفحوصات الطبية الدورية وكيف يمكن أن تساعد في الكشف المبكر.',
    category: 'الوقاية',
    date: '2026-01-10',
    image: null,
  },
  {
    id: 2,
    title: 'نصائح للحفاظ على صحة القلب',
    slug: 'heart-health-tips',
    excerpt: 'دليل شامل للحفاظ على صحة القلب من خلال التغذية السليمة والتمارين.',
    category: 'صحة القلب',
    date: '2026-01-08',
    image: null,
  },
  {
    id: 3,
    title: 'التغذية السليمة لمرضى السكري',
    slug: 'diabetes-nutrition',
    excerpt: 'دليل غذائي شامل لمرضى السكري يتضمن الأطعمة المسموحة والممنوعة.',
    category: 'التغذية',
    date: '2026-01-03',
    image: null,
  },
];

export function FeaturedArticles() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              المقالات الطبية
            </h2>
            <p className="text-gray-600">
              أحدث المقالات والنصائح الصحية من أطباء متخصصين
            </p>
          </div>
          <Link 
            href="/articles"
            className="hidden md:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            عرض الكل
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredArticles.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`}>
              <Card variant="hover" className="h-full group overflow-hidden">
                {/* Image with EntityCardImage */}
                <div className="relative -mx-4 -mt-4 mb-4">
                  <EntityCardImage
                    src={article.image}
                    alt={article.title}
                    entityType="article"
                    aspectRatio="16/9"
                    className="rounded-t-xl"
                  />
                  <Badge className="absolute top-3 right-3 z-10" variant="primary" size="sm">
                    {article.category}
                  </Badge>
                </div>

                <div className="px-1">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(article.date).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="text-center mt-6 md:hidden">
          <Link 
            href="/articles"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            عرض جميع المقالات
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
