const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHealthTips() {
  const count = await prisma.healthTip.count();
  console.log('Health Tips count:', count);
  
  if (count > 0) {
    const categories = await prisma.articleCategory.findMany({ 
      select: { id: true, nameAr: true, slug: true } 
    });
    console.log('Categories:', categories);
    
    const sample = await prisma.healthTip.findMany({ 
      take: 10,
      include: { category: { select: { nameAr: true, slug: true } } }
    });
    console.log('Sample tips:', sample.map(t => ({ 
      id: t.id, 
      titleAr: t.titleAr, 
      category: t.category?.nameAr,
      categoryId: t.categoryId
    })));
  }
  
  await prisma.$disconnect();
}

checkHealthTips().catch(console.error);
