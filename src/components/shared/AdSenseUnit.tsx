'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSenseUnitProps {
  slotId?: string; // Optional: used for dynamic loading from DB
  slotName?: string; // Used to identify in DB
  slot?: string; // Direct slot ID (fallback)
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSenseUnit({
  slotName,
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = '',
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adConfig, setAdConfig] = useState<{ adSlot: string | null; isEnabled: boolean } | null>(null);
  const [publisherId, setPublisherId] = useState<string>('ca-pub-5755672349927118');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdConfig() {
      try {
        const res = await fetch('/api/admin/adsense-config');
        const data = await res.json();
        
        // Find publisher ID
        const pubSetting = data.settings?.find((s: any) => s.key === 'adsense_publisher_id');
        if (pubSetting) setPublisherId(pubSetting.value);

        // Check if ads globally enabled
        const enabledSetting = data.settings?.find((s: any) => s.key === 'adsense_enabled');
        if (enabledSetting && enabledSetting.value === 'false') {
          setAdConfig({ adSlot: null, isEnabled: false });
          setLoading(false);
          return;
        }

        // Find specific slot config if slotName provided
        if (slotName) {
          const config = data.configs?.find((c: any) => c.slotName === slotName);
          if (config) {
            setAdConfig({ adSlot: config.adSlot, isEnabled: config.isEnabled });
          } else {
            // Fallback to direct slot if not in DB
            setAdConfig({ adSlot: slot || null, isEnabled: !!slot });
          }
        } else {
          setAdConfig({ adSlot: slot || null, isEnabled: !!slot });
        }
      } catch (error) {
        // Silent fallback to direct slot on error
        setAdConfig({ adSlot: slot || null, isEnabled: !!slot });
      } finally {
        setLoading(false);
      }
    }

    fetchAdConfig();
  }, [slotName, slot]);

  useEffect(() => {
    if (!loading && adConfig?.isEnabled && adConfig?.adSlot) {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          (window as any).adsbygoogle.push({});
        }
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [loading, adConfig]);

  if (loading || !adConfig?.isEnabled || !adConfig?.adSlot) {
    return null;
  }

  return (
    <div className={`adsense-wrapper my-10 flex flex-col items-center group transition-all duration-300 ${className}`}>
      <span className="text-[9px] text-gray-400 dark:text-slate-500 mb-1.5 uppercase tracking-[0.2em] font-medium opacity-50 group-hover:opacity-100 transition-opacity">
        إعلان
      </span>
      <div className="adsense-container w-full bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-3 flex justify-center overflow-hidden min-h-[120px] shadow-sm group-hover:shadow-md group-hover:border-primary-500/20 transition-all">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={publisherId}
          data-ad-slot={adConfig.adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    </div>
  );
}
