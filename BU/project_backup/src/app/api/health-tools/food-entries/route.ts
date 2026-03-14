import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly, toNumber } from '@/lib/health-tools/utils';

const buildFoodResponse = (entry: any) => ({
  id: entry.id,
  meal: entry.meal,
  food: entry.food,
  calories: entry.calories,
  protein: entry.protein,
  carbs: entry.carbs,
  fats: entry.fats,
  date: formatDateOnly(entry.date),
  time: entry.time,
  created_at: entry.createdAt.toISOString(),
  createdAt: entry.createdAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    let dateFilter: Date | undefined;

    if (dateParam) {
      const parsed = parseDateOnly(dateParam);
      if (!parsed) {
        return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
      }
      dateFilter = parsed;
    }

    const entries = await prisma.foodEntry.findMany({
      where: {
        userId: user.id,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });

    return NextResponse.json({ results: entries.map(buildFoodResponse) });
  } catch (error) {
    console.error('Error fetching food entries:', error);
    return NextResponse.json({ error: 'خطأ في تحميل الوجبات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const meal = String(body.meal || '').trim();
    const food = String(body.food || '').trim();
    const caloriesValue = toNumber(body.calories);

    if (!meal || !food || !caloriesValue) {
      return NextResponse.json({ error: 'بيانات الوجبة غير مكتملة' }, { status: 400 });
    }

    const date = parseDateOnly(body.date ?? body.day ?? new Date());
    if (!date) {
      return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
    }

    const time = String(body.time ?? '').trim() || new Date().toTimeString().slice(0, 5);

    const created = await prisma.foodEntry.create({
      data: {
        userId: user.id,
        meal,
        food,
        calories: Math.round(caloriesValue),
        protein: toNumber(body.protein) ?? null,
        carbs: toNumber(body.carbs) ?? null,
        fats: toNumber(body.fats) ?? null,
        date,
        time,
      },
    });

    return NextResponse.json(buildFoodResponse(created), { status: 201 });
  } catch (error) {
    console.error('Error creating food entry:', error);
    return NextResponse.json({ error: 'خطأ في إضافة الوجبة' }, { status: 500 });
  }
}
