const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const GHARBIA_GOV_ID = 9;
const MAHALLA_CITY_ID = 61;
const GHARBIA_REF = { lat: 30.9763, lng: 31.1656 };

async function main() {
  console.log('🚀 Performing final comprehensive scan for Mahalla/Gharbia mismatches...');

  const clinics = await prisma.clinic.findMany({
    where: {
      OR: [
        { addressAr: { contains: 'المحلة' } },
        { addressAr: { contains: 'MAHALLA' } },
        { nameAr: { contains: 'المحلة' } }
      ]
    },
    select: { id: true, nameAr: true, addressAr: true, governorateId: true, cityId: true }
  });

  console.log(`🔍 Found ${clinics.length} clinics matching "Mahalla" keywords.`);

  let correctedCount = 0;
  for (const clinic of clinics) {
    if (clinic.governorateId !== GHARBIA_GOV_ID || clinic.cityId !== MAHALLA_CITY_ID) {
      let lat, lng;
      const plusCodeMatch = clinic.addressAr?.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
      
      if (plusCodeMatch) {
        try {
          const code = plusCodeMatch[0].toUpperCase();
          const recovered = olc.recoverNearest(code, GHARBIA_REF.lat, GHARBIA_REF.lng);
          const decoded = olc.decode(recovered);
          lat = decoded.latitudeCenter;
          lng = decoded.longitudeCenter;
        } catch (e) {}
      }

      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          governorateId: GHARBIA_GOV_ID,
          cityId: MAHALLA_CITY_ID,
          ...(lat && lng ? { lat, lng } : {})
        }
      });
      correctedCount++;
      console.log(`✅ Corrected: ${clinic.nameAr} (Current Gov: ${clinic.governorateId} -> Target: ${GHARBIA_GOV_ID})`);
    }
  }

  console.log(`✨ Final scan complete. Corrected ${correctedCount} clinics.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
