import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get all categories with article count
    const categories = await prisma.articleCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { articles: { where: { isPublished: true } } },
        },
      },
      orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      nameAr: cat.nameAr,
      nameEn: cat.nameEn,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      parentId: cat.parentId,
      order: cat.order,
      isActive: cat.isActive,
      articleCount: cat._count.articles,
    }));

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching article categories:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    );
  }
}
