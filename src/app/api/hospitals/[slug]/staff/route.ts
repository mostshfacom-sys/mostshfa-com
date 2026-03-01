import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get('specialtyId');

    // First find the hospital
    const hospital = await prisma.hospital.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'المستشفى غير موجود' },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      hospitalId: hospital.id,
      isActive: true,
    };

    if (specialtyId) {
      where.specialtyId = parseInt(specialtyId);
    }

    const staff = await prisma.staff.findMany({
      where,
      include: {
        specialty: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { ratingAvg: 'desc' },
        { nameAr: 'asc' },
      ],
    });

    return NextResponse.json({
      data: staff,
      total: staff.length,
    });
  } catch (error) {
    console.error('Error fetching hospital staff:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
