import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const governorates = await prisma.governorate.findMany({
      orderBy: { nameAr: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: governorates,
    });
  } catch (error) {
    console.error('Error fetching governorates:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
