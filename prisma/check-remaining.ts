
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultUsageCount = await prisma.drug.count({
    where: {
      usage: { startsWith: 'يستخدم لعلاج الحالات المرتبطة بـ' }
    }
  });

  const missingCompanyCount = await prisma.drug.count({
    where: { company: null }
  });

  console.log(`Drugs with Default Usage: ${defaultUsageCount}`);
  console.log(`Drugs Missing Company: ${missingCompanyCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
