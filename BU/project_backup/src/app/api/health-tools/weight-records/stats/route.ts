import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const [count, avgResult, minResult, maxResult, firstRecord, lastRecord] = await Promise.all([
      prisma.weightRecord.count({ where: { userId: user.id } }),
      prisma.weightRecord.aggregate({ where: { userId: user.id }, _avg: { weight: true } }),
      prisma.weightRecord.aggregate({ where: { userId: user.id }, _min: { weight: true } }),
      prisma.weightRecord.aggregate({ where: { userId: user.id }, _max: { weight: true } }),
      prisma.weightRecord.findFirst({ where: { userId: user.id }, orderBy: { date: 'asc' } }),
      prisma.weightRecord.findFirst({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
    ]);

    if (!count || !firstRecord || !lastRecord) {
      return NextResponse.json({ message: 'لا توجد سجلات' });
    }

    return NextResponse.json({
      total_records: count,
      starting_weight: firstRecord.weight,
      current_weight: lastRecord.weight,
      total_change: lastRecord.weight - firstRecord.weight,
      average_weight: avgResult._avg.weight ?? 0,
      highest_weight: maxResult._max.weight ?? 0,
      lowest_weight: minResult._min.weight ?? 0,
    });
  } catch (error) {
    console.error('Error fetching weight stats:', error);
    return NextResponse.json({ error: 'خطأ في تحميل الإحصائيات' }, { status: 500 });
  }
}
