const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');

async function main() {
  const prismaOld = new PrismaClientOld({
    datasources: {
      db: {
        url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
      }
    }
  });
  const prismaNew = new PrismaClientNew();

  console.log('🚀 Starting Coordinate Recovery from Old Database...');

  try {
    // 1. Recover Hospital Coordinates
    const oldHospitals = await prismaOld.hospital.findMany({
      where: {
        OR: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      },
      select: { nameAr: true, lat: true, lng: true, cityId: true, governorateId: true }
    });

    console.log(`🔍 Found ${oldHospitals.length} hospitals with coordinates in old DB.`);

    let hospitalUpdated = 0;
    for (const oldHosp of oldHospitals) {
      if (!oldHosp.lat || !oldHosp.lng) continue;

      // Try to find matching hospital in new DB by name
      const matchingHosp = await prismaNew.hospital.findFirst({
        where: {
          nameAr: oldHosp.nameAr,
          lat: null // Only update if currently missing
        }
      });

      if (matchingHosp) {
        await prismaNew.hospital.update({
          where: { id: matchingHosp.id },
          data: { lat: oldHosp.lat, lng: oldHosp.lng }
        });
        hospitalUpdated++;
      }
    }
    console.log(`✅ Recovered ${hospitalUpdated} hospital coordinates.`);

    // 2. Recover Clinic Coordinates
    // Many clinics in the new DB were actually "Hospitals" or "Medical Centers" in the old DB
    // or share names with them.
    const newClinicsMissing = await prismaNew.clinic.findMany({
      where: { lat: null },
      select: { id: true, nameAr: true }
    });

    console.log(`🔍 Checking ${newClinicsMissing.length} clinics for matches in old hospital data...`);

    let clinicUpdated = 0;
    for (const clinic of newClinicsMissing) {
      const match = oldHospitals.find(h => h.nameAr === clinic.nameAr);
      if (match && match.lat && match.lng) {
        await prismaNew.clinic.update({
          where: { id: clinic.id },
          data: { lat: match.lat, lng: match.lng }
        });
        clinicUpdated++;
      }
    }
    console.log(`✅ Recovered ${clinicUpdated} clinic coordinates from old hospital data.`);

  } catch (error) {
    console.error('❌ Error during recovery:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
