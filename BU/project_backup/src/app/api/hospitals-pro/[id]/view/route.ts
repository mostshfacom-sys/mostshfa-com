import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// تسجيل مشاهدة
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

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

    // تسجيل المشاهدة
    const viewLog = await prisma.viewLog.create({
      data: {
        entityType: 'hospital',
        entityId: hospitalId.toString(),
        userIp: userIp,
        userAgent: userAgent,
        referer: referer,
        sessionId: `${userIp}-${Date.now()}`
      }
    });

    // تحديث إحصائيات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        entityType_entityId_date: {
          entityType: 'hospital',
          entityId: hospitalId.toString(),
          date: today
        }
      },
      update: {
        views: {
          increment: 1
        }
      },
      create: {
        entityType: 'hospital',
        entityId: hospitalId.toString(),
        date: today,
        views: 1,
        uniqueViews: 1
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل المشاهدة',
      viewId: viewLog.id
    });

  } catch (error) {
    console.error('خطأ في تسجيل المشاهدة:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}