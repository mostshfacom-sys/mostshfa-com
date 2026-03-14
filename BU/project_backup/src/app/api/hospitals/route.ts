import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const governorate = searchParams.get('governorate');
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    const hasEmergency = searchParams.get('emergency') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where: any = {};

    if (search) {
      const normalizedSearch = normalizeArabic(search);
      where.OR = [
        { nameAr: { contains: normalizedSearch } },
        { nameEn: { contains: search } },
        { address: { contains: normalizedSearch } },
      ];
    }

    if (governorate) {
      where.governorateId = parseInt(governorate);
    }

    if (type) {
      where.typeId = parseInt(type);
    }

    if (specialty) {
      where.specialties = {
        some: {
          id: parseInt(specialty),
        },
      };
    }

    if (hasEmergency) {
      where.hasEmergency = true;
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.ratingAvg = sortOrder;
    } else {
      orderBy.nameAr = sortOrder;
    }

    // Get total count
    const total = await prisma.hospital.count({ where });

    // Get hospitals
    const hospitals = await prisma.hospital.findMany({
      where,
      include: {
        type: true,
        governorate: true,
        city: true,
        specialties: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform data
    const transformedHospitals = hospitals.map((h) => ({
      ...h,
      ratingAvg: Number(h.ratingAvg),
      lat: h.lat ? Number(h.lat) : null,
      lng: h.lng ? Number(h.lng) : null,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: transformedHospitals,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
