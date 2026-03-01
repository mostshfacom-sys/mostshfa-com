
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const workingHoursCount = await prisma.workingHour.count();
  console.log(`Total WorkingHour records: ${workingHoursCount}`);

  const hospitalsWithHours = await prisma.hospital.findMany({
    where: {
      workingHoursList: {
        some: {}
      }
    },
    include: {
      workingHoursList: true
    },
    take: 5
  });

  console.log(`Hospitals with working hours: ${hospitalsWithHours.length}`);
  
  if (hospitalsWithHours.length > 0) {
    console.log('Sample hospital with hours:', hospitalsWithHours[0].nameAr);
    console.log('Hours:', hospitalsWithHours[0].workingHoursList);
  } else {
    console.log('No hospitals found with linked working hours.');
  }

  // Check if there are hospitals without working hours list but with JSON workingHours
  const hospitalsWithJsonButNoList = await prisma.hospital.count({
    where: {
      workingHours: {
        not: '{}'
      },
      workingHoursList: {
        none: {}
      }
    }
  });
  console.log(`Hospitals with JSON workingHours but no WorkingHour records: ${hospitalsWithJsonButNoList}`);
}

checkData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
