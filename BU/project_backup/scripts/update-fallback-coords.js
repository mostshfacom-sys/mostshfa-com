const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CITY_COORDS = {
  'القاهرة': { lat: 30.0444, lng: 31.2357 },
  'الجيزة': { lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187 },
  'المنصورة': { lat: 31.0409, lng: 31.3785 },
  'طنطا': { lat: 30.7865, lng: 31.0004 },
  'الزقازيق': { lat: 30.5765, lng: 31.5041 },
  'بورسعيد': { lat: 31.2653, lng: 32.3019 },
  'السويس': { lat: 29.9668, lng: 32.5498 },
  'المحلة الكبرى': { lat: 30.9733, lng: 31.1667 },
  'الأقصر': { lat: 25.6872, lng: 32.6396 },
  'أسوان': { lat: 24.0889, lng: 32.8998 },
  'أسيوط': { lat: 27.1783, lng: 31.1859 },
  'سوهاج': { lat: 26.5570, lng: 31.6948 },
  'الفيوم': { lat: 29.3084, lng: 30.8428 },
  'المنيا': { lat: 28.1099, lng: 30.7503 },
  'بني سويف': { lat: 29.0661, lng: 31.0994 },
  'دمياط': { lat: 31.4175, lng: 31.8144 },
  'إسماعيلية': { lat: 30.5965, lng: 32.2715 },
  'كفر الشيخ': { lat: 31.1107, lng: 30.9388 },
  'شبين الكوم': { lat: 30.5526, lng: 31.0101 },
  'بنها': { lat: 30.4591, lng: 31.1786 },
  'الغردقة': { lat: 27.2579, lng: 33.8116 },
  'مرسى مطروح': { lat: 31.3543, lng: 27.2373 },
  'العريش': { lat: 31.1249, lng: 33.8006 },
  'شرم الشيخ': { lat: 27.9158, lng: 34.3290 },
  'دمنهور': { lat: 31.0379, lng: 30.4726 },
  'قنا': { lat: 26.1551, lng: 32.7160 },
  'مدينة نصر': { lat: 30.0566, lng: 31.3301 },
  'المعادي': { lat: 29.9602, lng: 31.2569 },
  'مصر الجديدة': { lat: 30.0890, lng: 31.3145 },
  'الدقي': { lat: 30.0378, lng: 31.2100 },
  'المهندسين': { lat: 30.0511, lng: 31.2001 },
  'الهرم': { lat: 29.9975, lng: 31.1661 },
  'التجمع الخامس': { lat: 30.0234, lng: 31.4870 },
  'سموحة': { lat: 31.2156, lng: 29.9553 },
  '6 أكتوبر': { lat: 29.9737, lng: 30.9511 },
  'الشيخ زايد': { lat: 30.0448, lng: 30.9855 }
};

async function main() {
  console.log('Starting coordinates update for missing clinics...');
  
  const clinics = await prisma.clinic.findMany({
    where: {
      lat: null,
      OR: [
        { cityId: { not: null } },
        { governorateId: { not: null } }
      ]
    },
    include: {
      city: true,
      governorate: true
    }
  });

  console.log(`Found ${clinics.length} clinics without coordinates.`);

  let updatedCount = 0;
  for (const clinic of clinics) {
    const cityName = clinic.city?.nameAr;
    const govName = clinic.governorate?.nameAr;
    
    let coords = CITY_COORDS[cityName] || CITY_COORDS[govName];
    
    if (coords) {
      // Add a small random jitter to avoid exact overlap (approx 500m)
      const jitterLat = (Math.random() - 0.5) * 0.01;
      const jitterLng = (Math.random() - 0.5) * 0.01;
      
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          lat: coords.lat + jitterLat,
          lng: coords.lng + jitterLng
        }
      });
      updatedCount++;
      if (updatedCount % 100 === 0) console.log(`Updated ${updatedCount} clinics with fallbacks...`);
    }
  }

  console.log(`Success! Updated ${updatedCount} clinics with fallback coordinates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
