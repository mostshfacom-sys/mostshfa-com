require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const targetFields = ['company', 'barcode', 'units', 'lastUpdatedPrice', 'oldPrice'];

  const total = await prisma.drug.count();
  const legacyTotal = await prisma.drug.count({ where: { legacyId: { not: null } } });

  const missingAny = await prisma.drug.count({
    where: {
      OR: targetFields.map((f) => ({ [f]: null })).concat(targetFields.map((f) => ({ [f]: '' }))),
    },
  });

  const missingAnyWithLegacy = await prisma.drug.count({
    where: {
      legacyId: { not: null },
      OR: targetFields.map((f) => ({ [f]: null })).concat(targetFields.map((f) => ({ [f]: '' }))),
    },
  });

  // Also check specifically barcode-missing with legacyId
  const barcodeMissingWithLegacy = await prisma.drug.count({
    where: {
      legacyId: { not: null },
      OR: [{ barcode: null }, { barcode: '' }],
    },
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        total,
        legacyTotal,
        missingAny,
        missingAnyWithLegacy,
        barcodeMissingWithLegacy,
      },
      null,
      2
    )}\n`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });
