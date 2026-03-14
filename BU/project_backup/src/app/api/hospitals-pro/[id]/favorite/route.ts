import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// إضافة إلى المفضلة
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

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

    // إضافة إلى المفضلة (أو تجاهل إذا كان موجوداً)
    const favorite = await prisma.favorite.upsert({
      where: {
        entityType_entityId_userIp: {
          entityType: 'hospital',
          entityId: hospitalId.toString(),
          userIp: userIp
        }
      },
      update: {},
      create: {
        entityType: 'hospital',
        entityId: hospitalId.toString(),
        userIp: userIp
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة المستشفى إلى المفضلة',
      favorite: {
        id: favorite.id,
        createdAt: favorite.createdAt
      }
    });

  } catch (error) {
    console.error('خطأ في إضافة المفضلة:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// إزالة من المفضلة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

    // إزالة من المفضلة
    const deleted = await prisma.favorite.deleteMany({
      where: {
        entityType: 'hospital',
        entityId: hospitalId.toString(),
        userIp: userIp
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إزالة المستشفى من المفضلة',
      removed: deleted.count > 0
    });

  } catch (error) {
    console.error('خطأ في إزالة المفضلة:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// التحقق من حالة المفضلة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id);
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';

    const favorite = await prisma.favorite.findUnique({
      where: {
        entityType_entityId_userIp: {
          entityType: 'hospital',
          entityId: hospitalId.toString(),
          userIp: userIp
        }
      }
    });

    return NextResponse.json({
      success: true,
      isFavorite: !!favorite,
      favorite: favorite ? {
        id: favorite.id,
        createdAt: favorite.createdAt
      } : null
    });

  } catch (error) {
    console.error('خطأ في فحص المفضلة:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}