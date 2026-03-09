'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdSenseScript() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

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
        if (!cancelled) setEnabled(Boolean(data?.enabled));
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
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4632551404111306"
      crossOrigin="anonymous"
    />
  );
}
