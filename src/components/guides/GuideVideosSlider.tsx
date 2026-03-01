'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlayIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { EntityImage } from '@/components/ui/EntityImage';
import { GuideConfig } from '@/config/guide-config';
import AutoScrollRow from '@/components/shared/AutoScrollRow';

interface GuideVideosSliderProps {
  videos: any[];
  guide: Omit<GuideConfig, 'icon'>;
}

export default function GuideVideosSlider({ videos, guide }: GuideVideosSliderProps) {
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [paused, setPaused] = useState(false);
  if (!videos || videos.length === 0) return null;

  return (
    <section id="videos" className="mb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${guide.theme.bgLight}`}>
            <PlayIcon className={`w-6 h-6 ${guide.theme.text}`} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">فيديوهات {guide.title}</h2>
            <p className="text-slate-500 mt-1">شاهد وتعلم من الخبراء</p>
          </div>
        </div>
        <Link href={`/medical-videos?q=${guide.keywords[0]}`} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:border-${guide.color}-200 hover:bg-${guide.color}-50 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200`}>
          <span>عرض كل الفيديوهات</span>
          <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>

      <div className="relative overflow-hidden" dir="rtl">
        <AutoScrollRow
            speed={0.12}
            pauseOnHover={true}
            loop={true}
            dir="rtl"
            paused={paused}
        >
        {videos.map((video) => (
          <button
            key={video.videoId}
            type="button"
            onClick={() => {
              setActiveVideo(video);
              setPaused(true);
            }}
            className="w-[280px] flex-shrink-0 mx-3 group relative rounded-2xl overflow-hidden bg-black aspect-[9/16] shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-right"
            dir="rtl"
          >
            <EntityImage 
              src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
              alt={video.title} 
              entityType="general"
              fill
              className="object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-xl">
                <PlayIcon className="w-7 h-7 ml-1" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-white font-bold text-sm line-clamp-2 mb-2 leading-snug">{video.title}</h3>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <PlayIcon className="w-3 h-3" />
                  مشاهدة الآن
                </span>
              </div>
            </div>
          </button>
        ))}
        </AutoScrollRow>
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setActiveVideo(null);
            setPaused(false);
          }}
        >
          <div
            className="bg-black rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl aspect-video"
            onClick={(event) => event.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
              title={activeVideo.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
