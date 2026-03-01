import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// إضافة تقييم
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

    const body = await request.json();
    const { rating, comment } = body;

    // التحقق من صحة التقييم
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'التقييم يجب أن يكون بين 1 و 5'
      }, { status: 400 });
    }

    // التحقق من وجود المستشفى
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      return NextResponse.json({
        success: false,
        error: 'المستشفى غير موجود'
      }, { status: 404 });
    }

    // إضافة أو تحديث التقييم
    const ratingRecord = await prisma.rating.upsert({
      where: {
        entityType_entityId_userIp: {
          entityType: 'hospital',
          entityId: hospitalId.toString(),
          userIp: userIp
        }
      },
      update: {
        rating: rating,
        comment: comment || null
      },
      create: {
        entityType: 'hospital',
        entityId: hospitalId.toString(),
        userIp: userIp,
        rating: rating,
        comment: comment || null
      }
    });

    // إعادة حساب متوسط التقييم
    const ratings = await prisma.rating.findMany({
      where: {
        entityType: 'hospital',
        entityId: hospitalId.toString()
      }
    });

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingCount = ratings.length;

    // تحديث المستشفى
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ratingAvg: avgRating,
        ratingCount: ratingCount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      rating: {
        id: ratingRecord.id,
        rating: ratingRecord.rating,
        comment: ratingRecord.comment,
        createdAt: ratingRecord.createdAt
      },
      hospitalStats: {
        averageRating: avgRating,
        totalRatings: ratingCount
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة التقييم:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// الحصول على تقييمات المستشفى
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 50);
    const skip = (page - 1) * pageSize;

    const [ratings, totalCount] = await Promise.all([
      prisma.rating.findMany({
        where: {
          entityType: 'hospital',
          entityId: hospitalId.toString()
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          isHelpful: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize
      }),
      prisma.rating.count({
        where: {
          entityType: 'hospital',
          entityId: hospitalId.toString()
        }
      })
    ]);

    // إحصائيات التقييمات
    const ratingStats = await prisma.rating.groupBy({
      by: ['rating'],
      where: {
        entityType: 'hospital',
        entityId: hospitalId.toString()
      },
      _count: {
        rating: true
      }
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      stars: star,
      count: ratingStats.find(stat => stat.rating === star)?._count.rating || 0
    }));

    return NextResponse.json({
      success: true,
      ratings: ratings,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      stats: {
        totalRatings: totalCount,
        distribution: ratingDistribution
      }
    });

  } catch (error) {
    console.error('خطأ في جلب التقييمات:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}