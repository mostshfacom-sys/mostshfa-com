'use client';

export default function AdSenseScript() {
  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== 'true') {
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
