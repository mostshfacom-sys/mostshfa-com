
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.hospital.count();
  const emergencyCount = await prisma.hospital.count({ where: { hasEmergency: true } });
  const ambulanceCount = await prisma.hospital.count({ where: { hasAmbulance: true } });
  const wheelchairCount = await prisma.hospital.count({ where: { wheelchairAccessible: true } });
  const withBeds = await prisma.hospital.count({ where: { beds: { gt: 0 } } });
  const withImages = await prisma.hospital.count({ where: { logo: { not: null } } });

  console.log(`Total Hospitals: ${count}`);
  console.log(`With Emergency: ${emergencyCount}`);
  console.log(`With Ambulance: ${ambulanceCount}`);
  console.log(`Wheelchair Accessible: ${wheelchairCount}`);
  console.log(`With Bed Data: ${withBeds}`);
  console.log(`With Images: ${withImages}`);
}

main().finally(() => prisma.$disconnect());
