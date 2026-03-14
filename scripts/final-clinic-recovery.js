const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');

const prismaOld = new PrismaClientOld({
  datasources: {
    db: {
      url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
    }
  }
});
const prismaNew = new PrismaClientNew();

function normalize(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_.\s]/g, '')
    .trim();
}

async function main() {
  console.log('🚀 Final attempt to recover clinic coordinates using flexible matching...');

  try {
    // 1. Get ALL entries from old hospital table with coordinates
    const oldEntries = await prismaOld.hospital.findMany({
      where: {
        AND: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      },
      select: { nameAr: true, lat: true, lng: true, address: true }
    });

    console.log(`🔍 Found ${oldEntries.length} entries with coordinates in old 'hospital' table.`);

    // 2. Get clinics in new DB missing coordinates
    const newClinics = await prismaNew.clinic.findMany({
      where: { lat: null },
      select: { id: true, nameAr: true, addressAr: true }
    });

    console.log(`🔍 Checking ${newClinics.length} clinics for flexible matches...`);

    let recovered = 0;
    for (const clinic of newClinics) {
      const normNew = normalize(clinic.nameAr);
      
      // Look for any overlap in normalized names (more than 70% match or containment)
      const match = oldEntries.find(o => {
        const normOld = normalize(o.nameAr);
        return normOld === normNew || 
               (normOld.length > 8 && normNew.length > 8 && (normOld.includes(normNew) || normNew.includes(normOld)));
      });

      if (match && match.lat && match.lng) {
        await prismaNew.clinic.update({
          where: { id: clinic.id },
          data: { lat: match.lat, lng: match.lng }
        });
        recovered++;
        if (recovered % 20 === 0) console.log(`Recovered ${recovered} clinics...`);
      }
    }

    console.log(`✅ Recovery complete. Total recovered: ${recovered}`);
    const finalCount = await prismaNew.clinic.count({ where: { NOT: { lat: null } } });
    console.log(`📊 Final accurate clinic count in PostgreSQL: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
