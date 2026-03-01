import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeData() {
  console.log('Wiping Hospital and WorkingHour data...');
  try {
    // Delete WorkingHour first (though cascade should handle it, explicit is safer)
    await prisma.workingHour.deleteMany({});
    console.log('Deleted all WorkingHour records.');

    // Delete Hospitals
    await prisma.hospital.deleteMany({});
    console.log('Deleted all Hospital records.');
    
    console.log('Database wiped successfully.');
  } catch (e) {
    console.error('Error wiping data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
