'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';
import { ShareIcon } from '@heroicons/react/24/outline';
import { formatDuration } from '@/lib/youtube/youtubeSync';

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

const shuffleItems = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function MedicalVideosGrid({ videos }: { videos: VideoItem[] }) {
  const availableVideos = useMemo(() => videos.filter((video) => video?.videoId), [videos]);
  const [sortedVideos, setSortedVideos] = useState<VideoItem[]>(availableVideos);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareItem, setShareItem] = useState<VideoItem | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setSortedVideos(shuffleItems(availableVideos));
  }, [availableVideos]);

  const handleShare = async (video: VideoItem) => {
    const shareText = `${video.title}\n${video.videoUrl}`.trim();
    const nav =
      typeof navigator === 'undefined'
        ? null
        : (navigator as Navigator & {
            share?: (data: any) => Promise<void>;
            canShare?: (data: any) => boolean;
          });

    if (nav?.share) {
      const primary = { title: video.title, text: video.title, url: video.videoUrl };
      try {
        if (nav.canShare && !nav.canShare(primary)) {
          await nav.share({ url: video.videoUrl });
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

    setShareItem(video);
    setShareOpen(true);
  };

  const handleCopyShare = async () => {
    if (!shareItem) return;
    const shareText = `${shareItem.title}\n${shareItem.videoUrl}`.trim();
    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      window.prompt('انسخ الرابط لمشاركته', shareText);
    }
  };

  const shareLinks = shareItem
    ? {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareItem.title}\n${shareItem.videoUrl}`.trim())}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareItem.videoUrl)}&text=${encodeURIComponent(shareItem.title)}`,
        x: `https://x.com/intent/tweet?text=${encodeURIComponent(`${shareItem.title}\n${shareItem.videoUrl}`.trim())}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareItem.videoUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareItem.videoUrl)}`,
        email: `mailto:?subject=${encodeURIComponent(shareItem.title)}&body=${encodeURIComponent(`${shareItem.title}\n${shareItem.videoUrl}`.trim())}`,
      }
    : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedVideos.map((video) => {
        const thumbnail = video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
        const duration = formatDuration(video.durationSec);
        const publishedAt = video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('ar-EG') : null;

        return (
          <div key={video.videoId} className="group h-full">
            <Card variant="hover" className="h-full overflow-hidden border border-white/40 bg-white/90 dark:border-white/10 dark:bg-slate-900/70">
              <div className="relative">
                <a href={video.videoUrl} target="_blank" rel="noreferrer" className="block">
                  <EntityCardImage src={thumbnail} alt={video.title} entityType="general" aspectRatio="16/9" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                </a>
                {duration && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                    {duration}
                  </span>
                )}
                <span className="absolute top-3 right-3 rounded-full bg-indigo-600/90 px-3 py-1 text-xs font-semibold text-white">
                  ▶ تشغيل
                </span>
                <button
                  type="button"
                  onClick={() => handleShare(video)}
                  className="absolute top-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                  aria-label="مشاركة"
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 min-h-[176px]">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {video.channelTitle && (
                    <Badge variant="secondary" size="sm">
                      {video.channelTitle}
                    </Badge>
                  )}
                  {publishedAt && (
                    <Badge variant="info" size="sm">
                      {publishedAt}
                    </Badge>
                  )}
                </div>
                <a href={video.videoUrl} target="_blank" rel="noreferrer" className="block">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {video.description?.trim() || 'شاهد الفيديو للحصول على شرح مبسط ومعلومة مفيدة.'}
                  </p>
                </a>
              </div>
            </Card>
          </div>
        );
        })}
      </div>
      {shareOpen && shareItem && shareLinks && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">مشاركة الفيديو</h3>
              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  setShareItem(null);
                  setShareCopied(false);
                }}
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
    </>
  );
}
