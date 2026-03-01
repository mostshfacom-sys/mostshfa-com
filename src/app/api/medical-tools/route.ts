import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

const mapTool = (tool: any) => ({
  id: tool.id,
  nameAr: tool.nameAr,
  nameEn: tool.nameEn,
  slug: tool.slug,
  descriptionAr: tool.descriptionAr,
  descriptionEn: tool.descriptionEn,
  toolType: tool.toolType,
  componentName: tool.componentName,
  icon: tool.icon,
  featuredImage: tool.featuredImage,
  medicalSpecialties: parseJson<string[]>(tool.medicalSpecialties, []),
  targetConditions: parseJson<string[]>(tool.targetConditions, []),
  accuracyLevel: tool.accuracyLevel,
  usageCount: tool.usageCount,
  averageRating: Number(tool.averageRating),
  ratingCount: tool.ratingCount,
  isFeatured: tool.isFeatured,
  isActive: tool.isActive,
  instructionsAr: tool.instructionsAr,
  instructionsEn: tool.instructionsEn,
  config: parseJson<Record<string, unknown>>(tool.config, {}),
  createdAt: tool.createdAt.toISOString(),
  updatedAt: tool.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const toolType = searchParams.get('toolType');
    const specialty = searchParams.get('specialty');
    const accuracyLevel = searchParams.get('accuracyLevel');
    const featured = searchParams.get('featured');

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.MedicalToolWhereInput = {
      isActive: true,
      ...(toolType ? { toolType } : {}),
      ...(accuracyLevel ? { accuracyLevel } : {}),
      ...(featured === 'true' ? { isFeatured: true } : {}),
      ...(query
        ? {
            OR: [
              { nameAr: { contains: query } },
              { nameEn: { contains: query } },
              { descriptionAr: { contains: query } },
              { descriptionEn: { contains: query } },
              { medicalSpecialties: { contains: query } },
              { targetConditions: { contains: query } },
            ],
          }
        : {}),
      ...(specialty ? { medicalSpecialties: { contains: specialty } } : {}),
    };

    const sortBy = searchParams.get('sortBy') || 'popular';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.MedicalToolOrderByWithRelationInput[] = [{ isFeatured: 'desc' }];

    switch (sortBy) {
      case 'rating':
        orderBy.push({ averageRating: sortOrder });
        break;
      case 'alphabetical':
        orderBy.push({ nameAr: sortOrder === 'desc' ? 'desc' : 'asc' });
        break;
      case 'newest':
        orderBy.push({ createdAt: 'desc' });
        break;
      default:
        orderBy.push({ usageCount: 'desc' });
    }

    const [count, totalTools, featuredTools, usageStats, tools] = await Promise.all([
      prisma.medicalTool.count({ where }),
      prisma.medicalTool.count(),
      prisma.medicalTool.count({ where: { isFeatured: true } }),
      prisma.medicalTool.aggregate({
        _sum: { usageCount: true },
        _avg: { averageRating: true },
      }),
      prisma.medicalTool.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(count / pageSize);

    return NextResponse.json({
      results: tools.map(mapTool),
      count,
      totalCount: totalTools,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      stats: {
        totalTools,
        featuredTools,
        totalUsage: usageStats._sum.usageCount ?? 0,
        averageRating: usageStats._avg.averageRating ?? 0,
      },
    });

  } catch (error) {
    console.error('Error fetching medical tools:', error);
    return NextResponse.json(
      { error: 'فشل في تحميل الأدوات الطبية' },
      { status: 500 }
    );
  }
}

// POST endpoint for tool usage tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, action } = body;

    if (!toolId || !action) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const tool = await prisma.medicalTool.findUnique({ where: { id: String(toolId) } });

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'الأداة غير موجودة' },
        { status: 404 }
      );
    }

    if (action === 'use') {
      await prisma.medicalTool.update({
        where: { id: tool.id },
        data: { usageCount: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تسجيل استخدام الأداة',
      });
    }

    return NextResponse.json(
      { success: false, error: 'إجراء غير مدعوم' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in medical tools POST:', error);

    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}