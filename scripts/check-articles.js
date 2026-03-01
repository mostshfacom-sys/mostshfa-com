const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArticles() {
  console.log('=== Articles in Database ===\n');
  
  try {
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true
      }
    });
    
    console.log('Total articles:', articles.length);
    console.log('\nArticles:');
    articles.forEach(a => {
      console.log(`- ID: ${a.id}, Slug: "${a.slug}", Published: ${a.isPublished}`);
      console.log(`  Title: ${a.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticles();
