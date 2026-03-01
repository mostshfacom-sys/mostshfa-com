import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of drugs without prices...');

  // Count before deletion
  const totalCount = await prisma.drug.count();
  const pricelessCount = await prisma.drug.count({
    where: {
      OR: [
        { priceText: null },
        { priceText: '' },
        { priceText: '0 ج.م' },
        { priceText: '0.00 ج.م' },
        { priceText: '0' },
      ]
    }
  });

  console.log(`Total drugs: ${totalCount}`);
  console.log(`Drugs without price to delete: ${pricelessCount}`);

  if (pricelessCount > 0) {
    const deleted = await prisma.drug.deleteMany({
      where: {
        OR: [
          { priceText: null },
          { priceText: '' },
          { priceText: '0 ج.م' },
          { priceText: '0.00 ج.م' },
          { priceText: '0' },
        ]
      }
    });

    console.log(`Successfully deleted ${deleted.count} drugs.`);
  } else {
    console.log('No drugs to delete.');
  }

  // Verify
  const newCount = await prisma.drug.count();
  console.log(`New total drugs count: ${newCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
