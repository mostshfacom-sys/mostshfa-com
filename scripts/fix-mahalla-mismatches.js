const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

// IDs based on database investigation
const GHARBIA_GOV_ID = 9;
const MAHALLA_CITY_ID = 61;
const GHARBIA_REF = { lat: 30.9763, lng: 31.1656 }; // Tanta/Mahalla area reference

async function main() {
  console.log('🚀 Fixing Mahalla clinic mismatches and re-extracting coordinates...');

  // 1. Find clinics that mention 'المحلة' or 'MAHALLA' but are linked to wrong governorate
  const mahallaMismatches = await prisma.clinic.findMany({
    where: {
      OR: [
        { addressAr: { contains: 'المحلة' } },
        { addressAr: { contains: 'MAHALLA' } }
      ],
      NOT: {
        governorateId: GHARBIA_GOV_ID
      }
    },
    select: { id: true, nameAr: true, addressAr: true, governorateId: true, cityId: true }
  });

  console.log(`🔍 Found ${mahallaMismatches.length} Mahalla clinics with incorrect governorate/city.`);

  let fixedCount = 0;
  for (const clinic of mahallaMismatches) {
    let lat, lng;
    
    // Re-extract Plus Code with Gharbia as reference
    const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
    if (plusCodeMatch) {
      try {
        const code = plusCodeMatch[0].toUpperCase();
        const recovered = olc.recoverNearest(code, GHARBIA_REF.lat, GHARBIA_REF.lng);
        const decoded = olc.decode(recovered);
        lat = decoded.latitudeCenter;
        lng = decoded.longitudeCenter;
      } catch (e) {
        console.error(`Error decoding Plus Code for ${clinic.nameAr}:`, e.message);
      }
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        governorateId: GHARBIA_GOV_ID,
        cityId: MAHALLA_CITY_ID,
        ...(lat && lng ? { lat, lng } : {})
      }
    });
    fixedCount++;
    console.log(`✅ Fixed: ${clinic.nameAr}`);
  }

  console.log(`✨ Total Mahalla clinics corrected: ${fixedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
