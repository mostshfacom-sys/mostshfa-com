import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const categoryId = searchParams.get('categoryId');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isPublished: true };

    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId);
      if (!isNaN(parsedCategoryId)) {
        where.categoryId = parsedCategoryId;
      }
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search && search.trim()) {
      const normalizedSearch = normalizeArabic(search.trim());
      where.OR = [
        { title: { contains: normalizedSearch } },
        { excerpt: { contains: normalizedSearch } },
        { content: { contains: normalizedSearch } },
        { title: { contains: search.trim() } },
        { excerpt: { contains: search.trim() } },
      ];
    }

    // Build orderBy
    let orderBy: any = { publishedAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { publishedAt: 'asc' };
        break;
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        image: article.image,
        author: article.author,
        tags: article.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [],
        views: article.views,
        isFeatured: article.isFeatured,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        category: article.category
          ? {
              id: article.category.id,
              nameAr: article.category.nameAr,
              slug: article.category.slug,
              color: article.category.color,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المقالات', articles: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false } },
      { status: 500 }
    );
  }
}
