import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dayMap: Record<string, string> = {
  saturday: 'Saturday',
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  'السبت': 'Saturday',
  'الأحد': 'Sunday',
  'الاحد': 'Sunday',
  'الاثنين': 'Monday',
  'الإثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الاربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
};

function normDay(s: any): string | null {
  if (!s) return null;
  const t = String(s).trim().toLowerCase();
  if (dayMap[t]) return dayMap[t];
  const eng = t.charAt(0).toUpperCase() + t.slice(1);
  return ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'].includes(eng) ? eng : null;
}

async function main() {
  console.log('Sync working hours from JSON-LD to WorkingHour table...');
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, workingHours: true }
  });

  let total = 0, created = 0, updated = 0;
  for (const h of hospitals) {
    if (!h.workingHours || h.workingHours.trim() === '' || h.workingHours.trim() === '{}') continue;
    total++;
    try {
      const obj = JSON.parse(h.workingHours);
      const arr = Array.isArray(obj) ? obj : (obj.openingHoursSpecification || []);
      for (const it of arr) {
        const d0 = Array.isArray(it.dayOfWeek) ? it.dayOfWeek[0] : it.dayOfWeek;
        const day = normDay(d0);
        if (!day) continue;
        const openTime = it.opens || null;
        const closeTime = it.closes || null;
        const isClosed = openTime ? false : true;
        const wh = await prisma.workingHour.upsert({
          where: { hospitalId_day: { hospitalId: h.id, day } },
          update: { openTime, closeTime, isClosed },
          create: { hospitalId: h.id, day, openTime, closeTime, isClosed }
        });
        if ((wh as any).createdAt === (wh as any).updatedAt) created++; else updated++;
      }
    } catch {}
  }
  console.log(`Processed hospitals with JSON-LD: ${total}. Created: ${created}, Updated: ${updated}`);
  await prisma.$disconnect();
}

main();

