'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Alternative {
  id: number;
  nameAr: string;
  nameEn?: string;
  slug: string;
  activeIngredient?: string;
  priceText?: string;
  category?: string;
  isSameIngredient: boolean;
}

interface DrugAlternativesProps {
  drugSlug: string;
}

export default function DrugAlternatives({ drugSlug }: DrugAlternativesProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlternatives() {
      try {
        const res = await fetch(`/api/drugs/${drugSlug}/alternatives`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setAlternatives(data.alternatives || []);
      } catch (err) {
        setError('فشل في تحميل البدائل');
      } finally {
        setLoading(false);
      }
    }
    fetchAlternatives();
  }, [drugSlug]);

  if (loading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">البدائل المتاحة</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error || alternatives.length === 0) {
    return null;
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        البدائل المتاحة ({alternatives.length})
      </h2>
      
      <div className="space-y-3">
        {alternatives.map((alt) => (
          <Link key={alt.id} href={`/drugs/${alt.slug}`}>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 truncate">{alt.nameAr}</h3>
                  {alt.isSameIngredient && (
                    <Badge variant="success" size="sm">نفس المادة الفعالة</Badge>
                  )}
                </div>
                {alt.nameEn && (
                  <p className="text-xs text-gray-500" dir="ltr">{alt.nameEn}</p>
                )}
                {alt.activeIngredient && (
                  <p className="text-xs text-gray-400 mt-1">المادة الفعالة: {alt.activeIngredient}</p>
                )}
              </div>
              {alt.priceText && (
                <span className="text-sm font-medium text-primary-600 flex-shrink-0">{alt.priceText}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
