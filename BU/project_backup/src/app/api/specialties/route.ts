import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { nameAr: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: specialties,
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
