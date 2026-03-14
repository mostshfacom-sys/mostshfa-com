const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const GOV_REFS = {
  1: { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  2: { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
  3: { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
  4: { name: 'الدقهلية', lat: 31.0409, lng: 31.3785 },
  5: { name: 'الغربية', lat: 30.7865, lng: 31.0004 },
  17: { name: 'المنيا', lat: 28.1099, lng: 30.7503 },
  19: { name: 'سوهاج', lat: 26.5570, lng: 31.6948 },
  // Add others as needed, but these cover the most common ones
};

async function main() {
  console.log('🚀 Final Coordinate Validation and Correction Sweep...');

  const clinics = await prisma.clinic.findMany({
    where: {
      NOT: [{ lat: null }, { lng: null }]
    },
    select: { id: true, nameAr: true, addressAr: true, lat: true, lng: true, governorateId: true }
  });

  console.log(`🔍 Checking ${clinics.length} clinics with coordinates...`);

  let correctedCount = 0;

  for (const clinic of clinics) {
    const ref = GOV_REFS[clinic.governorateId];
    if (!ref) continue;

    // Check if coordinates are outside a reasonable radius for the governorate
    // (Approx 1 degree latitude/longitude for most governorates, maybe more for large ones)
    const distLat = Math.abs(clinic.lat - ref.lat);
    const distLng = Math.abs(clinic.lng - ref.lng);

    if (distLat > 1.5 || distLng > 1.5) {
      // Potentially mismatched coordinate
      const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
      
      if (plusCodeMatch) {
        try {
          const code = plusCodeMatch[0].toUpperCase();
          const recovered = olc.recoverNearest(code, ref.lat, ref.lng);
          const decoded = olc.decode(recovered);
          
          await prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              lat: decoded.latitudeCenter,
              lng: decoded.longitudeCenter
            }
          });
          correctedCount++;
          console.log(`📍 Corrected: ${clinic.nameAr} (${ref.name})`);
        } catch (e) {
          // If Plus Code recovery fails, check if we should just null it or leave it
          // For now, let's keep it but mark it for review if needed
        }
      }
    }
  }

  console.log(`✅ Sweep Complete. Corrected ${correctedCount} misplaced coordinates.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
