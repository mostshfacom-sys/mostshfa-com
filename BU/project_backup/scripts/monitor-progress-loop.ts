
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitor() {
  console.log('Monitoring database updates...');
  console.log('Press Ctrl+C to stop monitoring.');
  
  let lastCount = 0;
  let lastImages = 0;

  while (true) {
    try {
      const count = await prisma.hospital.count();
      const images = await prisma.hospital.count({ where: { logo: { not: null } } });
      
      const deltaCount = count - lastCount;
      const deltaImages = images - lastImages;

      console.log(`[${new Date().toLocaleTimeString()}] Hospitals: ${count} (+${deltaCount}), With Images: ${images} (+${deltaImages})`);
      
      lastCount = count;
      lastImages = images;

      await new Promise(r => setTimeout(r, 10000)); // Check every 10 seconds
    } catch (e) {
      console.error('Error monitoring:', e);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

monitor();
