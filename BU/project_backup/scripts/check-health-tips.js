const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkHealthTips() {
  try {
    const tipsCount = await prisma.healthTip.count();
    const categoriesCount = await prisma.articleCategory.count();

    console.log('Health tips count:', tipsCount);
    console.log('Article categories count:', categoriesCount);

    const samples = await prisma.healthTip.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titleAr: true,
        contentAr: true,
        icon: true,
        categoryId: true,
        createdAt: true,
      },
    });

    console.log('Latest tips sample:');
    console.log(JSON.stringify(samples, null, 2));

    const outputPath = path.join(__dirname, 'health-tips-sample.json');
    fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2), 'utf8');
    console.log(`Saved sample to ${outputPath}`);
  } catch (error) {
    console.error('Error checking health tips:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHealthTips();
