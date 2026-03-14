import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mostshfa.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/directories', '/emergency'],
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
