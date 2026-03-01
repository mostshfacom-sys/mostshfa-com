
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dayMap: Record<string, string> = {
    'السبت': 'Saturday',
    'الأحد': 'Sunday',
    'الاثنين': 'Monday',
    'الإثنين': 'Monday',
    'الثلاثاء': 'Tuesday',
    'الأربعاء': 'Wednesday',
    'الخميس': 'Thursday',
    'الجمعة': 'Friday'
};

async function fixWorkingHours() {
  const allHours = await prisma.workingHour.findMany();
  console.log(`Found ${allHours.length} records to check.`);

  for (const record of allHours) {
    let needsUpdate = false;
    let newDay = record.day;
    let newOpenTime = record.openTime;

    // Fix Day
    if (dayMap[record.day]) {
      newDay = dayMap[record.day];
      needsUpdate = true;
    }

    // Fix OpenTime (remove icons/garbage)
    // Common garbage:  (clock icon)
    if (newOpenTime) {
      // Remove non-printable characters or known icons
      // Keeping Arabic, English, numbers, :, -, space, comma
      // This regex matches "not (Arabic or English or Numbers or symbols)"
      // Actually simpler: just remove specific bad chars if known, or try to keep valid ones.
      // Let's just strip non-standard chars.
      // 
      // Google Maps often puts a clock icon at the start.
      // We can try to regex match the time pattern.
      
      const cleaned = newOpenTime.replace(/[^\w\s\u0600-\u06FF:,\-–AMPMampm]/g, '').trim();
      if (cleaned !== newOpenTime) {
        newOpenTime = cleaned;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(`Fixing record ${record.id}: ${record.day} -> ${newDay}, ${record.openTime} -> ${newOpenTime}`);
      
      // We might have a collision if we convert to English and a record already exists (though unlikely if all are Arabic)
      // Upsert-like behavior needed?
      // Since unique constraint is [hospitalId, day], if we change 'الأربعاء' to 'Wednesday' and 'Wednesday' exists, it will fail.
      // But we likely only have one set.
      
      try {
        await prisma.workingHour.update({
          where: { id: record.id },
          data: {
            day: newDay,
            openTime: newOpenTime
          }
        });
      } catch (e) {
        console.error(`Failed to update ${record.id}:`, e);
        // If unique constraint failed, maybe delete the old one?
      }
    }
  }
}

fixWorkingHours()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
