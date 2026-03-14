const { PrismaClient } = require('@prisma/client');
const { OpenLocationCode } = require('open-location-code');

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const GOV_REFS = {
  1: { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  2: { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
  3: { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
  4: { name: 'الدقهلية', lat: 31.0409, lng: 31.3785 },
  5: { name: 'الشرقية', lat: 30.5765, lng: 31.5041 },
  7: { name: 'الشرقية', lat: 30.5765, lng: 31.5041 },
  8: { name: 'القليوبية', lat: 30.4591, lng: 31.1786 },
  9: { name: 'الغربية', lat: 30.7865, lng: 31.0004 },
  10: { name: 'البحيرة', lat: 31.0379, lng: 30.4726 },
};

const CITY_PATTERNS = [
  { word: 'المحلة', govId: 9, cityName: 'المحلة الكبرى' },
  { word: 'المنصورة', govId: 4, cityName: 'المنصورة' },
  { word: 'طنطا', govId: 9, cityName: 'طنطا' },
  { word: 'الزقازيق', govId: 7, cityName: 'الزقازيق' },
  { word: 'دمنهور', govId: 10, cityName: 'دمنهور' },
  { word: 'الاسكندرية', govId: 3, cityName: 'الإسكندرية' },
  { word: 'الجيزة', govId: 2, cityName: 'الجيزة' },
  { word: 'بنها', govId: 8, cityName: 'بنها' },
  { word: 'أكتوبر', govId: 2, cityName: '6 أكتوبر' },
  { word: 'زايد', govId: 2, cityName: 'الشيخ زايد' }
];

async function main() {
  console.log('🚀 Starting deep scan for city/governorate mismatches...');

  const clinics = await prisma.clinic.findMany({
    select: { id: true, nameAr: true, addressAr: true, governorateId: true, cityId: true }
  });

  const cities = await prisma.city.findMany({
    select: { id: true, nameAr: true, governorateId: true }
  });

  let correctedCount = 0;

  for (const clinic of clinics) {
    if (!clinic.addressAr) continue;

    for (const pattern of CITY_PATTERNS) {
      // Check if the address contains the city name but is linked to the wrong governorate
      if (clinic.addressAr.includes(pattern.word) && clinic.governorateId !== pattern.govId) {
        
        // Find the correct city ID in the target governorate
        const targetCity = cities.find(c => 
          c.governorateId === pattern.govId && 
          (c.nameAr.includes(pattern.cityName) || pattern.cityName.includes(c.nameAr))
        );

        if (targetCity) {
          let lat, lng;
          const plusCodeMatch = clinic.addressAr.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
          
          if (plusCodeMatch) {
            const ref = GOV_REFS[pattern.govId];
            if (ref) {
              try {
                const code = plusCodeMatch[0].toUpperCase();
                const recovered = olc.recoverNearest(code, ref.lat, ref.lng);
                const decoded = olc.decode(recovered);
                lat = decoded.latitudeCenter;
                lng = decoded.longitudeCenter;
              } catch (e) {}
            }
          }

          await prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              governorateId: pattern.govId,
              cityId: targetCity.id,
              ...(lat && lng ? { lat, lng } : {})
            }
          });
          correctedCount++;
          console.log(`✅ Corrected: ${clinic.nameAr} -> Moved to ${pattern.cityName} (${pattern.govId})`);
          break; // Move to next clinic
        }
      }
    }
  }

  console.log(`✨ Total mismatches corrected in deep scan: ${correctedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
