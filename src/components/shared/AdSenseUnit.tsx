'use client';

import { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSenseUnit({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = '',
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  const publisherId = "ca-pub-5755672349927118";

  return (
    <div className={`adsense-wrapper my-8 flex flex-col items-center ${className}`}>
      <span className="text-[10px] text-gray-300 mb-1 uppercase tracking-widest font-sans">إعلان</span>
      <div className="adsense-container w-full bg-gray-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-gray-200 dark:border-slate-700/50 p-2 flex justify-center overflow-hidden min-h-[100px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    </div>
  );
}
