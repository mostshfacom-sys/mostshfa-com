const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 تنظيف المقالات التجريبية...\n');
  
  // حذف المقالات التجريبية (التي تحتوي على عناوين غير منطقية)
  const testPatterns = [
    'تجريبي',
    'ههههه',
    'ثقثق',
    'لبيست',
    'ثثفق'
  ];
  
  for (const pattern of testPatterns) {
    const deleted = await prisma.article.deleteMany({
      where: {
        title: {
          contains: pattern
        }
      }
    });
    
    if (deleted.count > 0) {
      console.log(`🗑️ تم حذف ${deleted.count} مقال يحتوي على "${pattern}"`);
    }
  }
  
  // إحصائيات نهائية
  const count = await prisma.article.count();
  const withImages = await prisma.article.count({
    where: {
      image: {
        startsWith: '/images/'
      }
    }
  });
  
  console.log('\n============================================================');
  console.log('📊 الإحصائيات النهائية:');
  console.log('============================================================');
  console.log(`📝 إجمالي المقالات: ${count}`);
  console.log(`🖼️ مقالات مع صور محلية: ${withImages}`);
  console.log(`📁 التصنيفات: ${await prisma.articleCategory.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
