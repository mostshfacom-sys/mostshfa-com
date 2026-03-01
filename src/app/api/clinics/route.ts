
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const search = searchParams.get('search') || '';
  const governorate = searchParams.get('governorate');
  const city = searchParams.get('city');
  const specialties = searchParams.getAll('specialties');
  const isOpen = searchParams.get('isOpen') === 'true';
  const isFeatured = searchParams.get('isFeatured') === 'true';
  const ordering = searchParams.get('ordering') || '-ratingAvg';

  const where: any = {
    // status: 'published' // Assuming we want published only
  };

  if (search) {
    where.OR = [
      { nameAr: { contains: search } },
      { nameEn: { contains: search } },
      { addressAr: { contains: search } },
      { descriptionAr: { contains: search } },
    ];
  }

  if (governorate) where.governorateId = parseInt(governorate);
  if (city) where.cityId = parseInt(city);
  
  if (specialties.length > 0) {
    where.specialties = {
      some: {
        id: { in: specialties.map(s => parseInt(s)) }
      }
    };
  }

  if (isOpen) where.isOpen = true;
  if (isFeatured) where.isFeatured = true;

  const orderBy: any = {};
  if (ordering.startsWith('-')) {
    orderBy[ordering.substring(1)] = 'desc';
  } else {
    orderBy[ordering] = 'asc';
  }

  try {
    const [total, clinics] = await Promise.all([
      prisma.clinic.count({ where }),
      prisma.clinic.findMany({
        where,
        include: {
          governorate: true,
          city: true,
          specialties: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      count: total,
      results: clinics,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json({ error: 'Failed to fetch clinics' }, { status: 500 });
  }
}
