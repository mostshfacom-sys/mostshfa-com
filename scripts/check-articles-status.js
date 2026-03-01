const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📊 فحص حالة المقالات...\n');
  
  // عدد المقالات
  const count = await prisma.article.count();
  console.log(`إجمالي المقالات: ${count}`);
  
  // عينة من المقالات
  const articles = await prisma.article.findMany({
    take: 5,
    select: {
      id: true,
      title: true,
      image: true,
      slug: true
    }
  });
  
  console.log('\nعينة من المقالات:');
  articles.forEach(a => {
    console.log(`  - [${a.id}] ${a.title}`);
    console.log(`    الصورة: ${a.image || 'لا توجد'}`);
  });
  
  // إحصائيات الصور
  const withImages = await prisma.article.count({
    where: {
      image: {
        not: null
      }
    }
  });
  
  const withoutImages = count - withImages;
  
  console.log(`\n📸 إحصائيات الصور:`);
  console.log(`  - مقالات مع صور: ${withImages}`);
  console.log(`  - مقالات بدون صور: ${withoutImages}`);
  
  // التصنيفات
  const categories = await prisma.articleCategory.count();
  console.log(`\n📁 التصنيفات: ${categories}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
