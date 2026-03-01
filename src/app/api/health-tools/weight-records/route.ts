import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly, toNumber } from '@/lib/health-tools/utils';

const buildWeightResponse = (record: any, weightChange: number) => ({
  id: record.id,
  weight: record.weight,
  date: formatDateOnly(record.date),
  notes: record.notes,
  created_at: record.createdAt.toISOString(),
  createdAt: record.createdAt.toISOString(),
  weight_change: weightChange,
  weightChange,
  bmi: null,
});

const buildWeightChangeMap = (records: any[]) => {
  const map = new Map<number, number>();
  records.forEach((record, index) => {
    const previous = index > 0 ? records[index - 1].weight : null;
    map.set(record.id, previous !== null ? record.weight - previous : 0);
  });
  return map;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const days = toNumber(searchParams.get('days'));

    let dateFrom: Date | undefined;
    if (days && days > 0) {
      const from = new Date();
      from.setDate(from.getDate() - days);
      from.setHours(0, 0, 0, 0);
      dateFrom = from;
    }

    const records = await prisma.weightRecord.findMany({
      where: {
        userId: user.id,
        ...(dateFrom ? { date: { gte: dateFrom } } : {}),
      },
      orderBy: { date: 'asc' },
    });

    const weightChanges = buildWeightChangeMap(records);
    const results = [...records]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((record) => buildWeightResponse(record, weightChanges.get(record.id) ?? 0));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching weight records:', error);
    return NextResponse.json({ error: 'خطأ في تحميل سجلات الوزن' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const weight = toNumber(body.weight);

    if (!weight || weight <= 0) {
      return NextResponse.json({ error: 'الوزن غير صالح' }, { status: 400 });
    }

    const dateInput = body.date ?? body.record_date ?? body.recordDate;
    const parsedDate = parseDateOnly(dateInput ?? new Date());
    if (!parsedDate) {
      return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
    }

    const created = await prisma.weightRecord.create({
      data: {
        userId: user.id,
        weight,
        date: parsedDate,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    const previous = await prisma.weightRecord.findFirst({
      where: {
        userId: user.id,
        date: { lt: created.date },
      },
      orderBy: { date: 'desc' },
    });

    const weightChange = previous ? created.weight - previous.weight : 0;

    return NextResponse.json(buildWeightResponse(created, weightChange), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'يوجد سجل لهذا التاريخ' }, { status: 409 });
    }

    console.error('Error creating weight record:', error);
    return NextResponse.json({ error: 'خطأ في حفظ الوزن' }, { status: 500 });
  }
}
