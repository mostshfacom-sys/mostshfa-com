require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const fields = [
    'company',
    'barcode',
    'units',
    'lastUpdatedPrice',
    'activeIngredient',
    'priceText',
    'oldPrice',
    'unitPrice',
    'usage',
    'dosage',
    'contraindications',
  ];

  const total = await prisma.drug.count();
  const results = { total };

  for (const field of fields) {
    const missing = await prisma.drug.count({
      where: {
        OR: [{ [field]: null }, { [field]: '' }],
      },
    });

    results[field] = {
      missing,
      filled: total - missing,
      fillPct: total ? Math.round(((total - missing) / total) * 10000) / 100 : 0,
    };
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });
