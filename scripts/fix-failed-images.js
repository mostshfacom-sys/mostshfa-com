const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// صور افتراضية حسب التصنيف
const DEFAULT_IMAGES = {
  'صحة': '/images/articles/default-health.jpg',
  'طب': '/images/articles/default-medical.jpg',
  'تغذية': '/images/articles/default-nutrition.jpg',
  'default': '/images/articles/default-article.jpg'
};

async function main() {
  console.log('🔧 إصلاح المقالات بدون صور...\n');
  
  // جلب المقالات التي لا تزال تحتوي على روابط خارجية أو بدون صور
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { image: { contains: 'mostshfa.com' } },
        { image: null },
        { image: '' }
      ]
    },
    include: {
      category: true
    }
  });
  
  console.log(`📊 عدد المقالات للإصلاح: ${articles.length}\n`);
  
  for (const article of articles) {
    // تحديد الصورة الافتراضية
    let defaultImage = DEFAULT_IMAGES.default;
    
    if (article.category && article.category.name) {
      const catName = article.category.name.toLowerCase();
      if (catName.includes('صحة')) defaultImage = DEFAULT_IMAGES['صحة'];
      else if (catName.includes('طب')) defaultImage = DEFAULT_IMAGES['طب'];
      else if (catName.includes('تغذية')) defaultImage = DEFAULT_IMAGES['تغذية'];
    }
    
    await prisma.article.update({
      where: { id: article.id },
      data: { image: defaultImage }
    });
    
    console.log(`✅ [${article.id}] ${article.title.substring(0, 50)}...`);
  }
  
  console.log('\n✅ تم إصلاح جميع المقالات!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
