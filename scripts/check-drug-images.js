const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 فحص صور الأدوية...\n');
  
  // جلب بعض الأدوية مع صورها
  const drugs = await prisma.drug.findMany({
    take: 10,
    select: { id: true, nameAr: true, image: true, legacyId: true }
  });
  
  console.log('عينة من الأدوية:');
  for (const drug of drugs) {
    const imagePath = drug.image;
    let exists = false;
    
    if (imagePath && imagePath.startsWith('/images/')) {
      const fullPath = path.join(__dirname, '../public', imagePath);
      exists = fs.existsSync(fullPath);
    }
    
    console.log(`  ID: ${drug.id}, Legacy: ${drug.legacyId}, صورة: ${drug.image}, موجودة: ${exists ? '✅' : '❌'}`);
  }
  
  // إحصائيات
  const total = await prisma.drug.count();
  const withImages = await prisma.drug.count({ where: { image: { not: null } } });
  
  console.log(`\n📊 إحصائيات:`);
  console.log(`  إجمالي الأدوية: ${total}`);
  console.log(`  مع صور: ${withImages}`);
  
  // فحص الصور الموجودة فعلياً
  const drugsDir = path.join(__dirname, '../public/images/drugs');
  const files = fs.readdirSync(drugsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`  ملفات الصور الموجودة: ${files.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
