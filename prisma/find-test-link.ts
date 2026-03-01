
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findHospitalWithHours() {
  const hospital = await prisma.hospital.findFirst({
    where: {
      workingHoursList: {
        some: {}
      }
    },
    include: {
      workingHoursList: true
    }
  });

  if (hospital) {
    console.log(`Found Hospital: ${hospital.nameAr}`);
    console.log(`Slug: ${hospital.slug}`);
    console.log(`Hours Count: ${hospital.workingHoursList.length}`);
    console.log('Sample Hour:', hospital.workingHoursList[0]);
  } else {
    console.log('No hospital found with working hours.');
  }
}

findHospitalWithHours()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
