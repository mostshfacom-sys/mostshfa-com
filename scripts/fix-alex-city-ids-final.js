const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Re-mapping Alexandria clinics to confirmed Alexandria City IDs...');

  // Actual Alexandria city entries from the database
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

    // Default to 'الإسكندرية' (City ID: 13) if no specific neighborhood is found
    if (!targetCityId) {
      targetCityId = 13;
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { cityId: targetCityId }
    });
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} clinics with confirmed Alexandria City IDs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
