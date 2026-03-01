const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 فحص صور المستشفيات...\n');
  
  // جلب بعض المستشفيات مع صورها
  const hospitals = await prisma.hospital.findMany({
    take: 20,
    select: { id: true, nameAr: true, logo: true }
  });
  
  console.log('عينة من المستشفيات:');
  for (const h of hospitals) {
    const imagePath = h.logo;
    let exists = false;
    
    if (imagePath && imagePath.startsWith('/images/')) {
      const fullPath = path.join(__dirname, '../public', imagePath);
      exists = fs.existsSync(fullPath);
    } else if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      exists = true; // روابط خارجية
    }
    
    console.log(`  ID: ${h.id}, اسم: ${h.nameAr?.substring(0, 30)}, صورة: ${h.logo?.substring(0, 50) || 'لا يوجد'}, موجودة: ${exists ? '✅' : '❌'}`);
  }
  
  // إحصائيات
  const total = await prisma.hospital.count();
  const withLogo = await prisma.hospital.count({ where: { logo: { not: null } } });
  const withDefault = await prisma.hospital.count({ where: { logo: { contains: 'defaults' } } });
  
  console.log(`\n📊 إحصائيات:`);
  console.log(`  إجمالي المستشفيات: ${total}`);
  console.log(`  مع صور: ${withLogo}`);
  console.log(`  بصور افتراضية: ${withDefault}`);
  console.log(`  بصور حقيقية: ${withLogo - withDefault}`);
  
  // فحص الصور الموجودة فعلياً
  const hospitalsDir = path.join(__dirname, '../public/images/hospitals');
  if (fs.existsSync(hospitalsDir)) {
    const files = fs.readdirSync(hospitalsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    console.log(`  ملفات الصور الموجودة: ${files.length}`);
    console.log(`  أمثلة: ${files.slice(0, 5).join(', ')}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
