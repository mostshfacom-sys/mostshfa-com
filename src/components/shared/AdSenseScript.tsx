'use client';

import { useAdSense } from '@/components/ui/AdSenseProvider';

export default function AdSenseScript() {
  const { isEnabled, isLoading } = useAdSense();

  if (isLoading || !isEnabled) {
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
