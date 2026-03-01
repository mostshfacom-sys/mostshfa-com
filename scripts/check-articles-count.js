const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const count = await prisma.article.count();
    console.log('Total articles:', count);
    
    const published = await prisma.article.count({ where: { isPublished: true } });
    console.log('Published articles:', published);
    
    const sample = await prisma.article.findFirst({
      select: { id: true, title: true, slug: true, isPublished: true }
    });
    console.log('Sample article:', sample);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
