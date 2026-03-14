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

  console.log('🚀 Searching for clinics that are actually centers/hospitals in the old DB...');

  try {
    // 1. Get all hospitals with coordinates from old DB
    const oldHospitals = await prismaOld.hospital.findMany({
      where: {
        OR: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      },
      select: { nameAr: true, lat: true, lng: true, address: true }
    });

    console.log(`🔍 Found ${oldHospitals.length} entries with coordinates in old 'hospital' table.`);

    // 2. Get clinics in new DB missing coordinates
    const newClinics = await prismaNew.clinic.findMany({
      where: { lat: null },
      select: { id: true, nameAr: true, addressAr: true }
    });

    console.log(`🔍 Checking ${newClinics.length} clinics for matches...`);

    let recoveredCount = 0;
    const updates = [];

    for (const clinic of newClinics) {
      // Look for a match in old hospitals (since many clinics were scraped as centers/hospitals)
      const match = oldHospitals.find(h => 
        h.nameAr === clinic.nameAr || 
        (clinic.nameAr.includes(h.nameAr) && h.nameAr.length > 10) ||
        (h.nameAr.includes(clinic.nameAr) && clinic.nameAr.length > 10)
      );

      if (match && match.lat && match.lng) {
        updates.push(prismaNew.clinic.update({
          where: { id: clinic.id },
          data: { lat: match.lat, lng: match.lng }
        }));
        recoveredCount++;
        
        if (updates.length >= 100) {
          await Promise.all(updates.splice(0, 100));
          console.log(`Updated ${recoveredCount} clinics...`);
        }
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    console.log(`✅ Total recovered clinic coordinates: ${recoveredCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
