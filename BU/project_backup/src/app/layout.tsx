import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import HomeFloatingActions from '@/components/shared/HomeFloatingActions';
import AdSenseScript from '@/components/shared/AdSenseScript';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { ImageSettingsProvider } from '@/components/ui/ImageSettingsProvider';
import { prisma } from '@/lib/db/prisma';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0891b2',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mostshfa.com'),
  title: {
    default: 'مستشفى - دليل الخدمات الطبية في مصر',
    template: '%s | مستشفى',
  },
  description:
    'دليل شامل للمستشفيات والعيادات والمعامل والصيدليات وخدمات التمريض في مصر. ابحث عن أقرب خدمة طبية إليك.',
  keywords: ['مستشفيات', 'عيادات', 'معامل', 'صيدليات', 'تمريض', 'أطباء', 'مصر', 'دليل طبي'],
  authors: [{ name: 'مستشفى' }],
  creator: 'مستشفى',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://mostshfa.com',
    siteName: 'مستشفى',
    title: 'مستشفى - دليل الخدمات الطبية في مصر',
    description: 'دليل شامل للمستشفيات والعيادات والمعامل والصيدليات وخدمات التمريض في مصر',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'مستشفى.كوم',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مستشفى - دليل الخدمات الطبية في مصر',
    description: 'دليل شامل للمستشفيات والعيادات والمعامل والصيدليات وخدمات التمريض في مصر',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

async function shouldLoadAdSense(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== 'true') {
    return false;
  }

  const h = await headers();

  const rawPath =
    h.get('x-invoke-path') ||
    h.get('x-matched-pathname') ||
    h.get('x-original-url') ||
    h.get('x-url') ||
    h.get('referer') ||
    '';

  let pathname = '';
  try {
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      pathname = new URL(rawPath).pathname;
    } else {
      const host = h.get('host');
      if (host) {
        pathname = new URL(rawPath, `http://${host}`).pathname;
      } else {
        pathname = rawPath;
      }
    }
  } catch {
    pathname = rawPath;
  }

  if (pathname.startsWith('/admin')) {
    return false;
  }

  noStore();

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'adsense_enabled' },
    });
    return setting?.value === 'true';
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="google-site-verification" content="D9Q-2z0xhUGdMi8kIkd2DPoN0yIMy5wL6YVHU3Jc_vE" />
      </head>
      <body className="font-cairo antialiased bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        <ThemeProvider>
          <ImageSettingsProvider>
            <AdSenseScript />
            {children}
            <HomeFloatingActions />
            <MobileBottomNav />
          </ImageSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
