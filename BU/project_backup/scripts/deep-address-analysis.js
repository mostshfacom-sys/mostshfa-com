const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prismaOld = new PrismaClientOld({
  datasources: {
    db: {
      url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
    }
  }
});
const prismaNew = new PrismaClientNew();
const olc = new OpenLocationCode();

async function main() {
  console.log('🚀 Deep Analysis of addressAr for Coordinates and Plus Codes...');

  try {
    const oldClinics = await prismaOld.clinic.findMany({
      select: { id: true, nameAr: true, addressAr: true }
    });

    console.log(`🔍 Processing ${oldClinics.length} clinics from old database...`);

    let plusCodeCount = 0;
    let urlCount = 0;
    let coordinateCount = 0;
    let totalUpdated = 0;

    for (const oldClinic of oldClinics) {
      if (!oldClinic.addressAr) continue;

      let lat, lng;

      // 1. Check for Plus Codes (e.g., 6WGW+4PF)
      const plusCodeMatch = oldClinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
      if (plusCodeMatch) {
        try {
          const code = plusCodeMatch[0].toUpperCase();
          const recovered = olc.recoverNearest(code, 30.0444, 31.2357);
          const decoded = olc.decode(recovered);
          lat = decoded.latitudeCenter;
          lng = decoded.longitudeCenter;
          plusCodeCount++;
        } catch (e) {}
      }

      // 2. Check for explicit coordinates in text (e.g., 30.123, 31.456)
      if (!lat) {
        const coordMatch = oldClinic.addressAr.match(/(\d{2}\.\d+)\s*,\s*(\d{2}\.\d+)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
          coordinateCount++;
        }
      }

      // 3. Check for Google Maps URLs (just to count them for now)
      if (oldClinic.addressAr.includes('maps.app.goo.gl') || oldClinic.addressAr.includes('google.com/maps')) {
        urlCount++;
      }

      if (lat && lng) {
        // Try to update in new database
        const matchingClinic = await prismaNew.clinic.findFirst({
          where: {
            nameAr: oldClinic.nameAr,
            lat: null
          }
        });

        if (matchingClinic) {
          await prismaNew.clinic.update({
            where: { id: matchingClinic.id },
            data: { lat, lng }
          });
          totalUpdated++;
        }
      }
    }

    console.log(`✅ Analysis Complete:`);
    console.log(`- Plus Codes found: ${plusCodeCount}`);
    console.log(`- Explicit Coordinates found: ${coordinateCount}`);
    console.log(`- Map URLs found (not resolved yet): ${urlCount}`);
    console.log(`- Successfully updated in PostgreSQL: ${totalUpdated}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
