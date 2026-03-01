import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getUserIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return '127.0.0.1';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const where = {
      entityType,
      entityId,
    };

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.count({ where }),
    ]);

    // Calculate rating distribution
    const distribution = await prisma.rating.groupBy({
      by: ['rating'],
      where: { entityType, entityId },
      _count: true,
    });

    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    distribution.forEach((d) => {
      ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count;
    });

    return NextResponse.json({
      data: ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب التقييمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userIp = getUserIp(request);
    const body = await request.json();
    const { entityType, entityId, rating, comment } = body;

    if (!entityType || !entityId || !rating) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    // Check if user already rated
    const existing = await prisma.rating.findUnique({
      where: {
        entityType_entityId_userIp: {
          userIp,
          entityType,
          entityId,
        },
      },
    });

    if (existing) {
      // Update existing rating
      const updatedRating = await prisma.rating.update({
        where: { id: existing.id },
        data: {
          rating,
          comment,
        },
      });
      return NextResponse.json({ message: 'تم تحديث التقييم', rating: updatedRating });
    }

    // Create new rating
    const newRating = await prisma.rating.create({
      data: {
        userIp,
        entityType,
        entityId,
        rating,
        comment,
      },
    });

    return NextResponse.json({ message: 'تم إضافة التقييم', rating: newRating });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة التقييم' },
      { status: 500 }
    );
  }
}
