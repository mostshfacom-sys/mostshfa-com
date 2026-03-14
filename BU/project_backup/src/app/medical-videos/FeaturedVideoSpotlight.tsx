'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityImage } from '@/components/ui/EntityImage';
import { formatDuration } from '@/lib/youtube/youtubeSync';
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';

type VideoItem = {
  videoId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  publishedAt?: Date | string | null;
  channelTitle?: string | null;
  videoUrl: string;
};

export default function FeaturedVideoSpotlight({ videos }: { videos: VideoItem[] }) {
  const availableVideos = useMemo(() => videos.filter((video) => video?.videoId), [videos]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [spotlightIds, setSpotlightIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!availableVideos.length) return;
    setFeaturedIndex(Math.floor(Math.random() * availableVideos.length));
  }, [availableVideos.length]);

  useEffect(() => {
    if (availableVideos.length <= 1 || isPlaying) return;
    const intervalId = window.setInterval(() => {
      setFeaturedIndex((current) => {
        if (availableVideos.length <= 1) return current;
        let nextIndex = Math.floor(Math.random() * availableVideos.length);
        if (nextIndex === current) {
          nextIndex = (current + 1) % availableVideos.length;
        }
        return nextIndex;
      });
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [availableVideos.length, isPlaying]);

  useEffect(() => {
    if (!availableVideos.length) return;
    const pool = availableVideos.filter((_, index) => index !== featuredIndex);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSpotlightIds(shuffled.slice(0, 3).map((video) => video.videoId));
    setIsPlaying(false);
  }, [availableVideos, featuredIndex]);

  if (!availableVideos.length) return null;

  const featuredVideo = availableVideos[Math.min(featuredIndex, availableVideos.length - 1)];
  const spotlightVideos = spotlightIds
    .map((id) => availableVideos.find((video) => video.videoId === id))
    .filter(Boolean) as VideoItem[];
  const embedUrl = `https://www.youtube.com/embed/${featuredVideo.videoId}?autoplay=1&rel=0`;
  const shareText = `${featuredVideo.title}\n${featuredVideo.videoUrl}`.trim();

  const goPrev = () => {
    if (!availableVideos.length) return;
    setFeaturedIndex((index) => (index - 1 + availableVideos.length) % availableVideos.length);
  };

  const goNext = () => {
    if (!availableVideos.length) return;
    setFeaturedIndex((index) => (index + 1) % availableVideos.length);
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
      const primary = { title: featuredVideo.title, text: featuredVideo.title, url: featuredVideo.videoUrl };
      try {
        if (nav.canShare && !nav.canShare(primary)) {
          await nav.share({ url: featuredVideo.videoUrl });
          return;
        }
        await nav.share(primary);
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

    setShareOpen(true);
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      window.prompt('انسخ الرابط لمشاركته', shareText);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(featuredVideo.videoUrl)}&text=${encodeURIComponent(featuredVideo.title)}`,
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(featuredVideo.videoUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(featuredVideo.videoUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(featuredVideo.title)}&body=${encodeURIComponent(shareText)}`,
  };

  return (
    <section className="mb-12 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 px-1">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">مُرشّح اليوم</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">اختيار مميّز للمشاهدة</h2>
          <p className="text-slate-600 dark:text-slate-300">فيديو واحد مختار كبداية سريعة ومضمونة القيمة.</p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6 w-full max-w-full overflow-hidden">
        <div className="w-full min-w-0">
          <Card
            className="flex h-auto w-full max-w-full flex-col overflow-hidden border border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/70"
            padding="none"
          >
          <div className="relative w-full aspect-[16/9]">
            {isPlaying ? (
              <div className="absolute inset-0 w-full h-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={embedUrl}
                  title={featuredVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-black">
                <EntityImage
                  src={featuredVideo.thumbnailUrl || `https://img.youtube.com/vi/${featuredVideo.videoId}/hqdefault.jpg`}
                  alt={featuredVideo.title}
                  entityType="general"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 70vw, 60vw"
                />
              </div>
            )}
            {!isPlaying && (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 z-10 flex items-center justify-center"
                aria-label="تشغيل الفيديو"
              >
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white shadow-lg hover:bg-black/60 transition-colors">
                  <PlayIcon className="h-8 w-8 translate-x-0.5" />
                </span>
              </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent pointer-events-none" />
            <button
              type="button"
              onClick={goPrev}
              className="absolute inset-y-0 left-0 z-10 flex items-center px-3 text-white/90 hover:text-white bg-black/10 hover:bg-black/30 transition-colors"
              aria-label="السابق"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-white/90 hover:text-white bg-black/10 hover:bg-black/30 transition-colors"
              aria-label="التالي"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <span className="absolute top-4 right-4 z-10 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow-sm pointer-events-none">
              مشاهدة الآن
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="absolute top-4 left-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white transition-colors"
              aria-label="مشاركة"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
            <span className="absolute bottom-4 left-4 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white pointer-events-none">
              {formatDuration(featuredVideo.durationSec)}
            </span>
          </div>
          <div className="flex flex-col justify-center p-5 min-h-[140px]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 break-words">
                {featuredVideo.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 break-words">
                {featuredVideo.description?.trim() || 'ملخص سريع يساعدك على الفهم قبل بدء المشاهدة.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
              {featuredVideo.channelTitle && (
                <Badge variant="secondary" size="sm">
                  {featuredVideo.channelTitle}
                </Badge>
              )}
              {featuredVideo.publishedAt && (
                <Badge variant="info" size="sm">
                  {new Date(featuredVideo.publishedAt).toLocaleDateString('ar-EG')}
                </Badge>
              )}
            </div>
          </div>
        </Card>
        </div>

        <div className="flex flex-col gap-4 w-full min-w-0 overflow-hidden">
          {spotlightVideos.map((video) => {
            const thumbnail = video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
            return (
              <a key={video.videoId} href={video.videoUrl} target="_blank" rel="noreferrer" className="block w-full">
                <Card className="h-[100px] w-full overflow-hidden border border-white/40 bg-white/80 dark:border-white/10 dark:bg-slate-900/70" padding="none">
                  <div className="grid grid-cols-[100px_1fr] h-full">
                    <div className="relative h-full w-full bg-slate-100 dark:bg-slate-800">
                      <img src={thumbnail} alt={video.title} className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {formatDuration(video.durationSec)}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-3 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1 break-words">
                        {video.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 break-words">
                        {video.description?.trim() || 'معلومة مركزة.'}
                      </p>
                    </div>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">مشاركة الفيديو</h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                إغلاق
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">واتساب</a>
              <a href={shareLinks.telegram} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">تيليجرام</a>
              <a href={shareLinks.x} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">X</a>
              <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">فيسبوك</a>
              <a href={shareLinks.linkedin} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">لينكدإن</a>
              <a href={shareLinks.email} className="rounded-xl border px-3 py-2 text-sm text-center hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">بريد</a>
            </div>
            <button
              type="button"
              onClick={handleCopyShare}
              className="mt-4 w-full rounded-xl bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700"
            >
              {shareCopied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
