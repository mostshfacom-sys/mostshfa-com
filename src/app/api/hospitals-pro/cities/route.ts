import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const governorateId = searchParams.get('governorateId');
    
    if (!governorateId) {
      return NextResponse.json({
        success: false,
        error: 'معرف المحافظة مطلوب'
      }, { status: 400 });
    }

    // الحصول على المدن في المحافظة المحددة مع عدد المستشفيات
    const cities = await prisma.city.findMany({
      where: {
        governorateId: parseInt(governorateId),
        hospitals: {
          some: {}
        }
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        _count: {
          select: {
            hospitals: true
          }
        }
      },
      orderBy: {
        nameAr: 'asc'
      }
    });

    const response = {
      success: true,
      cities: cities.map(city => ({
        id: city.id,
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        hospitalCount: city._count.hospitals
      }))
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('خطأ في API المدن:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}