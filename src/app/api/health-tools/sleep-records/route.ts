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

    const records = await prisma.sleepRecord.findMany({
      where: {
        userId: user.id,
        ...(dateFrom ? { date: { gte: dateFrom } } : {}),
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ results: records.map(buildSleepResponse) });
  } catch (error) {
    console.error('Error fetching sleep records:', error);
    return NextResponse.json({ error: 'خطأ في تحميل سجلات النوم' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const bedTime = String(body.bed_time ?? body.bedTime ?? '').trim();
    const wakeTime = String(body.wake_time ?? body.wakeTime ?? '').trim();
    const quality = String(body.quality ?? 'جيد').trim() || 'جيد';

    if (!bedTime || !wakeTime) {
      return NextResponse.json({ error: 'أوقات النوم مطلوبة' }, { status: 400 });
    }

    const date = parseDateOnly(body.date ?? body.day ?? new Date());
    if (!date) {
      return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
    }

    const hoursInput = toNumber(body.hours);
    const hours = hoursInput && hoursInput > 0 ? hoursInput : calculateSleepHours(bedTime, wakeTime);

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'ساعات النوم غير صالحة' }, { status: 400 });
    }

    const created = await prisma.sleepRecord.create({
      data: {
        userId: user.id,
        bedTime,
        wakeTime,
        hours,
        quality,
        date,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    return NextResponse.json(buildSleepResponse(created), { status: 201 });
  } catch (error) {
    console.error('Error creating sleep record:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء سجل النوم' }, { status: 500 });
  }
}
