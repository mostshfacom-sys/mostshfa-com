import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

type IncomingDrug = {
  nameAr?: string;
  nameEn?: string;
  name?: string;
  tradeName?: string;
  brandName?: string;
  activeIngredient?: string;
  ingredient?: string;
  usage?: string;
  dosage?: string;
  contraindications?: string;
  priceText?: string;
  price?: number | string;
  image?: string;
  imageUrl?: string;
  category?: string;
  categoryName?: string;
  categoryAr?: string;
  slug?: string;
};

const isBlockedHost = (host: string) => {
  const lowerHost = host.toLowerCase();
  if (lowerHost === 'localhost' || lowerHost === '127.0.0.1' || lowerHost === '::1') {
    return true;
  }
  if (lowerHost.startsWith('10.') || lowerHost.startsWith('192.168.')) return true;
  const parts = lowerHost.split('.');
  if (parts.length === 4) {
    const first = Number(parts[0]);
    const second = Number(parts[1]);
    if (first === 172 && second >= 16 && second <= 31) return true;
  }
  return false;
};

const buildSlug = (value: string) => {
  const normalized = normalizeArabic(value || '')
    .replace(/[\u064B-\u065F]/g, '')
    .toLowerCase();
  const slug = normalized
    .replace(/[^\w\u0600-\u06FF-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `drug-${Date.now()}`;
};

const resolveName = (item: IncomingDrug) =>
  item.nameAr || item.name || item.tradeName || item.brandName || item.nameEn;

const resolveCategory = (item: IncomingDrug) =>
  item.categoryAr || item.categoryName || item.category;

const resolveImage = (item: IncomingDrug) => item.image || item.imageUrl;

const resolvePriceText = (item: IncomingDrug) => {
  if (item.priceText && String(item.priceText).trim()) return String(item.priceText).trim();
  if (item.price === null || item.price === undefined) return undefined;
  const value = typeof item.price === 'number' ? item.price.toFixed(2) : String(item.price);
  return `${value} ج.م`;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    let sourceUrl: string | undefined = payload?.sourceUrl;
    let items: IncomingDrug[] | undefined = payload?.items;

    if (!items?.length) {
      if (!sourceUrl) {
        sourceUrl = process.env.DRUGS_DATA_URL || undefined;
      }
      if (!sourceUrl) {
        return NextResponse.json(
          { error: 'يرجى تحديد رابط مصدر البيانات أو ضبط DRUGS_DATA_URL' },
          { status: 400 }
        );
      }
      const url = new URL(sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol) || isBlockedHost(url.hostname)) {
        return NextResponse.json({ error: 'رابط المصدر غير مسموح' }, { status: 400 });
      }
      const response = await fetch(sourceUrl, { cache: 'no-store' });
      if (!response.ok) {
        return NextResponse.json({ error: 'فشل في جلب البيانات من المصدر' }, { status: 400 });
      }
      const data = await response.json();
      items = Array.isArray(data) ? data : data?.items;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'لا توجد عناصر للاستيراد' }, { status: 400 });
    }

    const limitedItems = items.slice(0, 5000);
    let imported = 0;
    let skipped = 0;

    for (const item of limitedItems) {
      const nameAr = resolveName(item);
      if (!nameAr) {
        skipped += 1;
        continue;
      }
      const slug = item.slug || buildSlug(nameAr);
      const categoryName = resolveCategory(item);
      let categoryId: number | undefined;

      if (categoryName) {
        const category = await prisma.drugCategory.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });
        categoryId = category.id;
      }

      const priceText = resolvePriceText(item);
      const image = resolveImage(item);

      const updateData: any = {
        nameAr,
        nameEn: item.nameEn,
        activeIngredient: item.activeIngredient || item.ingredient,
        usage: item.usage,
        dosage: item.dosage,
        contraindications: item.contraindications,
        priceText,
        categoryId,
      };

      if (image) {
        updateData.image = image;
      }

      await prisma.drug.upsert({
        where: { slug },
        update: updateData,
        create: {
          ...updateData,
          slug,
        },
      });

      imported += 1;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: limitedItems.length,
    });
  } catch (error) {
    console.error('Error importing drugs:', error);
    return NextResponse.json({ error: 'فشل في استيراد بيانات الأدوية' }, { status: 500 });
  }
}
