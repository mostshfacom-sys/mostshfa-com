import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
// Direct imports to avoid barrel export issues with Next.js 14 Server Components
import ArticleRating from '@/components/articles/ArticleRating';
import RelatedArticles from '@/components/articles/RelatedArticles';
import { EntityImage } from '@/components/ui/EntityImage';
import prisma from '@/lib/db/prisma';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  try {
    // Decode the URL-encoded slug for Arabic characters
    const decodedSlug = decodeURIComponent(slug);
    const article = await prisma.article.findUnique({
      where: { slug: decodedSlug },
      include: { category: true },
    });
    
    if (article) {
      // Increment views
      await prisma.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } },
      });
    }
    
    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  
  if (!article) {
    return { title: 'المقال غير موجود' };
  }

  return {
    title: `${article.title} | مستشفى.كوم`,
    description: article.excerpt || article.title,
    keywords: article.tags?.split(',').map(t => t.trim()) || [],
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: 'article',
      images: article.image ? [article.image] : [],
      publishedTime: article.publishedAt?.toISOString(),
      authors: article.author ? [article.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.title,
      images: article.image ? [article.image] : [],
    },
  };
}

// Generate static params for better SEO
export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true },
      take: 100, // Limit for build time
    });
    return articles.map((article) => ({ slug: article.slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Calculate reading time
function calculateReadingTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const readingTime = calculateReadingTime(article.content);
  const tags = article.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];

  const breadcrumbItems = [
    { label: 'الرئيسية', href: '/' },
    { label: 'المقالات', href: '/articles' },
    ...(article.category ? [{ label: article.category.nameAr, href: `/articles?category=${article.categoryId}` }] : []),
    { label: article.title },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col lg:flex-row gap-8 mt-6">
            {/* Main Content */}
            <article className="flex-1">
              <Card className="overflow-hidden">
                {/* Header Image */}
                <div className="aspect-video relative">
                  <EntityImage
                    src={article.image}
                    alt={article.title}
                    entityType="article"
                    entityId={article.id}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  />
                </div>

                <div className="p-6 md:p-8">
                  {/* Category & Date */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {article.category && (
                      <Link href={`/articles?category=${article.categoryId}`}>
                        <Badge variant="primary">{article.category.nameAr}</Badge>
                      </Link>
                    )}
                    <span className="text-sm text-gray-500">
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {readingTime} دقيقة قراءة
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {article.title}
                  </h1>

                  {/* Author & Views */}
                  <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-gray-100 mb-6">
                    {article.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{article.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{article.views} مشاهدة</span>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed border-r-4 border-primary-500 pr-4 bg-gray-50 py-3">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Content */}
                  {article.content && (
                    <div 
                      className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-primary-600"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-3">الوسوم</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag: string) => (
                          <Link key={tag} href={`/articles?tag=${encodeURIComponent(tag)}`}>
                            <Badge variant="secondary">#{tag}</Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">قيّم هذا المقال</h3>
                    <ArticleRating articleId={article.id} />
                  </div>

                  {/* Share */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">شارك المقال</h3>
                    <div className="flex gap-3">
                      <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a 
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Related Articles */}
              <RelatedArticles 
                articleId={article.id} 
                categoryId={article.categoryId || undefined}
                tags={article.tags || undefined}
              />
            </article>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Table of Contents - if content has headings */}
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">معلومات المقال</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ar-EG')}
                    </li>
                    {article.author && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {article.author}
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {readingTime} دقيقة قراءة
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {article.views} مشاهدة
                    </li>
                  </ul>
                </Card>

                {/* Quick Links */}
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">روابط سريعة</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/articles" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        جميع المقالات
                      </Link>
                    </li>
                    <li>
                      <Link href="/tools" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        الأدوات الطبية
                      </Link>
                    </li>
                    <li>
                      <Link href="/hospitals" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        دليل المستشفيات
                      </Link>
                    </li>
                  </ul>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
