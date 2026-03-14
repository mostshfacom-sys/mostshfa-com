'use client';

 import { useEffect, useRef, useState } from 'react';
import AutoScrollRow from '@/components/shared/AutoScrollRow';
import { Badge } from '@/components/ui/Badge';

 type VideoHighlight = {
   id: string;
   title: string;
   duration?: string;
   doctor?: string;
   href: string;
   thumbnail?: string;
   tag?: string;
   videoId?: string;
 };

 const extractYouTubeId = (url: string) => {
   const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{8,15})/);
   return match ? match[1] : undefined;
 };

 const buildEmbedUrl = (video: VideoHighlight) => {
   const videoId = video.videoId ?? extractYouTubeId(video.href);
   if (!videoId) return video.href;
   return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
 };

export default function VideoScrollRow({ videos }: { videos: VideoHighlight[] }) {
  const [paused, setPaused] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
   const sectionRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     const node = sectionRef.current;
     if (!node || typeof IntersectionObserver === 'undefined') return;
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (!entry.isIntersecting) {
           setPaused(false);
         }
       },
       { threshold: 0.2 }
     );
     observer.observe(node);
     return () => observer.disconnect();
   }, []);

   return (
     <div ref={sectionRef}>
       <AutoScrollRow
         className="snap-x snap-proximity"
         pauseOnHover
         loop
         dir="rtl"
         speed={0.04}
         respectReducedMotion={false}
         showControls
         controlsClassName="px-0"
         paused={paused}
       >
        {videos.map((video) => {
          const isInteractive = activeVideoId === video.id;
          return (
           <div
             key={video.id}
             className="w-[280px] sm:w-[360px] lg:w-[420px] min-w-[280px] sm:min-w-[360px] lg:min-w-[420px] snap-start"
             onPointerDown={() => setPaused(true)}
           >
            <div className="h-[360px] sm:h-[380px] overflow-hidden rounded-3xl bg-gradient-to-br from-white via-teal-100/70 to-emerald-50/70 shadow-sm dark:from-slate-950 dark:via-emerald-950/35 dark:to-slate-900 dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)] flex flex-col">
              <div className="relative aspect-video bg-slate-900 flex-none">
                 <iframe
                   src={buildEmbedUrl(video)}
                   title={video.title}
                  className={`absolute inset-0 h-full w-full ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 />
                {!isInteractive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      className="pointer-events-auto inline-flex items-center justify-center h-12 w-12 rounded-full bg-white/90 text-slate-900 shadow-lg"
                      aria-label="تشغيل الفيديو"
                    >
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                )}
                {isInteractive && (
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(null)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-black/60 text-white"
                      aria-label="إغلاق التفاعل"
                    >
                      ×
                    </button>
                  </div>
                )}
               </div>
               <div className="p-4 flex flex-col gap-2 flex-1">
                 <div className="flex items-center justify-between gap-2">
                   <Badge variant="secondary" size="sm">
                     {video.tag ?? 'فيديو طبي'}
                   </Badge>
                  {video.duration && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-200">
                       {video.duration}
                     </span>
                   )}
                 </div>
                 <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">{video.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-200 mt-auto">
                   {video.doctor ?? 'فريق مستشفى.كوم'}
                 </p>
               </div>
            </div>
          </div>
        );
        })}
       </AutoScrollRow>
     </div>
   );
 }
