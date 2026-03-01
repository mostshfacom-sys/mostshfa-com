import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = Number(params.id);

    if (Number.isNaN(hospitalId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        slug: true,
        address: true,
        phone: true,
        whatsapp: true,
        website: true,
        facebook: true,
        logo: true,
        description: true,
        category: true,
        wheelchairAccessible: true,
        hasEmergency: true,
        isFeatured: true,
        ratingAvg: true,
        ratingCount: true,
        lat: true,
        lng: true,
        hasAmbulance: true,
        workingHours: true,
        typeId: true,
        governorateId: true,
        cityId: true,
        services: true,
        workingHoursList: {
          select: {
            day: true,
            openTime: true,
            closeTime: true,
            isClosed: true,
          }
        },
        createdAt: true,
        updatedAt: true,
        type: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            icon: true,
            color: true,
          },
        },
        governorate: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        city: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        specialties: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'المستشفى غير موجود' }, { status: 404 });
    }

    const services = (() => {
      if (!hospital.services) return [];

      const mapService = (service: any, index: number) => {
        if (typeof service === 'string') {
          const nameAr = service.trim();
          if (!nameAr) return null;
          return {
            id: index + 1,
            name_ar: nameAr,
            name_en: '',
            slug: nameAr.toLowerCase().replace(/\s+/g, '-'),
          };
        }

        const nameAr = service?.name_ar || service?.nameAr || service?.name || '';
        const nameEn = service?.name_en || service?.nameEn || '';
        const slugSource = service?.slug || nameAr || nameEn || `${index + 1}`;
        if (!nameAr && !nameEn) return null;
        return {
          id: Number(service?.id ?? index + 1),
          name_ar: nameAr,
          name_en: nameEn,
          slug: String(slugSource).toLowerCase().replace(/\s+/g, '-'),
        };
      };

      try {
        const parsed = JSON.parse(hospital.services);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(mapService).filter(Boolean);
      } catch {
        const raw = hospital.services.trim();
        if (!raw) return [];
        return raw
          .split(/\r?\n|,/)
          .map((service) => service.trim())
          .filter(Boolean)
          .map((service, index) => ({
            id: index + 1,
            name_ar: service,
            name_en: '',
            slug: service.toLowerCase().replace(/\s+/g, '-'),
          }));
      }
    })();

    const parseWorkingHoursJson = (jsonStr?: string | null) => {
      try {
        if (!jsonStr || jsonStr.trim() === '' || jsonStr.trim() === '{}') return [];
        const obj = JSON.parse(jsonStr);
        
        // Handle "note" format from scraper
        if (obj.note && typeof obj.note === 'string') {
           const lower = obj.note.toLowerCase();
           if (lower.includes('24') || lower.includes('daily')) {
             const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
             return days.map(day => ({
               day,
               openTime: '00:00',
               closeTime: '23:59',
               isClosed: false
             }));
           }
        }

        const arr = Array.isArray(obj) ? obj : (obj.openingHoursSpecification || []);
        return arr.map((it: any) => {
          const dayOfWeek = Array.isArray(it.dayOfWeek) ? it.dayOfWeek[0] : it.dayOfWeek;
          return {
            day: String(dayOfWeek || ''),
            openTime: it.opens || null,
            closeTime: it.closes || null,
            isClosed: it.opens ? false : true,
          };
        }).filter((x: any) => x.day);
      } catch {
        return [];
      }
    };

    const isOpenNow = (workingHoursList: any[] = [], workingHoursJson?: string | null): boolean => {
      let list = workingHoursList;
      if ((!list || list.length === 0) && workingHoursJson) {
        list = parseWorkingHoursJson(workingHoursJson);
      }
      if (!list || list.length === 0) return false;
      
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      
      const todayHours = list.find((h: any) => h.day === currentDay);
      if (!todayHours) return false;
      if (todayHours.isClosed) return false;
      
      return true;
    };

    const displayCategory = hospital.category || hospital.type?.nameAr || '';

    const response = {
      id: hospital.id,
      name_ar: hospital.nameAr,
      name_en: hospital.nameEn || '',
      slug: hospital.slug,

      hospital_type: hospital.typeId,
      type_name: displayCategory,
      hospital_type_name_ar: displayCategory,
      hospital_type_name_en: hospital.type?.nameEn || '',

      governorate: hospital.governorateId,
      governorate_name: hospital.governorate?.nameAr || '',
      city: hospital.cityId,
      city_name: hospital.city?.nameAr || '',
      address: hospital.address || '',
      address_details: '',
      lat: hospital.lat,
      lng: hospital.lng,

      phone: hospital.phone || '',
      whatsapp: hospital.whatsapp || '',
      website: hospital.website || '',
      facebook: hospital.facebook || '',
      other_social: '',

      logo_url: hospital.logo || '',

      description: hospital.description || '',
      category: hospital.category,
      wheelchairAccessible: hospital.wheelchairAccessible,
      has_emergency: hospital.hasEmergency,
      has_ambulance: (hospital as any).hasAmbulance || false,
      is_featured: hospital.isFeatured,
      is_open: isOpenNow(hospital.workingHoursList, hospital.workingHours as any),
      working_hours: (hospital.workingHoursList && hospital.workingHoursList.length > 0)
        ? hospital.workingHoursList
        : parseWorkingHoursJson(hospital.workingHours as any),

      rating_avg: hospital.ratingAvg || 0,
      rating_count: hospital.ratingCount || 0,

      specialties: (hospital.specialties || []).map((specialty) => ({
        id: specialty.id,
        name_ar: specialty.nameAr,
        name_en: specialty.nameEn || '',
        slug: specialty.nameAr.toLowerCase().replace(/\s+/g, '-'),
      })),
      services,
      branches_count: 0,

      created_at: hospital.createdAt.toISOString(),
      updated_at: hospital.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('خطأ في جلب المستشفى:', error);

    return NextResponse.json(
      {
        error: 'خطأ في الخادم الداخلي',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
