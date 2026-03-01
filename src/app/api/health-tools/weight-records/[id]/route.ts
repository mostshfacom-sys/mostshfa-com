import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly, toNumber } from '@/lib/health-tools/utils';

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const getWeightChange = async (userId: number, record: { id: number; date: Date; weight: number }) => {
  const previous = await prisma.weightRecord.findFirst({
    where: {
      userId,
      date: { lt: record.date },
    },
    orderBy: { date: 'desc' },
  });

  return previous ? record.weight - previous.weight : 0;
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

    const record = await prisma.weightRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!record) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    const weightChange = await getWeightChange(user.id, record);

    return NextResponse.json(buildWeightResponse(record, weightChange));
  } catch (error) {
    console.error('Error fetching weight record:', error);
    return NextResponse.json({ error: 'خطأ في تحميل السجل' }, { status: 500 });
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

    const existing = await prisma.weightRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.weight !== undefined) {
      const weight = toNumber(body.weight);
      if (!weight || weight <= 0) {
        return NextResponse.json({ error: 'الوزن غير صالح' }, { status: 400 });
      }
      updateData.weight = weight;
    }

    if (body.date !== undefined || body.record_date !== undefined || body.recordDate !== undefined) {
      const parsedDate = parseDateOnly(body.date ?? body.record_date ?? body.recordDate);
      if (!parsedDate) {
        return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
      }
      updateData.date = parsedDate;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes) : null;
    }

    const updated = await prisma.weightRecord.update({
      where: { id: existing.id },
      data: updateData,
    });

    const weightChange = await getWeightChange(user.id, updated);

    return NextResponse.json(buildWeightResponse(updated, weightChange));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'يوجد سجل لهذا التاريخ' }, { status: 409 });
    }

    console.error('Error updating weight record:', error);
    return NextResponse.json({ error: 'خطأ في تحديث السجل' }, { status: 500 });
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

    const existing = await prisma.weightRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    await prisma.weightRecord.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: 'تم حذف السجل' });
  } catch (error) {
    console.error('Error deleting weight record:', error);
    return NextResponse.json({ error: 'خطأ في حذف السجل' }, { status: 500 });
  }
}
