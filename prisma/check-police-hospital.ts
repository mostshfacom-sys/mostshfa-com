
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificHospital() {
  const hospital = await prisma.hospital.findFirst({
    where: {
      nameAr: {
        contains: 'الشرطة'
      }
    },
    include: {
      workingHoursList: true
    }
  });

  if (hospital) {
    console.log(`Hospital: ${hospital.nameAr}`);
    console.log(`Slug: ${hospital.slug}`);
    console.log(`Hours:`, hospital.workingHoursList);
  } else {
    console.log('Hospital not found');
  }
}

checkSpecificHospital()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
