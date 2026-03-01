import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment views
    await prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    // Get related articles
    const relatedArticles = await prisma.article.findMany({
      where: {
        isPublished: true,
        id: { not: article.id },
        OR: [
          { categoryId: article.categoryId },
          ...(article.tags
            ? article.tags.split(',').map((tag) => ({
                tags: { contains: tag.trim() },
              }))
            : []),
        ],
      },
      take: 4,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        createdAt: true,
        category: { select: { nameAr: true, slug: true } },
      },
    });

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        image: article.image,
        author: article.author,
        tags: article.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [],
        views: article.views + 1,
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
      },
      relatedArticles,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
