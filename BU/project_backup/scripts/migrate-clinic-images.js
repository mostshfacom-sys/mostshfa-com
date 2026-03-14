const { PrismaClient: PrismaClientOld } = require('c:/web/mostshfa.com_trae/سحب بيانات العيادات/node_modules/@prisma/client');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');

async function main() {
  const prismaOld = new PrismaClientOld({
    datasources: {
      db: {
        url: 'file:c:/web/mostshfa.com_trae/سحب بيانات العيادات/prisma/dev.db'
      }
    }
  });
  const prismaNew = new PrismaClientNew();

  console.log('🚀 Starting Clinic Image Migration from Old Database...');

  try {
    // 1. Fetch all clinics with valid images from the old database
    const oldClinics = await prismaOld.clinic.findMany({
      where: {
        AND: [
          { NOT: { image: null } },
          { NOT: { image: '' } },
          { NOT: { image: { contains: 'unsplash' } } },
          { NOT: { image: { contains: 'placeholder' } } }
        ]
      },
      select: { nameAr: true, image: true, logo: true }
    });

    console.log(`🔍 Found ${oldClinics.length} clinics with valid images in old DB.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const oldClinic of oldClinics) {
      // 2. Find the matching clinic in the new PostgreSQL database by nameAr
      const matchingClinic = await prismaNew.clinic.findFirst({
        where: {
          nameAr: oldClinic.nameAr,
          OR: [
            { image: null },
            { image: '' },
            { image: { contains: 'unsplash' } },
            { image: { contains: 'placeholder' } }
          ]
        }
      });

      if (matchingClinic) {
        await prismaNew.clinic.update({
          where: { id: matchingClinic.id },
          data: {
            image: oldClinic.image || matchingClinic.image,
            logo: oldClinic.logo || matchingClinic.logo
          }
        });
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} clinics...`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Migration Complete:`);
    console.log(`- Total clinics updated with real images: ${updatedCount}`);
    console.log(`- Clinics skipped (not found or already have images): ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error during image migration:', error.message);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
