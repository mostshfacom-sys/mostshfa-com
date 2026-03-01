const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDrugImages() {
  console.log('=== التحقق من صور الأدوية ===\n');
  
  // إحصائيات الصور
  const stats = await prisma.drug.groupBy({
    by: ['image'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20
  });
  
  console.log('أكثر الصور استخداماً:');
  for (const stat of stats) {
    console.log(`${stat._count.id} دواء: ${stat.image}`);
  }
  
  // عينة من الأدوية بصور مختلفة
  console.log('\n=== عينة من الأدوية ===');
  const samples = await prisma.drug.findMany({
    where: {
      NOT: { image: '/images/defaults/drug.svg' }
    },
    take: 20,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      image: true
    }
  });
  
  for (const drug of samples) {
    console.log(`ID: ${drug.id} | ${drug.nameAr || drug.nameEn}`);
    console.log(`   صورة: ${drug.image}`);
    console.log('---');
  }
}

verifyDrugImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
