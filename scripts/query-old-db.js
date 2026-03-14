const { PrismaClient } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const path = require('path');

async function main() {
  const prismaOld = new PrismaClient({
    datasources: {
      db: {
        url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
      }
    }
  });

  try {
    const totalCount = await prismaOld.clinic.count();
    console.log(`TOTAL_OLD_CLINICS=${totalCount}`);

    const withCoords = await prismaOld.clinic.count({
      where: {
        OR: [
          { NOT: { lat: null } },
          { NOT: { lng: null } }
        ]
      }
    });
    console.log(`OLD_CLINICS_WITH_COORDS=${withCoords}`);

    if (withCoords > 0) {
      const sample = await prismaOld.clinic.findFirst({
        where: {
          OR: [
            { NOT: { lat: null } },
            { NOT: { lng: null } }
          ]
        },
        select: { id: true, nameAr: true, lat: true, lng: true }
      });
      console.log('SAMPLE_COORDS=' + JSON.stringify(sample));
    }
  } catch (error) {
    console.error('Error querying old DB:', error.message);
  } finally {
    await prismaOld.$disconnect();
  }
}

main();
