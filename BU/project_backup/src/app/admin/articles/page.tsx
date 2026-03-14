'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  views: number;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Articles Management</h1>
        <Link href="/admin/articles/new" className="bg-primary-600 text-white px-4 py-2 rounded-lg">
          New Article
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No articles found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">Title</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b">
                  <td className="py-2">{article.title}</td>
                  <td className="py-2">{article.views}</td>
                  <td className="py-2">
                    <Link href={`/admin/articles/${article.id}`} className="text-blue-600 mr-2">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
