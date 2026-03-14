import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // استخراج المعاملات مع القيم الافتراضية
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || searchParams.get('pageSize') || '20'), 100);
    const search = searchParams.get('search') || '';
    const ordering = searchParams.get('ordering') || '-rating_avg';
    
    // فلاتر متقدمة
    const hospitalType = searchParams.get('hospital_type');
    const governorate = searchParams.get('governorate');
    const city = searchParams.get('city');
    const hasEmergency = searchParams.get('has_emergency') === 'true';
    const hasAmbulance = searchParams.get('has_ambulance') === 'true';
    const isFeatured = searchParams.get('is_featured') === 'true';
    const isOpen = searchParams.get('is_open') === 'true';
    
    // بناء شروط البحث المتقدمة
    const where: any = {};
    
    // البحث النصي المحسن
    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
        { address: { contains: search } },
      ];
    }
    
    // فلاتر الخدمات
    if (hasEmergency) {
      where.hasEmergency = true;
    }
    if (hasAmbulance) {
      where.hasAmbulance = true;
    }
    
    if (isFeatured) {
      where.isFeatured = true;
    }
    
    // فلتر النوع
    if (hospitalType) {
      where.typeId = parseInt(hospitalType);
    }
    if (!hospitalType) {
      where.type = { slug: { notIn: ['clinic', 'pharmacy', 'laboratory'] } };
    }
    
    // فلتر الموقع
    if (governorate) {
      where.governorateId = parseInt(governorate);
    }
    
    if (city) {
      where.cityId = parseInt(city);
    }
    if (isOpen) {
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const today = days[new Date().getDay()];
      where.workingHoursList = { some: { day: today, isClosed: false } };
    }
    
    // Default: Sort by rating if not specified or if default
    // BUT for our new data, rating is 0, so let's sort by ID or createdAt if rating is 0
    // Actually, let's fix the ordering logic to be more robust
    
    // بناء ترتيب النتائج المحسن
    const orderBy: any = [];
    
    // Parse ordering parameter (Django-style: -field means desc, field means asc)
    const isDesc = ordering.startsWith('-');
    const field = isDesc ? ordering.substring(1) : ordering;
    const direction = isDesc ? 'desc' : 'asc';
    
    switch (field) {
      case 'name':
      case 'nameAr':
        orderBy.push({ nameAr: direction });
        break;
      case 'rating':
      case 'rating_avg':
      case 'ratingAvg':
        // Sort by rating, then by ID to ensure stable sort for pagination
        // Also if rating is 0, we might want to prioritize those with images?
        orderBy.push({ ratingAvg: direction });
        orderBy.push({ ratingCount: 'desc' });
        orderBy.push({ hasEmergency: 'desc' }); // Bonus for emergency
        break;
      case 'created':
      case 'createdAt':
        orderBy.push({ createdAt: direction });
        break;
      default:
        // Default sort: Featured > Rating > Emergency > ID
        orderBy.push({ isFeatured: 'desc' });
        orderBy.push({ ratingAvg: 'desc' });
        orderBy.push({ hasEmergency: 'desc' }); 
        orderBy.push({ id: 'desc' });
    }
    
    // حساب الإزاحة للصفحات
    const skip = (page - 1) * pageSize;
    
    // تنفيذ الاستعلام المحسن مع العلاقات
    const [hospitals, totalCount] = await Promise.all([
      prisma.hospital.findMany({
        where,
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
          hasAmbulance: true,
          isFeatured: true,
          ratingAvg: true,
          ratingCount: true,
          lat: true,
          lng: true,
          logo: true,
          description: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          typeId: true,
          governorateId: true,
          cityId: true,
          workingHours: true,
          workingHoursList: {
            select: {
              day: true,
              openTime: true,
              closeTime: true,
              isClosed: true
            }
          },
          // العلاقات المتاحة فقط
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
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.hospital.count({ where }),
    ]);
    
    // حساب معلومات الصفحات
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // تنسيق الاستجابة بالشكل المتوقع من Frontend
    const response = {
      count: totalCount,
      next: hasNextPage ? `?page=${page + 1}` : null,
      previous: hasPrevPage ? `?page=${page - 1}` : null,
      results: hospitals.map(hospital => {
        const displayCategory = hospital.category || hospital.type?.nameAr || '';
        const parseWorkingHoursJson = (jsonStr?: string | null) => {
          try {
            if (!jsonStr || jsonStr.trim() === '' || jsonStr.trim() === '{}') return [];
            const obj = JSON.parse(jsonStr as any);
            const arr = Array.isArray(obj) ? obj : (obj as any).openingHoursSpecification || [];
            return arr.map((it: any) => {
              const dow = Array.isArray(it.dayOfWeek) ? it.dayOfWeek[0] : it.dayOfWeek;
              return {
                day: String(dow || ''),
                openTime: it.opens || null,
                closeTime: it.closes || null,
                isClosed: it.opens ? false : true
              };
            }).filter((x: any) => x.day);
          } catch { return []; }
        };
        const computeIsOpen = (): boolean => {
          let list = (hospital as any).workingHoursList || [];
          if ((!list || list.length === 0) && (hospital as any).workingHours) {
            list = parseWorkingHoursJson((hospital as any).workingHours);
          }
          if (!list || list.length === 0) return false;
          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const today = days[new Date().getDay()];
          const todayHours = list.find((h: any) => h.day === today);
          if (!todayHours) return false;
          if (todayHours.isClosed) return false;
          return true;
        };
        return ({
        id: hospital.id,
        name_ar: hospital.nameAr,
        name_en: hospital.nameEn || '',
        slug: hospital.slug,
        
        // Type info
        hospital_type: hospital.typeId,
        type_name: displayCategory,
        hospital_type_name_ar: displayCategory,
        hospital_type_name_en: hospital.type?.nameEn || '',
        
        // Location
        governorate: hospital.governorateId,
        governorate_name: hospital.governorate?.nameAr || '',
        city: hospital.cityId,
        city_name: hospital.city?.nameAr || '',
        address: hospital.address || '',
        lat: hospital.lat,
        lng: hospital.lng,
        
        // Contact
        phone: hospital.phone || '',
        whatsapp: hospital.whatsapp || '',
        website: hospital.website || '',
        
        // Media
        logo_url: hospital.logo || '',
        
        // Info
        description: hospital.description || '',
        has_emergency: hospital.hasEmergency,
        has_ambulance: hospital.hasAmbulance || false,
        is_featured: hospital.isFeatured,
        is_open: computeIsOpen(),
        
        // Rating
        rating_avg: hospital.ratingAvg || 0,
        rating_count: hospital.ratingCount || 0,
        
        // Relations
        specialties: (hospital.specialties || []).map(s => ({
          id: s.id,
          name_ar: s.nameAr,
          name_en: s.nameEn || '',
          slug: s.nameAr.toLowerCase().replace(/\s+/g, '-')
        })),
        services: [], // سيتم إضافتها لاحقاً
        branches_count: 0,
        
        // Timestamps
        created_at: hospital.createdAt.toISOString(),
        updated_at: hospital.updatedAt.toISOString()
      });
      })
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('خطأ في API المستشفيات:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم الداخلي',
      details: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
      results: []
    }, { status: 500 });
  }
}
