'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  BeakerIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import AutoScrollRow from '@/components/shared/AutoScrollRow';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

export type MedicalTipTickerItem = {
  id: string | number;
  title: string;
  description: string;
  icon?: string | null;
  category?: {
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  fallbackIcon?: 'heart' | 'clock' | 'beaker' | 'bolt';
};

type MedicalTipsTickerProps = {
  tips: MedicalTipTickerItem[];
  className?: string;
};

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getFallbackIcon = (name: MedicalTipTickerItem['fallbackIcon']) => {
  switch (name) {
    case 'clock':
      return ClockIcon;
    case 'beaker':
      return BeakerIcon;
    case 'bolt':
      return BoltIcon;
    case 'heart':
    default:
      return HeartIcon;
  }
};

const buildSharePayload = (tip: MedicalTipTickerItem) => {
  const categoryLabel = tip.category?.name ? `#${tip.category.name}` : '';
  const text = `${tip.title}\n${tip.description}${categoryLabel ? `\n${categoryLabel}` : ''}`.trim();
  const url =
    typeof window === 'undefined'
      ? ''
      : `${window.location.href.split('#')[0]}#medical-tips`;
  const title = `نصيحة طبية: ${tip.title}`;
  return { title, text, url };
};

const legacyCopyText = (value: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
};

export default function MedicalTipsTicker({ tips, className }: MedicalTipsTickerProps) {
  const [shuffledTips, setShuffledTips] = useState<MedicalTipTickerItem[]>(() => tips);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShuffledTips(shuffleArray(tips));
    setActiveIndex(0);
  }, [tips]);

  const activeTip = shuffledTips[activeIndex] ?? shuffledTips[0];

  const activeIconValue = (activeTip?.icon ?? activeTip?.category?.icon)?.trim();
  const ActiveFallbackIcon = useMemo(
    () => getFallbackIcon(activeTip?.fallbackIcon),
    [activeTip?.fallbackIcon]
  );

  const scrollDetailsIntoView = useCallback((behavior: ScrollBehavior) => {
    const target = detailsRef.current;
    if (!target || typeof window === 'undefined') return;

    const headerOffset = 96;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }, []);

  const selectTip = useCallback((index: number) => {
    setActiveIndex(index);

    if (typeof window === 'undefined') return;
    const target = detailsRef.current;
    if (!target) return;

    const headerOffset = 96;
    const rect = target.getBoundingClientRect();
    const isAboveHeader = rect.top < headerOffset;
    const isBelowViewport = rect.bottom > window.innerHeight;

    if (!isAboveHeader && !isBelowViewport) return;

    window.requestAnimationFrame(() => scrollDetailsIntoView('smooth'));
  }, [scrollDetailsIntoView]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (shuffledTips.length ? (prev + 1) % shuffledTips.length : 0));
  }, [shuffledTips.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (!shuffledTips.length) return 0;
      return (prev - 1 + shuffledTips.length) % shuffledTips.length;
    });
  }, [shuffledTips.length]);

  const reshuffle = useCallback(() => {
    setShuffledTips((prev) => shuffleArray(prev));
    setActiveIndex(0);
  }, []);

  const sharePayload = useMemo(() => (activeTip ? buildSharePayload(activeTip) : null), [activeTip]);
  const shareText = useMemo(() => {
    if (!sharePayload) return '';
    return `${sharePayload.text}\n${sharePayload.url}`.trim();
  }, [sharePayload]);

  const handleCopy = useCallback(async () => {
    if (!activeTip) return;
    const textToCopy = shareText;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ok = legacyCopyText(textToCopy);
        if (!ok) throw new Error('copy_failed');
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      try {
        const ok = legacyCopyText(textToCopy);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
          return;
        }
      } catch {
      }
      setCopied(false);
    }
  }, [activeTip, shareText]);

  const handleShare = useCallback(async () => {
    if (!activeTip) return;
    const payload = sharePayload;
    if (!payload) return;

    const nav =
      typeof navigator === 'undefined'
        ? null
        : (navigator as Navigator & {
            share?: (data: any) => Promise<void>;
            canShare?: (data: any) => boolean;
          });

    if (nav?.share) {
      const candidates = [
        {
          title: payload.title,
          text: payload.text,
          url: payload.url,
        },
        {
          title: payload.title,
          text: shareText,
        },
        {
          text: shareText,
        },
      ];

      for (const data of candidates) {
        try {
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
  }, [activeTip, sharePayload, shareText]);

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goPrev}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10"
        aria-label="السابق"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10"
        aria-label="التالي"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={reshuffle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10"
        aria-label="تقليب عشوائي"
      >
        <ArrowPathIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10"
        aria-label="مشاركة"
      >
        <ShareIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10"
        aria-label="نسخ"
      >
        <ClipboardDocumentIcon className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {isShareSheetOpen && sharePayload ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsShareSheetOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">مشاركة النصيحة</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{sharePayload.title}</p>
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
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                واتساب
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(sharePayload.url)}&text=${encodeURIComponent(sharePayload.text)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                تليجرام
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePayload.url)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                فيسبوك
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(sharePayload.text)}&url=${encodeURIComponent(sharePayload.url)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                X
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(shareText)}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                بريد
              </a>
              <button
                type="button"
                onClick={async () => {
                  await handleCopy();
                  setIsShareSheetOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                نسخ
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Card
        className="relative overflow-hidden border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:border-white/10 dark:from-indigo-500/10 dark:via-slate-900/70 dark:to-slate-900/90"
        padding="none"
      >
        <div ref={detailsRef} className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-indigo-200 dark:ring-white/10">
                {activeIconValue ? (
                  <span className="text-xl">{activeIconValue}</span>
                ) : (
                  <ActiveFallbackIcon className="w-6 h-6" />
                )}
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {activeTip?.category?.name ? (
                    <Badge
                      variant="primary"
                      size="sm"
                      className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
                    >
                      {activeTip.category.name}
                    </Badge>
                  ) : null}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">معلومة طبية سريعة</span>
                  {copied ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">تم النسخ</span>
                  ) : null}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[3rem]">
                  {activeTip?.title}
                </h3>
                <div className="max-h-24 md:max-h-28 overflow-y-auto">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-200 whitespace-pre-line">
                    {activeTip?.description?.trim()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 md:flex-col md:items-end">
              {controls}
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-400">
                {shuffledTips.length ? `${activeIndex + 1} / ${shuffledTips.length}` : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="border-slate-100 bg-white/70 p-0 dark:border-white/10 dark:bg-slate-900/70"
        padding="none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">شريط النصائح</p>
          <p className="text-xs text-slate-400 dark:text-slate-400">اسحب أو مرر المؤشر لإيقاف الحركة</p>
        </div>

        <AutoScrollRow
          className="px-5 py-4"
          loop
          speed={0.09}
          pauseOnHover
          dir="rtl"
          scrollStep={240}
        >
          {shuffledTips.map((tip, index) => {
            const iconValue = (tip.icon ?? tip.category?.icon)?.trim();
            const FallbackIcon = getFallbackIcon(tip.fallbackIcon);
            const isActive = index === activeIndex;
            return (
              <button
                key={tip.id}
                type="button"
                onClick={() => selectTip(index)}
                className={cn(
                  'group inline-flex min-w-[240px] max-w-[280px] items-center gap-3 rounded-2xl border px-4 py-3 text-right transition-all',
                  isActive
                    ? 'border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-400/30 dark:bg-indigo-500/10'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10'
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:text-indigo-200 dark:ring-white/10">
                  {iconValue ? <span className="text-lg">{iconValue}</span> : <FallbackIcon className="w-5 h-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {tip.title}
                    </span>
                    {tip.category?.name ? (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="shrink-0 bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200"
                      >
                        {tip.category.name}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-300">
                    {tip.description}
                  </span>
                </span>
              </button>
            );
          })}
        </AutoScrollRow>
      </Card>
    </div>
  );
}
