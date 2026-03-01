const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const drugs = await prisma.drug.findMany({
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      image: true,
      category: {
        select: { name: true }
      }
    },
    take: 100
  });
  
  console.log('=== الأدوية الموجودة ===\n');
  drugs.forEach(d => {
    const cat = d.category ? d.category.name : 'N/A';
    const img = d.image || 'لا توجد';
    console.log('ID: ' + d.id + ' | ' + d.nameAr + ' | ' + (d.nameEn || 'N/A') + ' | صنف: ' + cat);
    console.log('   صورة: ' + img);
    console.log('---');
  });
  
  const total = await prisma.drug.count();
  console.log('\nإجمالي الأدوية: ' + total);
  
  const categories = await prisma.drugCategory.findMany();
  console.log('\n=== أصناف الأدوية ===');
  categories.forEach(c => console.log(c.id + ': ' + c.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
