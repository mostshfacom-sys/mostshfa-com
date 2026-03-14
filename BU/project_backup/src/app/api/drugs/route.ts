import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = (searchParams.get('search') || '').trim();

    const where: any = {};
    if (search) {
      const normalizedSearch = normalizeArabic(search);
      where.OR = [
        { nameAr: { contains: normalizedSearch } },
        { nameEn: { contains: search } },
        { activeIngredient: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [total, drugs] = await Promise.all([
      prisma.drug.count({ where }),
      prisma.drug.findMany({
        where,
        include: { category: true },
        orderBy: { nameAr: 'asc' },
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
        updatedAt: drug.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json({ error: 'فشل في جلب الأدوية' }, { status: 500 });
  }
}
