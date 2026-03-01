import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  calculateSleepHours,
  formatDateOnly,
  parseDateOnly,
  sleepQualityScoreMap,
  toNumber,
} from '@/lib/health-tools/utils';

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildSleepResponse = (record: any) => ({
  id: record.id,
  bed_time: record.bedTime,
  bedTime: record.bedTime,
  wake_time: record.wakeTime,
  wakeTime: record.wakeTime,
  hours: record.hours,
  quality: record.quality,
  date: formatDateOnly(record.date),
  notes: record.notes,
  created_at: record.createdAt.toISOString(),
  createdAt: record.createdAt.toISOString(),
  quality_score: sleepQualityScoreMap[record.quality] ?? 0,
});

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

    const record = await prisma.sleepRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!record) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    return NextResponse.json(buildSleepResponse(record));
  } catch (error) {
    console.error('Error fetching sleep record:', error);
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

    const existing = await prisma.sleepRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.bed_time !== undefined || body.bedTime !== undefined) {
      const bedTime = String(body.bed_time ?? body.bedTime).trim();
      if (!bedTime) return NextResponse.json({ error: 'وقت النوم غير صالح' }, { status: 400 });
      updateData.bedTime = bedTime;
    }

    if (body.wake_time !== undefined || body.wakeTime !== undefined) {
      const wakeTime = String(body.wake_time ?? body.wakeTime).trim();
      if (!wakeTime) return NextResponse.json({ error: 'وقت الاستيقاظ غير صالح' }, { status: 400 });
      updateData.wakeTime = wakeTime;
    }

    if (body.hours !== undefined) {
      const hours = toNumber(body.hours);
      if (!hours || hours <= 0) {
        return NextResponse.json({ error: 'ساعات النوم غير صالحة' }, { status: 400 });
      }
      updateData.hours = hours;
    }

    if (body.quality !== undefined) {
      const quality = String(body.quality).trim();
      if (!quality) return NextResponse.json({ error: 'جودة النوم غير صالحة' }, { status: 400 });
      updateData.quality = quality;
    }

    if (body.date !== undefined || body.day !== undefined) {
      const date = parseDateOnly(body.date ?? body.day);
      if (!date) return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
      updateData.date = date;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes) : null;
    }

    if (
      updateData.hours === undefined &&
      (updateData.bedTime !== undefined || updateData.wakeTime !== undefined)
    ) {
      const bedTime = updateData.bedTime ?? existing.bedTime;
      const wakeTime = updateData.wakeTime ?? existing.wakeTime;
      const recalculated = calculateSleepHours(bedTime, wakeTime);
      if (!recalculated || recalculated <= 0) {
        return NextResponse.json({ error: 'ساعات النوم غير صالحة' }, { status: 400 });
      }
      updateData.hours = recalculated;
    }

    const updated = await prisma.sleepRecord.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(buildSleepResponse(updated));
  } catch (error) {
    console.error('Error updating sleep record:', error);
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

    const existing = await prisma.sleepRecord.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    await prisma.sleepRecord.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: 'تم حذف السجل' });
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    return NextResponse.json({ error: 'خطأ في حذف السجل' }, { status: 500 });
  }
}
