'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';

interface Category {
  id: number;
  nameAr: string;
  slug: string;
  articleCount: number;
}

interface Tag {
  tag: string;
  count: number;
}

export default function ArticleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get('category');
  const currentTag = searchParams.get('tag');

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/articles/categories'),
          fetch('/api/articles/tags?limit=15'),
        ]);
        
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData.tags || []);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilters();
  }, []);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset pagination
    router.push(`/articles?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-lg w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">التصنيفات</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('category', null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                !currentCategory
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilter('category', String(cat.id))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentCategory === String(cat.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.nameAr}
                <span className="mr-1 text-xs opacity-70">({cat.articleCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">الوسوم الشائعة</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.tag}
                onClick={() => updateFilter('tag', currentTag === t.tag ? null : t.tag)}
                className={`transition-colors ${
                  currentTag === t.tag ? '' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Badge
                  variant={currentTag === t.tag ? 'primary' : 'secondary'}
                  size="sm"
                >
                  #{t.tag}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
