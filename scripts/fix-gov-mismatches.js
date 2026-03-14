const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

// Reference coordinates for major governorates in Egypt
const GOV_REFS = {
  'الإسكندرية': { id: 3, lat: 31.2001, lng: 29.9187 },
  'الجيزة': { id: 2, lat: 30.0131, lng: 31.2089 },
  'الدقهلية': { id: 4, lat: 31.0409, lng: 31.3785 }, // Mansoura
  'الغربية': { id: 5, lat: 30.7865, lng: 31.0004 }, // Tanta
  'القاهرة': { id: 1, lat: 30.0444, lng: 31.2357 }
};

async function main() {
  console.log('🚀 Fixing governorate mismatches and correcting coordinates...');

  // 1. Find clinics that mention 'الإسكندرية' in address but are linked to 'القاهرة' (id: 1)
  const alexMismatches = await prisma.clinic.findMany({
    where: {
      addressAr: { contains: 'الإسكندرية' },
      governorateId: 1
    },
    select: { id: true, nameAr: true, addressAr: true }
  });

  console.log(`🔍 Found ${alexMismatches.length} Alexandria clinics incorrectly linked to Cairo.`);

  let fixedCount = 0;
  for (const clinic of alexMismatches) {
    let lat, lng;
    
    // Re-extract Plus Code with Alexandria as reference
    const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
    if (plusCodeMatch) {
      try {
        const code = plusCodeMatch[0].toUpperCase();
        // Use Alexandria reference (31.2, 29.9) instead of Cairo
        const recovered = olc.recoverNearest(code, GOV_REFS['الإسكندرية'].lat, GOV_REFS['الإسكندرية'].lng);
        const decoded = olc.decode(recovered);
        lat = decoded.latitudeCenter;
        lng = decoded.longitudeCenter;
      } catch (e) {}
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        governorateId: GOV_REFS['الإسكندرية'].id,
        // If we found a more accurate lat/lng using the correct reference, update it
        ...(lat && lng ? { lat, lng } : {})
      }
    });
    fixedCount++;
  }

  console.log(`✅ Successfully moved ${fixedCount} clinics to Alexandria and updated their coordinates.`);

  // 2. Check for Giza mismatches (mentioning 'الجيزة' or 'أكتوبر' but linked to Cairo)
  const gizaMismatches = await prisma.clinic.findMany({
    where: {
      OR: [
        { addressAr: { contains: 'الجيزة' } },
        { addressAr: { contains: 'أكتوبر' } },
        { addressAr: { contains: 'زايد' } }
      ],
      governorateId: 1
    },
    select: { id: true, nameAr: true, addressAr: true }
  });

  console.log(`🔍 Found ${gizaMismatches.length} Giza/October clinics incorrectly linked to Cairo.`);

  let gizaFixed = 0;
  for (const clinic of gizaMismatches) {
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { governorateId: GOV_REFS['الجيزة'].id }
    });
    gizaFixed++;
  }
  console.log(`✅ Successfully moved ${gizaFixed} clinics to Giza.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
