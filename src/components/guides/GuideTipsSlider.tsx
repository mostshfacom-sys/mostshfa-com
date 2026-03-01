'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { GuideConfig } from '@/config/guide-config';
import AutoScrollRow from '@/components/shared/AutoScrollRow';

interface GuideTipsSliderProps {
  tips: any[];
  guide: Omit<GuideConfig, 'icon'>;
}

export default function GuideTipsSlider({ tips, guide }: GuideTipsSliderProps) {
  if (!tips || tips.length === 0) return null;

  return (
    <section id="tips" className="mb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2 rounded-lg ${guide.theme.bgLight}`}>
          <SparklesIcon className={`w-6 h-6 ${guide.theme.text}`} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">هل تعلم؟</h2>
      </div>

      <div className="relative overflow-hidden" dir="rtl">
        <AutoScrollRow 
            speed={0.1}
            pauseOnHover={true}
            loop={true}
            dir="rtl"
        >
          {tips.map((tip, idx) => (
            <div key={tip.id} className="w-[300px] md:w-[400px] flex-shrink-0 mx-3">
              <div className={`h-full p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all duration-300`} dir="rtl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <SparklesIcon className={`w-32 h-32 ${guide.theme.text}`} />
                </div>
                <div className="relative z-10">
                  <span className={`inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold mb-4 ${guide.theme.text}`}>
                    نصيحة #{idx + 1}
                  </span>
                  <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-white leading-snug">
                    {tip.titleAr}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tip.contentAr}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </AutoScrollRow>
      </div>
    </section>
  );
}
