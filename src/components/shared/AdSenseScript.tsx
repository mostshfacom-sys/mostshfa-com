'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdSenseScript() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('ca-pub-5755672349927118');

  const envEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';

  useEffect(() => {
    let cancelled = false;

    if (!envEnabled) {
      setLoading(false);
      setEnabled(false);
      return () => {
        cancelled = true;
      };
    }

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
  }, [envEnabled]);

  if (!envEnabled) {
    return null;
  }

  if (pathname?.startsWith('/admin')) {
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
