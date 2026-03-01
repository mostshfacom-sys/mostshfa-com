import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly, toNumber } from '@/lib/health-tools/utils';

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = toNumber(value);
  return parsed === undefined ? undefined : parsed;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const entry = await prisma.foodEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'الوجبة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(buildFoodResponse(entry));
  } catch (error) {
    console.error('Error fetching food entry:', error);
    return NextResponse.json({ error: 'خطأ في تحميل الوجبة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الوجبة غير موجودة' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.meal !== undefined) {
      const meal = String(body.meal).trim();
      if (!meal) return NextResponse.json({ error: 'الوجبة مطلوبة' }, { status: 400 });
      updateData.meal = meal;
    }

    if (body.food !== undefined) {
      const food = String(body.food).trim();
      if (!food) return NextResponse.json({ error: 'اسم الطعام مطلوب' }, { status: 400 });
      updateData.food = food;
    }

    if (body.calories !== undefined) {
      const calories = toNumber(body.calories);
      if (!calories || calories <= 0) {
        return NextResponse.json({ error: 'السعرات غير صالحة' }, { status: 400 });
      }
      updateData.calories = Math.round(calories);
    }

    if (body.protein !== undefined) {
      const protein = parseOptionalNumber(body.protein);
      if (protein === undefined) {
        return NextResponse.json({ error: 'البروتين غير صالح' }, { status: 400 });
      }
      updateData.protein = protein;
    }

    if (body.carbs !== undefined) {
      const carbs = parseOptionalNumber(body.carbs);
      if (carbs === undefined) {
        return NextResponse.json({ error: 'الكربوهيدرات غير صالحة' }, { status: 400 });
      }
      updateData.carbs = carbs;
    }

    if (body.fats !== undefined) {
      const fats = parseOptionalNumber(body.fats);
      if (fats === undefined) {
        return NextResponse.json({ error: 'الدهون غير صالحة' }, { status: 400 });
      }
      updateData.fats = fats;
    }

    if (body.date !== undefined || body.day !== undefined) {
      const date = parseDateOnly(body.date ?? body.day);
      if (!date) return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
      updateData.date = date;
    }

    if (body.time !== undefined) {
      const time = String(body.time).trim();
      if (!time) return NextResponse.json({ error: 'الوقت غير صالح' }, { status: 400 });
      updateData.time = time;
    }

    const updated = await prisma.foodEntry.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(buildFoodResponse(updated));
  } catch (error) {
    console.error('Error updating food entry:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الوجبة' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الوجبة غير موجودة' }, { status: 404 });
    }

    await prisma.foodEntry.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: 'تم حذف الوجبة' });
  } catch (error) {
    console.error('Error deleting food entry:', error);
    return NextResponse.json({ error: 'خطأ في حذف الوجبة' }, { status: 500 });
  }
}
