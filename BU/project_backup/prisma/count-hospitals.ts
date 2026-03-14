
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.hospital.count();
  console.log('HOSPITAL_COUNT:' + count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
