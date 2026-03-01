
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: {
        governorate: true,
        city: true,
        specialties: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    return NextResponse.json({ error: 'Failed to fetch clinic' }, { status: 500 });
  }
}
