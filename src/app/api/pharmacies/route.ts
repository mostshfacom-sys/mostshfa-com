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
    const city = searchParams.get('city');
    const hasDelivery = searchParams.get('delivery') === 'true';
    const hasNursing = searchParams.get('nursing') === 'true';
    const is24h = searchParams.get('24h') === 'true';
    const isOpen = searchParams.get('open') === 'true';
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

    if (city) {
      where.cityId = parseInt(city);
    }

    if (hasDelivery) {
      where.hasDeliveryService = true;
    }

    if (hasNursing) {
      where.hasNursingService = true;
    }

    if (is24h) {
      where.is24h = true;
    }

    if (isOpen) {
      where.isOpen = true;
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'rating') {
      // Pharmacy might not have ratingAvg yet, fallback to name
      // orderBy.ratingAvg = sortOrder;
      orderBy.nameAr = sortOrder;
    } else {
      orderBy.nameAr = sortOrder;
    }

    // Get total count
    const total = await prisma.pharmacy.count({ where });

    // Get pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      where,
      include: {
        governorate: true,
        city: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform data
    const transformedPharmacies = pharmacies.map((p) => ({
      ...p,
      lat: p.lat ? Number(p.lat) : null,
      lng: p.lng ? Number(p.lng) : null,
      // Add computed fields or transform if needed
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: transformedPharmacies,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
