import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to find by ID first, then by slug
    const isNumeric = /^\d+$/.test(id);
    const doctor = await prisma.staff.findFirst({
      where: isNumeric ? { id: parseInt(id) } : { slug: id },
      include: { specialty: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get hospitals where this doctor works
    const hospitalStaff = await prisma.hospitalStaff.findMany({
      where: { staffId: doctor.id },
      select: {
        position: true,
        department: true,
        isHead: true,
      },
    });

    // Get clinics where this doctor works
    const clinicStaff = await prisma.clinicStaff.findMany({
      where: { staffId: doctor.id },
      select: {
        isOwner: true,
      },
    });

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        nameAr: doctor.nameAr,
        nameEn: doctor.nameEn,
        slug: doctor.slug,
        title: doctor.title,
        bio: doctor.bio,
        image: doctor.image,
        phone: doctor.phone,
        email: doctor.email,
        experience: doctor.experience,
        qualifications: doctor.qualifications,
        languages: doctor.languages,
        consultationFee: doctor.consultationFee,
        availableDays: doctor.availableDays ? JSON.parse(doctor.availableDays) : null,
        isFeatured: doctor.isFeatured,
        ratingAvg: doctor.ratingAvg,
        ratingCount: doctor.ratingCount,
        specialty: doctor.specialty
          ? { id: doctor.specialty.id, nameAr: doctor.specialty.nameAr, slug: doctor.specialty.slug }
          : null,
        hospitals: hospitalStaff,
        clinics: clinicStaff,
      },
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
