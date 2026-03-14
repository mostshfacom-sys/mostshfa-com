const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const GOV_REFS = {
  'الإسكندرية': { id: 3, lat: 31.2001, lng: 29.9187 },
  'الجيزة': { id: 2, lat: 30.0131, lng: 31.2089 },
  'الدقهلية': { id: 4, lat: 31.0409, lng: 31.3785 },
  'الغربية': { id: 5, lat: 30.7865, lng: 31.0004 },
  'المنوفية': { id: 6, lat: 30.5526, lng: 31.0101 },
  'الشرقية': { id: 7, lat: 30.5765, lng: 31.5041 },
  'القليوبية': { id: 8, lat: 30.4591, lng: 31.1786 },
  'البحيرة': { id: 9, lat: 31.0379, lng: 30.4726 },
  'دمياط': { id: 10, lat: 31.4175, lng: 31.8144 },
  'كفر الشيخ': { id: 11, lat: 31.1107, lng: 30.9388 },
  'بورسعيد': { id: 12, lat: 31.2653, lng: 32.3019 },
  'الإسماعيلية': { id: 13, lat: 30.5965, lng: 32.2715 },
  'السويس': { id: 14, lat: 29.9668, lng: 32.5498 },
  'الفيوم': { id: 15, lat: 29.3084, lng: 30.8428 },
  'بني سويف': { id: 16, lat: 29.0661, lng: 31.0994 },
  'المنيا': { id: 17, lat: 28.1099, lng: 30.7503 },
  'أسيوط': { id: 18, lat: 27.1783, lng: 31.1859 },
  'سوهاج': { id: 19, lat: 26.5570, lng: 31.6948 },
  'قنا': { id: 20, lat: 26.1551, lng: 32.7160 },
  'الأقصر': { id: 21, lat: 25.6872, lng: 32.6396 },
  'أسوان': { id: 22, lat: 24.0889, lng: 32.8998 },
  'البحر الأحمر': { id: 23, lat: 27.2579, lng: 33.8116 },
  'الوادي الجديد': { id: 24, lat: 25.4517, lng: 30.5466 },
  'مطروح': { id: 25, lat: 31.3543, lng: 27.2373 },
  'شمال سيناء': { id: 26, lat: 31.1249, lng: 33.8006 },
  'جنوب سيناء': { id: 27, lat: 27.9158, lng: 34.3290 }
};

async function main() {
  console.log('🚀 Scanning for all governorate mismatches based on address keywords...');

  const clinics = await prisma.clinic.findMany({
    select: { id: true, nameAr: true, addressAr: true, governorateId: true }
  });

  console.log(`🔍 Analyzing ${clinics.length} clinics...`);

  let totalFixed = 0;
  let coordsUpdated = 0;

  for (const clinic of clinics) {
    if (!clinic.addressAr) continue;

    let targetGov = null;
    for (const [govName, govData] of Object.entries(GOV_REFS)) {
      if (clinic.addressAr.includes(govName)) {
        targetGov = govData;
        break;
      }
    }

    if (targetGov && clinic.governorateId !== targetGov.id) {
      let lat, lng;
      const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
      
      if (plusCodeMatch) {
        try {
          const code = plusCodeMatch[0].toUpperCase();
          const recovered = olc.recoverNearest(code, targetGov.lat, targetGov.lng);
          const decoded = olc.decode(recovered);
          lat = decoded.latitudeCenter;
          lng = decoded.longitudeCenter;
          coordsUpdated++;
        } catch (e) {}
      }

      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          governorateId: targetGov.id,
          ...(lat && lng ? { lat, lng } : {})
        }
      });
      totalFixed++;
    }
  }

  console.log(`✅ Scan Complete:`);
  console.log(`- Total mismatches corrected: ${totalFixed}`);
  console.log(`- Coordinates re-aligned using correct governorate context: ${coordsUpdated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
