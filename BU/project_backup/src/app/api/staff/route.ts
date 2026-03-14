import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const specialtyId = searchParams.get('specialtyId');
    const hospitalId = searchParams.get('hospitalId');
    const clinicId = searchParams.get('clinicId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (specialtyId) {
      where.specialtyId = parseInt(specialtyId);
    }

    if (hospitalId) {
      where.hospitalStaff = {
        some: { hospitalId: parseInt(hospitalId) }
      };
    }

    if (clinicId) {
      where.clinicStaff = {
        some: { clinicId: parseInt(clinicId) }
      };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          specialty: true,
          hospitalStaff: {
            include: {
              hospital: {
                select: { id: true, nameAr: true, slug: true },
              },
            },
          },
          clinicStaff: {
            include: {
              clinic: {
                select: { id: true, nameAr: true, slug: true },
              },
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { ratingAvg: 'desc' },
          { nameAr: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staff.count({ where }),
    ]);

    // Transform data to include hospitals and clinics directly
    const transformedStaff = staff.map(s => ({
      ...s,
      hospitals: s.hospitalStaff.map(hs => hs.hospital),
      clinics: s.clinicStaff.map(cs => cs.clinic),
      hospitalStaff: undefined,
      clinicStaff: undefined,
    }));

    return NextResponse.json({
      data: transformedStaff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
