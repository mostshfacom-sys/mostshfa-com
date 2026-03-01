import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.hospital.count();
  const withPhone = await prisma.hospital.count({ where: { phone: { not: null }, AND: [{ phone: { not: '' } }] } });
  const withWebsite = await prisma.hospital.count({ where: { website: { not: null }, AND: [{ website: { not: '' } }] } });
  const withDesc = await prisma.hospital.count({ where: { description: { not: null }, AND: [{ description: { not: '' } }] } });
  const withLogo = await prisma.hospital.count({ where: { logo: { not: null }, AND: [{ logo: { not: '' } }] } });
  const withContact = await prisma.hospital.count({
    where: {
      OR: [
        { phone: { not: null }, AND: [{ phone: { not: '' } }] },
        { website: { not: null }, AND: [{ website: { not: '' } }] }
      ]
    }
  });

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : '0.0');

  console.log(`Total: ${total}`);
  console.log(`Phones: ${withPhone} (${pct(withPhone)}%)`);
  console.log(`Websites: ${withWebsite} (${pct(withWebsite)}%)`);
  console.log(`Descriptions: ${withDesc} (${pct(withDesc)}%)`);
  console.log(`Logos: ${withLogo} (${pct(withLogo)}%)`);
  console.log(`Any Contact (phone|site): ${withContact} (${pct(withContact)}%)`);

  await prisma.$disconnect();
}

main();
