
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DEBUG: Finding fully populated drug ---');
  
  // Find a drug that has at least one of the new fields
  const updatedDrugs = await prisma.drug.findMany({
    where: {
      OR: [
        { barcode: { not: null } },
        { oldPrice: { not: null } },
        { unitPrice: { not: null } }
      ]
    },
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });

  if (updatedDrugs.length === 0) {
    console.log('No updated drugs found yet.');
  } else {
    console.log(`Found ${updatedDrugs.length} updated drugs.`);
    updatedDrugs.forEach(drug => {
      console.log(`\n--- Drug: ${drug.nameAr} (${drug.slug}) ---`);
      console.log(`Price: ${drug.priceText}`);
      console.log(`Old Price: ${drug.oldPrice || 'N/A'}`);
      console.log(`Barcode: ${drug.barcode || 'N/A'}`);
      console.log(`Company: ${drug.company || 'N/A'}`);
      console.log(`Unit Price: ${drug.unitPrice || 'N/A'}`);
      console.log(`Last Updated: ${drug.lastUpdatedPrice || 'N/A'}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
