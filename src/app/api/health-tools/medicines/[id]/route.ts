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

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
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

    const medicine = await prisma.medicineReminder.findFirst({
      where: { id, userId: user.id },
      include: {
        doses: {
          orderBy: { takenAt: 'desc' },
        },
      },
    });

    if (!medicine) {
      return NextResponse.json({ error: 'الدواء غير موجود' }, { status: 404 });
    }

    return NextResponse.json(buildMedicineResponse(medicine));
  } catch (error) {
    console.error('Error fetching medicine reminder:', error);
    return NextResponse.json({ error: 'خطأ في تحميل الدواء' }, { status: 500 });
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

    const existing = await prisma.medicineReminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الدواء غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: 'اسم الدواء مطلوب' }, { status: 400 });
      updateData.name = name;
    }

    if (body.dosage !== undefined) {
      const dosage = String(body.dosage).trim();
      if (!dosage) return NextResponse.json({ error: 'الجرعة مطلوبة' }, { status: 400 });
      updateData.dosage = dosage;
    }

    if (body.frequency !== undefined) {
      const frequency = String(body.frequency).trim();
      if (!frequency) return NextResponse.json({ error: 'التكرار مطلوب' }, { status: 400 });
      updateData.frequency = frequency;
    }

    if (body.times !== undefined) {
      const times = parseTimesField(body.times, ['08:00']);
      updateData.times = stringifyTimesField(times);
    }

    if (body.start_date !== undefined || body.startDate !== undefined) {
      const startDate = parseDateOnly(body.start_date ?? body.startDate);
      if (!startDate) return NextResponse.json({ error: 'تاريخ البدء غير صالح' }, { status: 400 });
      updateData.startDate = startDate;
    }

    if (body.duration_days !== undefined || body.durationDays !== undefined) {
      const durationDays = toNumber(body.duration_days ?? body.durationDays);
      if (!durationDays || durationDays <= 0) {
        return NextResponse.json({ error: 'المدة غير صالحة' }, { status: 400 });
      }
      updateData.durationDays = durationDays;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes) : null;
    }

    if (body.is_active !== undefined || body.isActive !== undefined) {
      updateData.isActive = toBoolean(body.is_active ?? body.isActive, true) ?? true;
    }

    const updated = await prisma.medicineReminder.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        doses: {
          orderBy: { takenAt: 'desc' },
        },
      },
    });

    return NextResponse.json(buildMedicineResponse(updated));
  } catch (error) {
    console.error('Error updating medicine reminder:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الدواء' }, { status: 500 });
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

    const existing = await prisma.medicineReminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الدواء غير موجود' }, { status: 404 });
    }

    await prisma.medicineReminder.delete({ where: { id: existing.id } });

    return NextResponse.json({ message: 'تم حذف الدواء' });
  } catch (error) {
    console.error('Error deleting medicine reminder:', error);
    return NextResponse.json({ error: 'خطأ في حذف الدواء' }, { status: 500 });
  }
}
