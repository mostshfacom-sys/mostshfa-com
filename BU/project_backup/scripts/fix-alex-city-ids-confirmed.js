const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ALEX_CITY_MAPPING = {
  'سيدى جابر': 185, // Wait, I need to check if 185 is actually Sidi Gaber in Alex or something else.
  'الرمل': 226,
  'فلمنج': 272,
  'سموحة': 219,
  'ميامي': 220,
  'المنتزه': 223,
  'سيدي بشر': 224,
  'العصافرة': 222,
  'فيكتوريا': 225,
  'محرم بك': 227,
  'الإبراهيمية': 228,
  'السيوف': 273,
  'محطة الرمل': 274,
  'جناكليس': 275,
  'بوكلي': 276,
  'كليوباترا': 279,
  'سبورتنج': 280,
  'الازاريطة': 281,
  'جليم': 283,
  'سابا باشا': 284,
  'رشدى': 288,
  'لوران': 295,
  'المندرة': 296,
  'الورديان': 297,
  'كامب شيزار': 298,
  'الشاطبي': 303
};

async function main() {
  console.log('🚀 Re-mapping Alexandria clinics to confirmed Alexandria City IDs...');

  // First, let's find the actual Alexandria city entries to be sure about IDs
  const alexCities = await prisma.city.findMany({
    where: { governorateId: 3 },
    select: { id: true, nameAr: true }
  });

  const cityMap = {};
  alexCities.forEach(c => {
    cityMap[c.nameAr.trim()] = c.id;
  });

  const clinics = await prisma.clinic.findMany({
    where: { governorateId: 3 },
    select: { id: true, addressAr: true }
  });

  console.log(`🔍 Checking ${clinics.length} clinics in Alexandria...`);

  let updatedCount = 0;
  for (const clinic of clinics) {
    if (!clinic.addressAr) continue;
    
    let targetCityId = null;
    // Look for neighborhood match
    for (const [cityName, cityId] of Object.entries(cityMap)) {
      if (clinic.addressAr.includes(cityName)) {
        targetCityId = cityId;
        break;
      }
    }

    if (targetCityId) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: { cityId: targetCityId }
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} clinics with confirmed Alexandria City IDs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
