
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitor() {
  console.log('Monitoring database updates...');
  
  for (let i = 0; i < 6; i++) {
    const count = await prisma.hospital.count();
    const images = await prisma.hospital.count({ where: { logo: { not: null } } });
    console.log(`[${new Date().toLocaleTimeString()}] Hospitals: ${count}, With Images: ${images}`);
    await new Promise(r => setTimeout(r, 5000));
  }
  
  await prisma.$disconnect();
}

monitor();
