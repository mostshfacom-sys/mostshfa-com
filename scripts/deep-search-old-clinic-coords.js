const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');

async function main() {
  const prismaOld = new PrismaClientOld({
    datasources: {
      db: {
        url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
      }
    }
  });

  console.log('🔍 Deep Search for Clinic Coordinates in Old Database...');

  try {
    // 1. Check if there are any clinics with lat/lng that we missed
    const withLat = await prismaOld.clinic.count({ where: { NOT: { lat: null } } });
    console.log(`- Clinics with lat column not null: ${withLat}`);

    // 2. Check metadata for coordinates
    const withMetaCoords = await prismaOld.clinic.count({
      where: {
        OR: [
          { metadata: { contains: 'lat' } },
          { metadata: { contains: 'lng' } },
          { metadata: { contains: 'latitude' } },
          { metadata: { contains: 'longitude' } }
        ]
      }
    });
    console.log(`- Clinics with coordinate keywords in metadata: ${withMetaCoords}`);

    if (withMetaCoords > 0) {
      const sample = await prismaOld.clinic.findFirst({
        where: {
          OR: [
            { metadata: { contains: 'lat' } },
            { metadata: { contains: 'lng' } }
          ]
        },
        select: { id: true, nameAr: true, metadata: true }
      });
      console.log('  Sample metadata coords:', sample);
    }

    // 3. Check description for coordinates (sometimes scrapers put them there)
    const withDescCoords = await prismaOld.clinic.count({
      where: {
        OR: [
          { descriptionAr: { contains: 'lat' } },
          { descriptionAr: { contains: 'lng' } },
          { descriptionAr: { contains: 'maps.google' } }
        ]
      }
    });
    console.log(`- Clinics with coordinate/map keywords in description: ${withDescCoords}`);

    if (withDescCoords > 0) {
      const sample = await prismaOld.clinic.findFirst({
        where: {
          OR: [
            { descriptionAr: { contains: 'lat' } },
            { descriptionAr: { contains: 'maps.google' } }
          ]
        },
        select: { id: true, nameAr: true, descriptionAr: true }
      });
      console.log('  Sample description coords:', sample);
    }

  } catch (error) {
    console.error('❌ Error during deep search:', error.message);
  } finally {
    await prismaOld.$disconnect();
  }
}

main();
