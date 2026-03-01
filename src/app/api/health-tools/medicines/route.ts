import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  formatDateOnly,
  parseDateOnly,
  parseTimesField,
  stringifyTimesField,
  toBoolean,
  toNumber,
} from '@/lib/health-tools/utils';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildMedicineResponse = (medicine: any) => {
  const times = parseTimesField(medicine.times, []);
  const startDate = parseDateOnly(medicine.startDate);
  const durationDays = medicine.durationDays ?? 0;
  const endDate = startDate ? new Date(startDate) : null;

  if (endDate) {
    endDate.setDate(endDate.getDate() + durationDays);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / DAY_MS))
    : 0;
  const isExpired = endDate ? today > endDate : true;

  let daysPassed = 0;
  if (startDate) {
    daysPassed = Math.floor((today.getTime() - startDate.getTime()) / DAY_MS) + 1;
    if (daysPassed < 0) daysPassed = 0;
    if (durationDays > 0) {
      daysPassed = Math.min(daysPassed, durationDays);
    }
  }

  const expectedDoses = daysPassed * times.length;
  const takenDoses = medicine.doses?.length ?? 0;
  const complianceRate = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 10) / 10 : 0;

  const doses = (medicine.doses || []).map((dose: any) => ({
    id: dose.id,
    scheduled_time: dose.scheduledTime,
    scheduledTime: dose.scheduledTime,
    taken_at: dose.takenAt.toISOString(),
    takenAt: dose.takenAt.toISOString(),
    date: formatDateOnly(dose.date),
  }));

  const startDateValue = formatDateOnly(medicine.startDate);
  const endDateValue = endDate ? formatDateOnly(endDate) : null;

  return {
    id: medicine.id,
    name: medicine.name,
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    times,
    start_date: startDateValue,
    startDate: startDateValue,
    duration_days: durationDays,
    durationDays,
    notes: medicine.notes,
    is_active: medicine.isActive,
    isActive: medicine.isActive,
    created_at: medicine.createdAt.toISOString(),
    updated_at: medicine.updatedAt.toISOString(),
    end_date: endDateValue,
    is_expired: isExpired,
    days_left: daysLeft,
    doses,
    doses_taken_count: takenDoses,
    compliance_rate: complianceRate,
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    const reminders = await prisma.medicineReminder.findMany({
      where: {
        userId: user.id,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        doses: {
          orderBy: { takenAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ results: reminders.map(buildMedicineResponse) });
  } catch (error) {
    console.error('Error fetching medicine reminders:', error);
    return NextResponse.json({ error: 'خطأ في تحميل الأدوية' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const dosage = String(body.dosage || '').trim();
    const frequency = String(body.frequency || '').trim();
    const durationDays = toNumber(body.duration_days ?? body.durationDays);
    const startDate = parseDateOnly(body.start_date ?? body.startDate);

    if (!name || !dosage || !frequency || !startDate || !durationDays || durationDays <= 0) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const times = parseTimesField(body.times, ['08:00']);
    const isActive = toBoolean(body.is_active ?? body.isActive, true) ?? true;

    const created = await prisma.medicineReminder.create({
      data: {
        userId: user.id,
        name,
        dosage,
        frequency,
        times: stringifyTimesField(times),
        startDate,
        durationDays,
        notes: body.notes ? String(body.notes) : null,
        isActive,
      },
      include: { doses: true },
    });

    return NextResponse.json(buildMedicineResponse(created), { status: 201 });
  } catch (error) {
    console.error('Error creating medicine reminder:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الدواء' }, { status: 500 });
  }
}
