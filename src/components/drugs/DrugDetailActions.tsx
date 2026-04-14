'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import FavoriteButton from '@/components/user/FavoriteButton';
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

type DrugDetailActionsProps = {
  drugId: number;
  slug: string;
  nameAr: string;
  activeIngredient?: string | null;
};

export default function DrugDetailActions({
  drugId,
  slug,
  nameAr,
  activeIngredient,
}: DrugDetailActionsProps) {
  const [copied, setCopied] = useState(false);
  const pagePath = `/drugs/${encodeURIComponent(slug)}`;
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return pagePath;
    }
    return `${window.location.origin}${pagePath}`;
  }, [pagePath]);
  const shareText = `تعرف على تفاصيل دواء ${nameAr} على مستشفى دوت كوم`;
  const pharmaciesSearch = encodeURIComponent(
    String(activeIngredient || nameAr).trim()
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">مشاركة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:text-white"
          >
            <ShareIcon className="h-4 w-4" />
            <span>فيسبوك</span>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 hover:text-white"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>واتساب</span>
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
            <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">إجراءات سريعة</h2>
        <div className="space-y-3">
          <Link
            href={`/pharmacies?search=${pharmaciesSearch}`}
            className="flex w-full items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-100 dark:hover:bg-primary-900/45"
          >
            <MapPinIcon className="h-5 w-5" />
            <span>البحث عن صيدليات قريبة</span>
          </Link>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">إضافة للمفضلة</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">احفظ الدواء للوصول السريع لاحقًا</div>
            </div>
            <FavoriteButton entityType="drug" entityId={drugId} className="shrink-0" />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <PrinterIcon className="h-5 w-5" />
            <span>طباعة المعلومات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
