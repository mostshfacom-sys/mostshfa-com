import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly } from '@/lib/health-tools/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    const date = parseDateOnly(dateParam ?? new Date());

    if (!date) {
      return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
    }

    const where = { userId: user.id, date };

    const [stats, breakdownGroups] = await Promise.all([
      prisma.foodEntry.aggregate({
        where,
        _sum: { calories: true, protein: true, carbs: true, fats: true },
        _count: { _all: true },
      }),
      prisma.foodEntry.groupBy({
        by: ['meal'],
        where,
        _sum: { calories: true },
        _count: { _all: true },
      }),
    ]);

    if (!stats._count._all) {
      return NextResponse.json({ message: 'لا توجد وجبات لهذا اليوم' });
    }

    const breakdown: Record<string, { calories: number; count: number }> = {};
    breakdownGroups.forEach((group) => {
      breakdown[group.meal] = {
        calories: group._sum.calories ?? 0,
        count: group._count._all,
      };
    });

    return NextResponse.json({
      date: formatDateOnly(date),
      total_calories: stats._sum.calories ?? 0,
      total_protein: stats._sum.protein ?? 0,
      total_carbs: stats._sum.carbs ?? 0,
      total_fats: stats._sum.fats ?? 0,
      meals_count: stats._count._all,
      breakdown_by_meal: breakdown,
    });
  } catch (error) {
    console.error('Error fetching daily calories stats:', error);
    return NextResponse.json({ error: 'خطأ في تحميل إحصائيات السعرات' }, { status: 500 });
  }
}
