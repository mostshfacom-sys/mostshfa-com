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
    .replace(/\s+/g, '')
    .trim();
}

async function main() {
  console.log('🚀 Fuzzy matching clinics against old hospital/center data...');

  try {
    const oldEntries = await prismaOld.hospital.findMany({
      where: {
        OR: [
          { nameAr: { contains: 'مركز' } },
          { nameAr: { contains: 'مجمع' } },
          { nameAr: { contains: 'عيادة' } }
        ],
        AND: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      },
      select: { nameAr: true, lat: true, lng: true }
    });

    const normalizedOld = oldEntries.map(e => ({
      ...e,
      norm: normalize(e.nameAr)
    }));

    const newClinics = await prismaNew.clinic.findMany({
      where: { lat: null },
      select: { id: true, nameAr: true }
    });

    console.log(`🔍 Comparing ${newClinics.length} clinics against ${normalizedOld.length} old entries...`);

    let recovered = 0;
    for (const clinic of newClinics) {
      const normNew = normalize(clinic.nameAr);
      const match = normalizedOld.find(o => o.norm === normNew || o.norm.includes(normNew) || normNew.includes(o.norm));

      if (match && match.lat && match.lng) {
        await prismaNew.clinic.update({
          where: { id: clinic.id },
          data: { lat: match.lat, lng: match.lng }
        });
        recovered++;
        if (recovered % 10 === 0) console.log(`Recovered ${recovered} so far...`);
      }
    }

    console.log(`✅ Fuzzy recovery complete. Recovered: ${recovered}`);
    const finalCount = await prismaNew.clinic.count({ where: { NOT: { lat: null } } });
    console.log(`📊 Final accurate clinic count: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
