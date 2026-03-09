'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdSenseScript() {
  const pathname = usePathname();
  const [config, setConfig] = useState<{
    enabled: boolean;
    autoAdsEnabled: boolean;
    publisherId: string;
  }>({
    enabled: true,
    autoAdsEnabled: true,
    publisherId: 'ca-pub-5755672349927118',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/admin/adsense-config');
        const data = await res.json();
        
        const settings = data.settings || [];
        const enabled = settings.find((s: any) => s.key === 'adsense_enabled')?.value !== 'false';
        const autoAdsEnabled = settings.find((s: any) => s.key === 'adsense_auto_ads_enabled')?.value !== 'false';
        const publisherId = settings.find((s: any) => s.key === 'adsense_publisher_id')?.value || 'ca-pub-5755672349927118';

        setConfig({ enabled, autoAdsEnabled, publisherId });
      } catch (error) {
        console.error('Failed to fetch AdSense config:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  if (loading || !config.enabled || pathname?.startsWith('/admin')) {
    return null;
  }

  // URL with or without auto-ads logic
  // Note: AdSense typically uses the same script, but Auto-Ads are controlled 
  // by the absence of specific parameters or via the AdSense dashboard.
  // We provide the publisher ID, and user can toggle Auto-Ads in their dashboard.
  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`}
      crossOrigin="anonymous"
    />
  );
}
