import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { slug: params.slug },
      include: {
        type: true,
        governorate: true,
        city: true,
        specialties: true,
        hospitalStaff: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    // Transform data
    const transformedHospital = {
      ...hospital,
      ratingAvg: Number(hospital.ratingAvg),
      lat: hospital.lat ? Number(hospital.lat) : null,
      lng: hospital.lng ? Number(hospital.lng) : null,
      staff: hospital.hospitalStaff.map((hs) => hs.staff),
    };

    return NextResponse.json({
      success: true,
      data: transformedHospital,
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
