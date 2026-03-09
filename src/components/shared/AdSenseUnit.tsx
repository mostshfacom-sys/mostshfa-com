'use client';

import { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  slot: string;
  clientId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  className?: string;
  label?: string;
}

export default function AdSenseUnit({
  slot,
  clientId,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = '',
  label = 'إعلان',
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle = adsbygoogle;
        adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`adsense-wrapper my-8 flex flex-col items-center ${className}`}>
      <span className="text-[10px] text-gray-400 dark:text-slate-400 mb-1 uppercase tracking-widest font-sans">
        {label}
      </span>
      <div className="adsense-container w-full bg-white/80 dark:bg-slate-900/60 rounded-xl border border-dashed border-gray-200/80 dark:border-slate-700/70 p-2 flex justify-center overflow-hidden min-h-[100px] shadow-sm">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    </div>
  );
}
