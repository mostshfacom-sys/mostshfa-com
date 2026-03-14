
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clear() {
  console.log('Clearing existing hospital data...');
  
  // Delete all hospitals
  await prisma.review.deleteMany({});
  await prisma.workingHour.deleteMany({});
  await prisma.hospital.deleteMany({});
  
  // Delete hospital types to fix duplications
  await prisma.hospitalType.deleteMany({});

  console.log('All hospitals and types deleted.');
}

clear()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
