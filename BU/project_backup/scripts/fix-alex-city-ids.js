const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CITY_MAPPING = {
  'سيدى جابر': 185, // Adjust based on your DB IDs
  'الرمل': 226,
  'فلمنج': 272,
  'سموحة': 219,
  'ميامي': 220,
  'المنتزه': 223,
  'لوران': 295,
  'جليم': 283,
  'سيدي بشر': 224,
  'العصافرة': 222,
  'محرم بك': 227,
  'الإبراهيمية': 228
};

async function main() {
  console.log('🚀 Mapping Alexandria clinics to correct City IDs...');

  const alexClinics = await prisma.clinic.findMany({
    where: {
      governorateId: 3, // Alexandria
      cityId: 1 // Still Cairo
    },
    select: { id: true, addressAr: true }
  });

  console.log(`🔍 Found ${alexClinics.length} clinics in Alexandria still linked to Cairo City ID.`);

  let updatedCount = 0;
  for (const clinic of alexClinics) {
    let targetCityId = 3; // Default to Alexandria City if no specific neighborhood match

    for (const [name, id] of Object.entries(CITY_MAPPING)) {
      if (clinic.addressAr.includes(name)) {
        targetCityId = id;
        break;
      }
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { cityId: targetCityId }
    });
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} Alexandria clinics with correct City IDs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
