import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.pharmacy.count();
  const withPhone = await prisma.pharmacy.count({ where: { phone: { not: null }, AND: [{ phone: { not: '' } }] } });
  const withWebsite = await prisma.pharmacy.count({ where: { website: { not: null }, AND: [{ website: { not: '' } }] } });
  const withDelivery = await prisma.pharmacy.count({ where: { hasDeliveryService: true } });
  const withNursing = await prisma.pharmacy.count({ where: { hasNursingService: true } });
  const is24h = await prisma.pharmacy.count({ where: { is24h: true } });
  const withLogo = await prisma.pharmacy.count({ where: { logo: { not: null }, AND: [{ logo: { not: '' } }] } });

  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

  console.log(`\n--- Pharmacy Stats ---`);
  console.log(`Total: ${total}`);
  console.log(`Phones: ${withPhone} (${pct(withPhone)}%)`);
  console.log(`Websites: ${withWebsite} (${pct(withWebsite)}%)`);
  console.log(`Delivery: ${withDelivery} (${pct(withDelivery)}%)`);
  console.log(`Nursing: ${withNursing} (${pct(withNursing)}%)`);
  console.log(`24/7: ${is24h} (${pct(is24h)}%)`);
  console.log(`Logos: ${withLogo} (${pct(withLogo)}%)`);
  console.log('----------------------\n');

  await prisma.$disconnect();
}

main();
