'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  category?: { nameAr: string };
  publishedAt?: string;
}

interface RelatedArticlesProps {
  articleId: number;
  categoryId?: number;
  tags?: string;
  limit?: number;
}

export default function RelatedArticles({ articleId, categoryId, tags, limit = 4 }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set('category', String(categoryId));
        if (tags) params.set('tag', tags.split(',')[0]); // Use first tag
        params.set('limit', String(limit + 1)); // Get one extra to exclude current
        
        const res = await fetch(`/api/articles?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out current article
          const filtered = (data.articles || [])
            .filter((a: Article) => a.id !== articleId)
            .slice(0, limit);
          setArticles(filtered);
        }
      } catch (err) {
        console.error('Error fetching related articles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRelated();
  }, [articleId, categoryId, tags, limit]);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">مقالات ذات صلة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">مقالات ذات صلة</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`}>
            <Card variant="hover" className="h-full overflow-hidden">
              <div className="-mx-4 -mt-4 mb-3">
                <EntityCardImage
                  src={article.image}
                  alt={article.title}
                  entityType="article"
                  aspectRatio="16/10"
                  className="rounded-t-xl"
                />
              </div>
              {article.category && (
                <Badge variant="secondary" size="sm" className="mb-2">
                  {article.category.nameAr}
                </Badge>
              )}
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                {article.title}
              </h3>
              {article.publishedAt && (
                <p className="text-xs text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString('ar-EG')}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
