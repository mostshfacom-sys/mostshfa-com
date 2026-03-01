import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function snapshot() {
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
  const t = new Date().toLocaleTimeString();
  console.log(`[${t}] Total:${total} Phones:${withPhone}(${pct(withPhone)}%) Websites:${withWebsite}(${pct(withWebsite)}%) Descriptions:${withDesc}(${pct(withDesc)}%) Logos:${withLogo}(${pct(withLogo)}%) Contact:${withContact}(${pct(withContact)}%)`);
}

async function main() {
  while (true) {
    try {
      await snapshot();
      await new Promise(r => setTimeout(r, 30000));
    } catch {
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

main();

