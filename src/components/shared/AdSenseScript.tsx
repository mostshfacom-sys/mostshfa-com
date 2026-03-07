'use client';

import { useAdSense } from '@/components/ui/AdSenseProvider';
import { usePathname } from 'next/navigation';

export default function AdSenseScript() {
  const { isEnabled, isLoading } = useAdSense();
  const pathname = usePathname();

  // Exclude admin routes from AdSense
  if (isLoading || !isEnabled || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5755672349927118"
      crossOrigin="anonymous"
    />
  );
}
