'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdSenseScript() {
  const pathname = usePathname();
  const envDisabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'false';
  const initialClientId = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-5755672349927118';
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState(initialClientId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/admin/adsense-config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setEnabled(Boolean(data?.enabled));
          if (data?.config?.clientId) {
            setClientId(data.config.clientId);
          }
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (envDisabled) {
    return null;
  }

  if (loading || !enabled) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
