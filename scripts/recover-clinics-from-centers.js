const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');

const prismaOld = new PrismaClientOld({
  datasources: {
    db: {
      url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
    }
  }
});
const prismaNew = new PrismaClientNew();

async function main() {
  console.log('🚀 Recovering Clinic coordinates from old Hospital/Center entries...');

  try {
    // 1. Get potential clinics from old hospital table
    // Filtering for entries that are likely clinics (Centers, Polyclinics, etc.)
    const oldEntries = await prismaOld.hospital.findMany({
      where: {
        OR: [
          { nameAr: { contains: 'مركز' } },
          { nameAr: { contains: 'مجمع' } },
          { nameAr: { contains: 'عيادة' } }
        ],
        AND: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      },
      select: { nameAr: true, lat: true, lng: true }
    });

    console.log(`🔍 Found ${oldEntries.length} potential clinic matches in old hospital data.`);

    let recoveredCount = 0;
    for (const entry of oldEntries) {
      if (!entry.lat || !entry.lng) continue;

      // Try to find matching clinic in new DB
      // Using exact name match first
      const matchingClinic = await prismaNew.clinic.findFirst({
        where: {
          nameAr: entry.nameAr,
          lat: null
        }
      });

      if (matchingClinic) {
        await prismaNew.clinic.update({
          where: { id: matchingClinic.id },
          data: { lat: entry.lat, lng: entry.lng }
        });
        recoveredCount++;
      }
    }

    console.log(`✅ Recovered ${recoveredCount} coordinates for clinics from old hospital entries.`);

    // 2. Final Count Check
    const totalWithCoords = await prismaNew.clinic.count({
      where: { NOT: { lat: null } }
    });
    console.log(`📊 Total Clinics with accurate coordinates now: ${totalWithCoords}`);

  } catch (error) {
    console.error('❌ Error during recovery:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
