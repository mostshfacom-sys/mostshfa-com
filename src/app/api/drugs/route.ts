import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const hasPrice = (searchParams.get('hasPrice') || '').trim();
    const hasImage = (searchParams.get('hasImage') || '').trim();
    const sort = (searchParams.get('sort') || '').trim();

    const where: any = {};
    if (search) {
      const normalizedSearch = normalizeArabic(search);
      where.OR = [
        { nameAr: { contains: normalizedSearch } },
        { nameEn: { contains: search } },
        { activeIngredient: { contains: search } },
      ];
    }

    if (category) {
      const categoryId = parseInt(category);
      if (!Number.isNaN(categoryId)) {
        where.categoryId = categoryId;
      }
    }

    if (hasPrice === '1' || hasPrice === 'true') {
      where.priceText = {
        not: null,
        notIn: ['', '0', '0.00', '0.0'],
      };
    }

    if (hasImage === '1' || hasImage === 'true') {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { image: { not: null } },
        { image: { not: '' } },
        { NOT: [{ image: { startsWith: '/images/defaults/' } }] },
      ];
    }

    const orderBy = (() => {
      switch (sort) {
        case 'nameDesc':
          return { nameAr: 'desc' as const };
        case 'updatedDesc':
          return { updatedAt: 'desc' as const };
        case 'nameAsc':
        default:
          return { nameAr: 'asc' as const };
      }
    })();

    const skip = (page - 1) * limit;
    const [total, drugs] = await Promise.all([
      prisma.drug.count({ where }),
      prisma.drug.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      total,
      totalPages: Math.ceil(total / limit),
      page,
      drugs: drugs.map((drug) => ({
        id: drug.id,
        nameAr: drug.nameAr,
        nameEn: drug.nameEn,
        slug: drug.slug,
        activeIngredient: drug.activeIngredient,
        category: drug.category?.name || '',
        priceText: drug.priceText,
        image: drug.image,
        updatedAt: drug.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json({ error: 'فشل في جلب الأدوية' }, { status: 500 });
  }
}
