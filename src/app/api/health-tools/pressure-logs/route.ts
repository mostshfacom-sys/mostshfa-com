import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  calculatePressureStatus,
  formatDateOnly,
  parseDateOnly,
  toNumber,
} from '@/lib/health-tools/utils';

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

  return new Date();
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
      dateFrom = from;
    }

    const logs = await prisma.pressureLog.findMany({
      where: {
        userId: user.id,
        ...(dateFrom ? { measuredAt: { gte: dateFrom } } : {}),
      },
      orderBy: { measuredAt: 'desc' },
    });

    return NextResponse.json({ results: logs.map(buildPressureResponse) });
  } catch (error) {
    console.error('Error fetching pressure logs:', error);
    return NextResponse.json({ error: 'خطأ في تحميل سجلات الضغط' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const systolic = toNumber(body.systolic);
    const diastolic = toNumber(body.diastolic);

    if (!systolic || !diastolic) {
      return NextResponse.json({ error: 'قراءات الضغط مطلوبة' }, { status: 400 });
    }

    const measuredAt = parseMeasuredAt(body);
    if (!measuredAt) {
      return NextResponse.json({ error: 'وقت القياس غير صالح' }, { status: 400 });
    }

    const pulse = toNumber(body.pulse);
    const status = body.status
      ? String(body.status)
      : calculatePressureStatus(systolic, diastolic);

    const created = await prisma.pressureLog.create({
      data: {
        userId: user.id,
        systolic,
        diastolic,
        pulse: pulse ?? null,
        measuredAt,
        status,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    return NextResponse.json(buildPressureResponse(created), { status: 201 });
  } catch (error) {
    console.error('Error creating pressure log:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء سجل الضغط' }, { status: 500 });
  }
}
