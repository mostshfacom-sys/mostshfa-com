import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { normalizeArabic } from '@/lib/search/arabic-normalization';

interface Staff {
  id: number;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  title: string | null;
  image: string | null;
  experience: number | null;
  consultationFee: string | null;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  specialty: { id: number; nameAr: string; slug: string } | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const specialtyId = searchParams.get('specialtyId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (specialtyId) {
      where.specialtyId = parseInt(specialtyId);
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      const normalizedSearch = normalizeArabic(search);
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
        { title: { contains: search } },
        { bio: { contains: search } },
      ];
    }

    // Note: Staff model will be available after running prisma generate
    // For now, return empty array if model doesn't exist
    let doctors: Staff[] = [];
    let total = 0;

    try {
      const [staffList, staffCount] = await Promise.all([
        (prisma as any).staff.findMany({
          where,
          include: { specialty: true },
          orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
          skip,
          take: limit,
        }),
        (prisma as any).staff.count({ where }),
      ]);
      doctors = staffList;
      total = staffCount;
    } catch {
      // Model not yet generated
    }

    return NextResponse.json({
      doctors: doctors.map((doc) => ({
        id: doc.id,
        nameAr: doc.nameAr,
        nameEn: doc.nameEn,
        slug: doc.slug,
        title: doc.title,
        image: doc.image,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        isFeatured: doc.isFeatured,
        ratingAvg: doc.ratingAvg,
        ratingCount: doc.ratingCount,
        specialty: doc.specialty
          ? { id: doc.specialty.id, nameAr: doc.specialty.nameAr, slug: doc.specialty.slug }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
