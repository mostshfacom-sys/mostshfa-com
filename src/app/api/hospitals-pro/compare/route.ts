import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hospitalIds } = body;

    if (!hospitalIds || !Array.isArray(hospitalIds) || hospitalIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'معرفات المستشفيات مطلوبة'
      }, { status: 400 });
    }

    if (hospitalIds.length > 4) {
      return NextResponse.json({
        success: false,
        error: 'يمكن مقارنة 4 مستشفيات كحد أقصى'
      }, { status: 400 });
    }

    // الحصول على بيانات المستشفيات للمقارنة
    const hospitals = await prisma.hospital.findMany({
      where: {
        id: {
          in: hospitalIds.map(id => parseInt(id))
        }
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        address: true,
        phone: true,
        whatsapp: true,
        website: true,
        hasEmergency: true,
        isFeatured: true,
        ratingAvg: true,
        ratingCount: true,
        lat: true,
        lng: true,
        isVerified: true,
        workingHours: true,
        services: true,
        insuranceAccepted: true,
        parkingAvailable: true,
        wheelchairAccessible: true,
        languagesSpoken: true,
        type: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            icon: true,
            color: true
          }
        },
        governorate: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true
          }
        },
        city: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true
          }
        },
        specialties: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            icon: true
          }
        }
      }
    });

    if (hospitals.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'لم يتم العثور على أي مستشفيات'
      }, { status: 404 });
    }

    // تنسيق البيانات للمقارنة
    const comparisonData = hospitals.map(hospital => ({
      id: hospital.id,
      nameAr: hospital.nameAr,
      nameEn: hospital.nameEn,
      slug: hospital.slug,
      
      // المعلومات الأساسية
      basicInfo: {
        type: hospital.type,
        location: {
          governorate: hospital.governorate,
          city: hospital.city,
          address: hospital.address,
          coordinates: hospital.lat && hospital.lng ? {
            lat: hospital.lat,
            lng: hospital.lng
          } : null
        }
      },
      
      // معلومات الاتصال
      contact: {
        phone: hospital.phone,
        whatsapp: hospital.whatsapp,
        website: hospital.website
      },
      
      // الخدمات والمميزات
      services: {
        hasEmergency: hospital.hasEmergency,
        workingHours: hospital.workingHours ? JSON.parse(hospital.workingHours) : null,
        services: hospital.services ? JSON.parse(hospital.services) : [],
        insuranceAccepted: hospital.insuranceAccepted ? JSON.parse(hospital.insuranceAccepted) : [],
        parkingAvailable: hospital.parkingAvailable,
        wheelchairAccessible: hospital.wheelchairAccessible,
        languagesSpoken: hospital.languagesSpoken ? JSON.parse(hospital.languagesSpoken) : []
      },
      
      // التخصصات
      specialties: hospital.specialties,
      
      // الإحصائيات والتقييمات
      stats: {
        ratingAvg: hospital.ratingAvg,
        ratingCount: hospital.ratingCount,
        isVerified: hospital.isVerified,
        isFeatured: hospital.isFeatured
      }
    }));

    // إنشاء جدول المقارنة
    const comparisonTable = {
      // الصفوف الأساسية
      basicInfo: [
        {
          label: 'النوع',
          key: 'type',
          values: comparisonData.map(h => h.basicInfo.type?.nameAr || 'غير محدد')
        },
        {
          label: 'المحافظة',
          key: 'governorate',
          values: comparisonData.map(h => h.basicInfo.location.governorate?.nameAr || 'غير محدد')
        },
        {
          label: 'المدينة',
          key: 'city',
          values: comparisonData.map(h => h.basicInfo.location.city?.nameAr || 'غير محدد')
        }
      ],
      
      // الخدمات
      services: [
        {
          label: 'خدمات طوارئ',
          key: 'hasEmergency',
          values: comparisonData.map(h => h.services.hasEmergency ? 'متوفر' : 'غير متوفر')
        },
        {
          label: 'موقف سيارات',
          key: 'parkingAvailable',
          values: comparisonData.map(h => h.services.parkingAvailable ? 'متوفر' : 'غير متوفر')
        },
        {
          label: 'إمكانية الوصول للكراسي المتحركة',
          key: 'wheelchairAccessible',
          values: comparisonData.map(h => h.services.wheelchairAccessible ? 'متوفر' : 'غير متوفر')
        }
      ],
      
      // التقييمات
      ratings: [
        {
          label: 'متوسط التقييم',
          key: 'ratingAvg',
          values: comparisonData.map(h => h.stats.ratingAvg.toFixed(1))
        },
        {
          label: 'عدد التقييمات',
          key: 'ratingCount',
          values: comparisonData.map(h => h.stats.ratingCount.toString())
        },
        {
          label: 'موثق',
          key: 'isVerified',
          values: comparisonData.map(h => h.stats.isVerified ? 'نعم' : 'لا')
        },
        {
          label: 'مميز',
          key: 'isFeatured',
          values: comparisonData.map(h => h.stats.isFeatured ? 'نعم' : 'لا')
        }
      ]
    };

    return NextResponse.json({
      success: true,
      comparison: {
        hospitals: comparisonData,
        table: comparisonTable,
        summary: {
          totalHospitals: hospitals.length,
          averageRating: comparisonData.reduce((sum, h) => sum + h.stats.ratingAvg, 0) / comparisonData.length,
          emergencyServices: comparisonData.filter(h => h.services.hasEmergency).length,
          verifiedCount: comparisonData.filter(h => h.stats.isVerified).length
        }
      }
    });

  } catch (error) {
    console.error('خطأ في API المقارنة:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}