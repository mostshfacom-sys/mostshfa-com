
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalDrugs = await prisma.drug.count();
  
  const drugsWithCompany = await prisma.drug.count({
    where: { company: { not: null } }
  });

  const drugsWithUsage = await prisma.drug.count({
    where: { usage: { not: null } }
  });

  const recentUpdates = await prisma.drug.count({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // Updated in last 10 minutes
      }
    }
  });

  const lastUpdatedDrug = await prisma.drug.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { nameAr: true, updatedAt: true }
  });

  console.log(`--- Progress Report ---`);
  console.log(`Total Drugs: ${totalDrugs}`);
  console.log(`Drugs with Company: ${drugsWithCompany}`);
  console.log(`Drugs with Usage: ${drugsWithUsage}`);
  console.log(`Drugs Updated in Last 10 Mins: ${recentUpdates}`);
  console.log(`Last Update Time: ${lastUpdatedDrug?.updatedAt}`);
  console.log(`Last Updated Drug: ${lastUpdatedDrug?.nameAr}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
