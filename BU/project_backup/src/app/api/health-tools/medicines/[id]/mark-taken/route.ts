import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, parseDateOnly } from '@/lib/health-tools/utils';

const parseId = (id: string) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    });

    if (!medicine) {
      return NextResponse.json({ error: 'الدواء غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const scheduledTime = String(body.scheduled_time ?? body.scheduledTime ?? body.time ?? '').trim();

    if (!scheduledTime) {
      return NextResponse.json({ error: 'وقت الجرعة مطلوب' }, { status: 400 });
    }

    const dateInput = body.date ?? body.day;
    const parsedDate = parseDateOnly(dateInput ?? new Date());
    if (!parsedDate) {
      return NextResponse.json({ error: 'تاريخ غير صالح' }, { status: 400 });
    }

    const dose = await prisma.medicineDose.create({
      data: {
        medicineId: medicine.id,
        scheduledTime,
        takenAt: new Date(),
        date: parsedDate,
      },
    });

    return NextResponse.json(
      {
        message: 'تم تسجيل أخذ الجرعة بنجاح',
        dose_id: dose.id,
        dose: {
          id: dose.id,
          scheduled_time: dose.scheduledTime,
          scheduledTime: dose.scheduledTime,
          taken_at: dose.takenAt.toISOString(),
          takenAt: dose.takenAt.toISOString(),
          date: formatDateOnly(dose.date),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error marking dose as taken:', error);
    return NextResponse.json({ error: 'خطأ في تسجيل الجرعة' }, { status: 500 });
  }
}
