'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type DailyTipItem = {
  id: string | number;
  titleAr: string;
  contentAr: string;
  image?: string | null;
  category?: { nameAr?: string | null } | null;
};

interface DailyTipActionsProps {
  tips: DailyTipItem[];
  initialIndex?: number;
}

export function DailyTipActions({ tips, initialIndex = 0 }: DailyTipActionsProps) {
  const availableTips = useMemo(() => tips.filter((tip) => tip?.contentAr), [tips]);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!availableTips.length) return 0;
    const safeIndex = initialIndex % availableTips.length;
    return safeIndex < 0 ? 0 : safeIndex;
  });
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('/medical-info');

  const copyText = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) {
      return false;
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.setAttribute('readonly', 'true');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (error) {
      return false;
    }
  };

  const goPrev = () => {
    setActiveIndex((index) => (index - 1 + availableTips.length) % availableTips.length);
  };

  const goNext = () => {
    setActiveIndex((index) => (index + 1) % availableTips.length);
  };

  const goRandom = () => {
    if (availableTips.length === 1) return;
    const nextIndex = Math.floor(Math.random() * availableTips.length);
    setActiveIndex(nextIndex);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(`${window.location.origin}/medical-info`);
  }, []);

  useEffect(() => {
    if (availableTips.length <= 1) return;
    if (typeof window === 'undefined') return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setActiveIndex((current) => {
        if (availableTips.length <= 1) return current;
        const nextIndex = Math.floor(Math.random() * availableTips.length);
        return nextIndex === current ? (current + 1) % availableTips.length : nextIndex;
      });
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [availableTips.length]);

  if (!availableTips.length) return null;

  const tip = availableTips[activeIndex];
  const shareTitle = `نصيحة صحية: ${tip.titleAr}`;
  const shareText = `${tip.titleAr}\n${tip.contentAr}`.trim();

  const handleCopy = async () => {
    const success = await copyText(tip.contentAr);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleShare = async () => {
    const nav =
      typeof navigator === 'undefined'
        ? null
        : (navigator as Navigator & {
            share?: (data: any) => Promise<void>;
            canShare?: (data: any) => boolean;
          });

    if (nav?.share) {
      const candidates = [
        { title: shareTitle, text: shareText, url: shareUrl },
        { title: shareTitle, text: shareText },
        { text: shareText },
      ];

      for (const data of candidates) {
        try {
          if (nav.canShare && !nav.canShare(data)) continue;
          await nav.share(data);
          return;
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'name' in error &&
            (error as { name?: string }).name === 'AbortError'
          ) {
            return;
          }
        }
      }
    }
    setIsShareSheetOpen(true);
  };

  return (
    <div className="rounded-[2rem] bg-white/90 p-4 shadow-lg backdrop-blur dark:bg-slate-900/70 md:p-5">
      {isShareSheetOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsShareSheetOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">مشاركة المعلومة</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{shareTitle}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                aria-label="إغلاق"
                onClick={() => setIsShareSheetOpen(false)}
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                واتساب
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                تليجرام
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                فيسبوك
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                X
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                بريد
              </a>
              <button
                type="button"
                onClick={() => setIsShareSheetOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-1">
        <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-100 via-white to-emerald-50 p-5 text-center dark:from-emerald-500/15 dark:via-slate-900/70 dark:to-slate-900/90">
          <div className="flex flex-col items-center gap-2">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">معلومة اليوم</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              {activeIndex + 1} / {availableTips.length}
            </span>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tip.category?.nameAr && (
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  {tip.category.nameAr}
                </span>
              )}
              {copied ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">تم النسخ</span>
              ) : shareError ? (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                  تعذر فتح المشاركة
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tip.titleAr}</h3>
            <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">{tip.contentAr}</p>
          </div>
        </div>
        <div className="rounded-[1.75rem] bg-white/80 p-3 shadow-sm dark:bg-slate-900/70">
          <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto py-1">
            <button
              onClick={goPrev}
              aria-label="السابق"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
            >
              <ChevronRightIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={goNext}
              aria-label="التالي"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
            >
              <ChevronLeftIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={goRandom}
              aria-label="عشوائي"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
            >
              <SparklesIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={handleCopy}
              aria-label="نسخ"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
            >
              <ClipboardDocumentIcon className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={handleShare}
              aria-label="مشاركة"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
            >
              <ShareIcon className="h-5 w-5 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
