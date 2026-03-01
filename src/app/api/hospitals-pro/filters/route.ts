import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [hospitalTypes, governorates, cities, specialties] = await Promise.all([
      prisma.hospitalType.findMany({
        where: {
          isActive: true,
          slug: { notIn: ['clinic', 'pharmacy', 'laboratory'] }
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
      }),
      prisma.governorate.findMany({
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
      }),
      prisma.city.findMany({
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          governorateId: true,
          _count: {
            select: {
              hospitals: true
            }
          }
        },
        orderBy: {
          nameAr: 'asc'
        }
      }),
      prisma.specialty.findMany({
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
      })
    ]);

    const response = {
      hospital_types: hospitalTypes.map(type => ({
        id: type.id,
        name_ar: type.nameAr,
        name_en: type.nameEn || '',
        count: type._count.hospitals
      })),
      governorates: governorates.map(gov => ({
        id: gov.id,
        name_ar: gov.nameAr,
        name_en: gov.nameEn || '',
        count: gov._count.hospitals
      })),
      cities: cities.map(city => ({
        id: city.id,
        name_ar: city.nameAr,
        name_en: city.nameEn || '',
        governorate_id: city.governorateId,
        count: city._count.hospitals
      })),
      specialties: specialties.map(spec => ({
        id: spec.id,
        name_ar: spec.nameAr,
        name_en: spec.nameEn || '',
        count: spec._count.hospitals
      })),
      services: [] // سيتم إضافتها لاحقاً عندما يتم إنشاء جدول الخدمات
    };

    return new NextResponse(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('خطأ في جلب خيارات الفلاتر:', error);
    
    return NextResponse.json({
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error',
      hospital_types: [],
      governorates: [],
      cities: [],
      specialties: [],
      services: []
    }, { status: 500 });
  }
}
