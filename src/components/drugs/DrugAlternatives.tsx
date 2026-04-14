'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityThumbnail } from '@/components/ui/EntityImage';

interface Alternative {
  id: number;
  nameAr: string;
  nameEn?: string;
  image?: string | null;
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
      <Card className="rounded-[2rem]">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">البدائل المتاحة</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">نبحث عن أدوية قريبة في المادة الفعالة أو التصنيف</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-slate-800" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const shownAlternatives = alternatives.slice(0, 6);

  return (
    <Card className="rounded-[2rem]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">البدائل المتاحة</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {error
                ? 'تعذر تحميل البدائل في الوقت الحالي'
                : alternatives.length > 0
                  ? `تم العثور على ${alternatives.length} بدائل محتملة`
                  : 'لا توجد بدائل واضحة بناءً على المادة الفعالة أو التصنيف'}
            </p>
          </div>
        </div>
        {alternatives.length > 0 && (
          <Badge variant="secondary" size="sm">
            {alternatives.length}
          </Badge>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          لم نتمكن من جلب البدائل الآن. جرّب تحديث الصفحة بعد قليل.
        </div>
      ) : shownAlternatives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {shownAlternatives.map((alt) => (
            <Link key={alt.id} href={`/drugs/${encodeURIComponent(alt.slug)}`} className="group block">
              <div className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:border-primary-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-900/40">
                <div className="flex items-start gap-4">
                  <EntityThumbnail
                    src={alt.image}
                    alt={alt.nameAr}
                    entityType="drug"
                    entityId={alt.id}
                    size="md"
                    className="rounded-3xl border-2 border-white bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-800/50"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {alt.isSameIngredient && (
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1 rounded-full text-[10px] font-black">
                          نفس المادة الفعالة
                        </span>
                      )}
                      {alt.category && (
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 px-2.5 py-1 rounded-full text-[10px] font-black">
                          {alt.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {alt.nameAr}
                    </h3>

                    {alt.nameEn && (
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-1" dir="ltr">
                        {alt.nameEn}
                      </p>
                    )}
                  </div>
                </div>

                {alt.activeIngredient && (
                  <div
                    className="mt-4 max-h-24 overflow-auto rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 break-words"
                    dir="ltr"
                  >
                    {alt.activeIngredient}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {alt.priceText ? (
                      <span className="text-primary-600 dark:text-primary-300">{alt.priceText}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">بدون سعر</span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-primary-600 dark:text-primary-300 opacity-80 group-hover:opacity-100 transition-opacity">
                    فتح
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-300">
          لا توجد بدائل مباشرة لهذا الدواء حالياً. راجع المادة الفعالة أو استخدم بحث الصيدليات للعثور على بدائل قريبة.
        </div>
      )}
    </Card>
  );
}
