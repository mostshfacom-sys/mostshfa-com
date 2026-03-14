import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DEBUG: Checking Data Persistence for New Fields ---');

  // Check drugs that have 'barcode' or 'company' set (which means they were updated/created recently)
  const updatedDrugs = await prisma.drug.findMany({
    where: {
      OR: [
        { barcode: { not: null } },
        { company: { not: null } },
        { oldPrice: { not: null } }
      ]
    },
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`Found ${updatedDrugs.length} drugs with new fields populated.`);

  if (updatedDrugs.length > 0) {
    console.log('--- Sample Updated Drug ---');
    const sample = updatedDrugs[0];
    console.log(`Name: ${sample.nameEn} (${sample.nameAr})`);
    console.log(`Price: ${sample.priceText}`);
    console.log(`Old Price: ${sample.oldPrice || 'N/A'}`);
    console.log(`Unit Price: ${sample.unitPrice || 'N/A'}`);
    console.log(`Barcode: ${sample.barcode || 'N/A'}`);
    console.log(`Company: ${sample.company || 'N/A'}`);
    console.log(`Last Updated: ${sample.lastUpdatedPrice || 'N/A'}`);
    console.log(`Usage (Snippet): ${sample.usage?.substring(0, 50)}...`);
  } else {
    console.log('WARNING: No drugs found with the new fields yet. The update script might still be processing initial batches or encountering errors.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
