import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing ALL Pharmacy data...');
  try {
    const deleted = await prisma.pharmacy.deleteMany();
    console.log(`✅ Deleted ${deleted.count} pharmacies.`);
  } catch (e) {
    console.error('❌ Error clearing pharmacies:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();