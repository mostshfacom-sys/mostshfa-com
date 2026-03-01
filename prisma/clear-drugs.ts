
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing drugs data...');
  
  // Delete all drugs
  await prisma.drug.deleteMany({});
  console.log('Drugs cleared.');
  
  // Delete all drug categories
  await prisma.drugCategory.deleteMany({});
  console.log('Drug categories cleared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
