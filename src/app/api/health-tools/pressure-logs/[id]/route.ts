import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  calculatePressureStatus,
  formatDateOnly,
  parseDateOnly,
  toNumber,
} from '@/lib/health-tools/utils';

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPressureResponse = (log: any) => ({
  id: log.id,
  systolic: log.systolic,
  diastolic: log.diastolic,
  pulse: log.pulse,
  measured_at: log.measuredAt.toISOString(),
  measuredAt: log.measuredAt.toISOString(),
  status: log.status,
  notes: log.notes,
  created_at: log.createdAt.toISOString(),
  createdAt: log.createdAt.toISOString(),
  date: formatDateOnly(log.measuredAt),
});

const applyTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const measuredAt = new Date(date);
  measuredAt.setHours(hours, minutes, 0, 0);
  return measuredAt;
};

const parseMeasuredAt = (body: any) => {
  const direct = body.measured_at ?? body.measuredAt;
  if (direct) {
    const parsed = new Date(direct);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateValue = parseDateOnly(body.date ?? body.day);
  const timeValue = body.time ?? body.measured_time ?? body.measuredTime;

  if (dateValue && timeValue) {
    return applyTime(dateValue, String(timeValue));
  }

  if (dateValue) return dateValue;

  if (timeValue) {
    const today = parseDateOnly(new Date());
    return today ? applyTime(today, String(timeValue)) : null;
  }

  return null;
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

    const log = await prisma.pressureLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!log) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    return NextResponse.json(buildPressureResponse(log));
  } catch (error) {
    console.error('Error fetching pressure log:', error);
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

    const existing = await prisma.pressureLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.systolic !== undefined) {
      const systolic = toNumber(body.systolic);
      if (!systolic) return NextResponse.json({ error: 'الانقباضي غير صالح' }, { status: 400 });
      updateData.systolic = systolic;
    }

    if (body.diastolic !== undefined) {
      const diastolic = toNumber(body.diastolic);
      if (!diastolic) return NextResponse.json({ error: 'الانبساطي غير صالح' }, { status: 400 });
      updateData.diastolic = diastolic;
    }

    if (body.pulse !== undefined) {
      if (body.pulse === null || body.pulse === '') {
        updateData.pulse = null;
      } else {
        const pulse = toNumber(body.pulse);
        if (!pulse) return NextResponse.json({ error: 'النبض غير صالح' }, { status: 400 });
        updateData.pulse = pulse;
      }
    }

    const hasMeasuredAtUpdate =
      body.measured_at !== undefined ||
      body.measuredAt !== undefined ||
      body.date !== undefined ||
      body.day !== undefined ||
      body.time !== undefined ||
      body.measured_time !== undefined ||
      body.measuredTime !== undefined;

    if (hasMeasuredAtUpdate) {
      const measuredAt = parseMeasuredAt(body);
      if (!measuredAt) {
        return NextResponse.json({ error: 'وقت القياس غير صالح' }, { status: 400 });
      }
      updateData.measuredAt = measuredAt;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes) : null;
    }

    if (body.status !== undefined) {
      updateData.status = body.status ? String(body.status) : existing.status;
    } else if (updateData.systolic !== undefined || updateData.diastolic !== undefined) {
      const systolic = updateData.systolic ?? existing.systolic;
      const diastolic = updateData.diastolic ?? existing.diastolic;
      updateData.status = calculatePressureStatus(systolic, diastolic);
    }

    const updated = await prisma.pressureLog.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(buildPressureResponse(updated));
  } catch (error) {
    console.error('Error updating pressure log:', error);
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

    const existing = await prisma.pressureLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    }

    await prisma.pressureLog.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: 'تم حذف السجل' });
  } catch (error) {
    console.error('Error deleting pressure log:', error);
    return NextResponse.json({ error: 'خطأ في حذف السجل' }, { status: 500 });
  }
}
