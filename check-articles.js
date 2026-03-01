const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const articles = await prisma.article.findMany({
      take: 5,
      select: { id: true, title: true, slug: true, isPublished: true }
    });
    console.log('Articles found:', articles.length);
    console.log(JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
