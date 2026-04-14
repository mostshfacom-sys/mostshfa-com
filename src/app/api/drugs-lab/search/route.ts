import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  buildDrugsLabWhere,
  filterAndRankDrugsLabResults,
  getDrugsLabOrderBy,
  parseDrugsLabLimit,
  parseDrugsLabPage,
  sanitizeDrugSearchInput,
} from '@/lib/search/drugs-lab';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseDrugsLabPage(searchParams.get('page') || '1');
    const limit = parseDrugsLabLimit(searchParams.get('limit') || '24');
    const sort = (searchParams.get('sort') || '').trim();
    const where = buildDrugsLabWhere({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      hasPrice: searchParams.get('hasPrice') || '',
      hasImage: searchParams.get('hasImage') || '',
      hasIngredient: searchParams.get('hasIngredient') || '',
      form: searchParams.get('form') || '',
    });
    const orderBy = getDrugsLabOrderBy(sort);
    const normalizedSearch = sanitizeDrugSearchInput(searchParams.get('search') || '');

    const skip = (page - 1) * limit;

    if (normalizedSearch) {
      const candidates = await prisma.drug.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        take: Math.max(limit * 30, 600),
      });

      const ranked = filterAndRankDrugsLabResults(candidates, normalizedSearch, sort);
      const paged = ranked.slice(skip, skip + limit);

      return NextResponse.json({
        total: ranked.length,
        totalPages: Math.ceil(ranked.length / limit),
        page,
        drugs: paged.map((drug) => ({
          id: drug.id,
          nameAr: drug.nameAr,
          nameEn: drug.nameEn,
          slug: drug.slug,
          activeIngredient: drug.activeIngredient,
          category: drug.category?.name || null,
          categoryId: drug.categoryId,
          priceText: drug.priceText,
          image: drug.image,
          updatedAt: drug.updatedAt,
          form: drug.dosage || drug.usage || null,
        })),
      });
    }

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
      drugs: filterAndRankDrugsLabResults(drugs, '', sort).map((drug) => ({
        id: drug.id,
        nameAr: drug.nameAr,
        nameEn: drug.nameEn,
        slug: drug.slug,
        activeIngredient: drug.activeIngredient,
        category: drug.category?.name || null,
        categoryId: drug.categoryId,
        priceText: drug.priceText,
        image: drug.image,
        updatedAt: drug.updatedAt,
        form: drug.usage || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDbError =
      /Can't reach database server/i.test(message) ||
      /PrismaClientInitializationError/i.test(message) ||
      /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(message);

    console.error('Error fetching drugs-lab search:', error);

    const publicError = isDbError ? 'تعذر الاتصال بقاعدة البيانات حاليًا' : 'فشل في جلب نتائج البحث';
    const includeDetails = process.env.NODE_ENV !== 'production';

    return NextResponse.json(
      {
        error: publicError,
        ...(includeDetails ? { details: message } : {}),
      },
      { status: 500 }
    );
  }
}
