const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const types = await prisma.hospitalType.findMany();
    console.log('--- HOSPITAL_TYPES_START ---');
    console.log(JSON.stringify(types, null, 2));
    console.log('--- HOSPITAL_TYPES_END ---');

    const govs = await prisma.governorate.findMany({
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        cities: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true
          }
        }
      }
    });
    console.log('--- GOVERNORATES_START ---');
    console.log(JSON.stringify(govs, null, 2));
    console.log('--- GOVERNORATES_END ---');
  } catch (error) {
    console.error('Error fetching database metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
