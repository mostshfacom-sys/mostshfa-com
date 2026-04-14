'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Drug {
  id: number;
  nameAr: string;
  nameEn?: string;
  activeIngredient?: string;
}

interface Interaction {
  drug1: Drug;
  drug2: Drug;
  severity: 'severe' | 'moderate' | 'mild';
  description: string;
  recommendation: string;
}

interface DrugInteractionsProps {
  currentDrug?: Drug;
}

export default function DrugInteractions({ currentDrug }: DrugInteractionsProps) {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>(currentDrug ? [currentDrug] : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const res = await fetch(`/api/drugs?search=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('فشل البحث عن الأدوية');
        }

        const data = await res.json();
        const filtered = (data.drugs || []).filter((d: Drug) => !selectedDrugs.find((s) => s.id === d.id));
        setSearchResults(filtered);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setSearchResults([]);
        setSearchError('تعذر إكمال البحث الآن');
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, selectedDrugs]);

  const addDrug = (drug: Drug) => {
    if (selectedDrugs.length < 5 && !selectedDrugs.find((d) => d.id === drug.id)) {
      setSelectedDrugs((current) => [...current, drug]);
      setSearchQuery('');
      setSearchResults([]);
      setChecked(false);
      setError(null);
    }
  };

  const removeDrug = (drugId: number) => {
    setSelectedDrugs((current) => current.filter((d) => d.id !== drugId));
    setChecked(false);
    setError(null);
  };

  const checkInteractions = async () => {
    if (selectedDrugs.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/drugs/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugIds: selectedDrugs.map((d) => d.id) }),
      });

      if (!res.ok) {
        throw new Error('فشل فحص التفاعلات');
      }

      const data = await res.json();
      setInteractions(data.interactions || []);
      setDisclaimer(data.disclaimer || '');
      setChecked(true);
    } catch {
      setError('تعذر فحص التفاعلات الآن. حاول مرة أخرى بعد قليل.');
      setChecked(false);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'خطير';
      case 'moderate':
        return 'متوسط';
      case 'mild':
        return 'منخفض';
      default:
        return severity;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200';
      case 'moderate':
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200';
      case 'mild':
        return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  };

  return (
    <Card className="rounded-[2rem]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">فحص التفاعلات الدوائية</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            أضف دواءين أو أكثر لمراجعة التداخلات الشائعة بشكل سريع
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-black text-slate-900 dark:text-white">الأدوية المحددة</div>
          <Badge variant="secondary" size="sm">
            {selectedDrugs.length}/5
          </Badge>
        </div>
        <div className="flex min-h-[52px] flex-wrap gap-2">
          {selectedDrugs.length > 0 ? (
            selectedDrugs.map((drug, index) => (
              <span
                key={drug.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span className="truncate">{drug.nameAr}</span>
                {index === 0 && currentDrug?.id === drug.id && (
                  <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-black text-primary-700 dark:border-primary-700/50 dark:bg-primary-900/60 dark:text-primary-50">
                    الدواء الحالي
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeDrug(drug.id)}
                  className="text-slate-400 transition-colors hover:text-rose-500"
                  aria-label={`إزالة ${drug.nameAr}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">ابدأ بإضافة أدوية للمقارنة</span>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن دواء لإضافته..."
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-950/40"
          disabled={selectedDrugs.length >= 5}
        />

        {(searchLoading || searchResults.length > 0 || searchError) && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {searchLoading && (
              <div className="px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400">جاري البحث...</div>
            )}
            {!searchLoading && searchError && (
              <div className="px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{searchError}</div>
            )}
            {!searchLoading && !searchError && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400">لا توجد نتائج مطابقة</div>
            )}
            {!searchLoading &&
              !searchError &&
              searchResults.map((drug) => (
                <button
                  key={drug.id}
                  type="button"
                  onClick={() => addDrug(drug)}
                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-right transition hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900 dark:text-white">{drug.nameAr}</div>
                    {drug.activeIngredient && (
                      <div className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{drug.activeIngredient}</div>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-primary-600 dark:text-primary-300">إضافة</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm font-medium text-primary-800 dark:border-primary-900/40 dark:bg-slate-900/60 dark:text-slate-100">
        للحصول على نتيجة أدق، اترك الدواء الحالي ضمن القائمة ثم أضف دواءً آخر واحدًا على الأقل.
      </div>

      <button
        type="button"
        onClick={checkInteractions}
        disabled={selectedDrugs.length < 2 || loading}
        className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
      >
        {loading ? 'جاري فحص التفاعلات...' : 'فحص التفاعلات الآن'}
      </button>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}

      {checked && (
        <div className="mt-5 space-y-3">
          {interactions.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm font-black text-rose-600 dark:text-rose-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                تم العثور على {interactions.length} تفاعل محتمل
              </div>
              {interactions.map((interaction, idx) => (
                <div key={`${interaction.drug1.id}-${interaction.drug2.id}-${idx}`} className={`rounded-[1.5rem] border p-4 ${getSeverityStyles(interaction.severity)}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-black">
                      {interaction.drug1.nameAr} + {interaction.drug2.nameAr}
                    </div>
                    <Badge variant={interaction.severity === 'severe' ? 'danger' : interaction.severity === 'moderate' ? 'warning' : 'info'}>
                      {getSeverityLabel(interaction.severity)}
                    </Badge>
                  </div>
                  <p className="text-sm leading-7 font-medium">{interaction.description}</p>
                  {interaction.recommendation && (
                    <div className="mt-3 rounded-2xl bg-white/60 px-3 py-3 text-sm font-semibold dark:bg-slate-900/40">
                      {interaction.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              لم يتم العثور على تفاعلات معروفة بين الأدوية المحددة.
            </div>
          )}

          {disclaimer && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium leading-6 text-slate-500 dark:bg-slate-950/30 dark:text-slate-400">
              {disclaimer}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
