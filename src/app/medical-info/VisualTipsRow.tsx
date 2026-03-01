'use client';

import { useState } from 'react';
import AutoScrollRow from '@/components/shared/AutoScrollRow';
import { Card } from '@/components/ui/Card';

type VisualSlide = {
  id: string;
  title: string;
  src: string;
};

export default function VisualTipsRow({ slides }: { slides: VisualSlide[] }) {
  const [activeSlide, setActiveSlide] = useState<VisualSlide | null>(null);

  return (
    <>
      <AutoScrollRow
        className="snap-x snap-proximity"
        pauseOnHover
        loop
        dir="rtl"
        speed={0.05}
        respectReducedMotion={false}
        showControls
        controlsClassName="px-0"
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="w-[88vw] sm:w-[480px] lg:w-[680px] min-w-[88vw] sm:min-w-[480px] lg:min-w-[680px] snap-start group"
          >
            <button
              type="button"
              onClick={() => setActiveSlide(slide)}
              className="w-full text-right"
              aria-label={`تكبير ${slide.title}`}
            >
              <Card className="h-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-100/60 to-teal-50/50 shadow-sm transition-transform group-hover:scale-[1.02] dark:from-slate-950 dark:via-emerald-950/30 dark:to-slate-900 dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)]">
                <img
                  src={slide.src}
                  alt={slide.title}
                  className="w-full h-64 sm:h-96 lg:h-[28rem] object-contain bg-white dark:bg-slate-900"
                />
              </Card>
            </button>
          </div>
        ))}
      </AutoScrollRow>

      {activeSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveSlide(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl max-w-[95vw] max-h-[90vh] w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={activeSlide.src}
              alt={activeSlide.title}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
