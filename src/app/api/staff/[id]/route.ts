import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const staffId = parseInt(id);

    if (isNaN(staffId)) {
      return NextResponse.json(
        { error: 'معرف غير صالح' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        specialty: true,
        hospitalStaff: {
          include: {
            hospital: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        clinicStaff: {
          include: {
            clinic: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                phone: true,
                addressAr: true,
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'الطبيب غير موجود' },
        { status: 404 }
      );
    }

    // Transform the data to a cleaner format
    const hospitals = staff.hospitalStaff.map(hs => ({
      ...hs.hospital,
      position: hs.position,
      department: hs.department,
      isHead: hs.isHead,
    }));

    const clinics = staff.clinicStaff.map(cs => ({
      ...cs.clinic,
      isOwner: cs.isOwner,
    }));

    return NextResponse.json({
      ...staff,
      hospitals,
      clinics,
      hospitalStaff: undefined,
      clinicStaff: undefined,
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
