import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all articles with tags
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        tags: { not: null },
      },
      select: { tags: true },
    });

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    
    articles.forEach((article) => {
      if (article.tags) {
        // Tags are stored as comma-separated string
        const tags = article.tags.split(',').map((t) => t.trim()).filter(Boolean);
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Sort by count and limit
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      success: true,
      tags: sortedTags,
      total: Object.keys(tagCounts).length,
    });
  } catch (error) {
    console.error('Error fetching article tags:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الوسوم' },
      { status: 500 }
    );
  }
}
