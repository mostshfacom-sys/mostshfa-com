import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';
import { getInternalPulseHref, getPulseData, medicalBriefPath } from '@/app/articles/pulse/lib';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mostshfa.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/medical-info`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/medical-videos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/directories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/emergency`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/hospitals-pro`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/hospitals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/drugs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/clinics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/labs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/pharmacies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/nursing`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}${medicalBriefPath}`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/articles/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // 2. Articles
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    articles.forEach(a => {
      dynamicPages.push({
        url: `${BASE_URL}/articles/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // 3. Drugs
    const drugs = await prisma.drug.findMany({
      select: { slug: true, updatedAt: true },
    });
    drugs.forEach(d => {
      dynamicPages.push({
        url: `${BASE_URL}/drugs/${encodeURIComponent(d.slug)}`,
        lastModified: d.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // 4. Hospitals
    const hospitals = await prisma.hospital.findMany({
      select: { slug: true, updatedAt: true },
    });
    hospitals.forEach(h => {
      dynamicPages.push({
        url: `${BASE_URL}/hospitals/${h.slug}`,
        lastModified: h.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // 5. Clinics
    const clinics = await prisma.clinic.findMany({
      select: { slug: true, updatedAt: true },
    });
    clinics.forEach(c => {
      dynamicPages.push({
        url: `${BASE_URL}/clinics/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // 6. Labs
    const labs = await prisma.lab.findMany({
      select: { slug: true, updatedAt: true },
    });
    labs.forEach(l => {
      dynamicPages.push({
        url: `${BASE_URL}/labs/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // 7. Pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      select: { slug: true, updatedAt: true },
    });
    pharmacies.forEach(p => {
      dynamicPages.push({
        url: `${BASE_URL}/pharmacies/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // 8. YouTube Videos (Redirects to YouTube but we can index our pages if we have them)
    // Currently they seem to be listed on /medical-videos, if we have individual video pages we'd add them here.
    const pulseData = await getPulseData();
    pulseData.latestArticles.slice(0, 50).forEach((article) => {
      dynamicPages.push({
        url: `${BASE_URL}${getInternalPulseHref(article.id)}`,
        lastModified: article.publishedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.75,
      });
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return [...staticPages, ...dynamicPages];
}
