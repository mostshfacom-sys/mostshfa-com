
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [governorates, cities, specialties] = await Promise.all([
      prisma.governorate.findMany({
        where: { clinics: { some: {} } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          _count: {
            select: { clinics: true }
          }
        },
        orderBy: { nameAr: 'asc' }
      }),
      prisma.city.findMany({
        where: { clinics: { some: {} } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          governorateId: true,
          _count: {
            select: { clinics: true }
          }
        },
        orderBy: { nameAr: 'asc' }
      }),
      prisma.specialty.findMany({
        where: { clinics: { some: {} } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          _count: {
            select: { clinics: true }
          }
        },
        orderBy: { nameAr: 'asc' }
      })
    ]);

    return NextResponse.json({
      governorates: governorates.map(g => ({ ...g, count: g._count.clinics })),
      cities: cities.map(c => ({ ...c, count: c._count.clinics })),
      specialties: specialties.map(s => ({ ...s, count: s._count.clinics })),
    });
  } catch (error) {
    console.error('Error fetching clinic filters:', error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}
