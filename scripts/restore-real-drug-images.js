const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreRealDrugImages() {
  console.log('=== استعادة صور الأدوية الحقيقية ===\n');
  
  // قراءة الصور الموجودة في مجلد drugs
  const drugsImagesDir = path.join(__dirname, '../public/images/drugs');
  
  if (!fs.existsSync(drugsImagesDir)) {
    console.error('مجلد الصور غير موجود:', drugsImagesDir);
    return;
  }
  
  // جلب قائمة الصور الموجودة
  const imageFiles = fs.readdirSync(drugsImagesDir)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.webp'))
    .filter(f => !f.startsWith('no_image'));
  
  console.log('عدد الصور الموجودة في المجلد:', imageFiles.length);
  
  // إنشاء خريطة للصور (ID -> اسم الملف)
  const imageMap = new Map();
  for (const file of imageFiles) {
    // استخراج الـ ID من اسم الملف (مثل 1.jpg -> 1)
    const id = parseInt(path.basename(file, path.extname(file)));
    if (!isNaN(id)) {
      imageMap.set(id, `/images/drugs/${file}`);
    }
  }
  
  console.log('عدد الصور المرتبطة بـ IDs:', imageMap.size);
  console.log('\nأمثلة على الصور:');
  let count = 0;
  for (const [id, imagePath] of imageMap) {
    if (count < 10) {
      console.log(`  ID ${id}: ${imagePath}`);
      count++;
    }
  }
  
  // جلب جميع الأدوية
  const drugs = await prisma.drug.findMany({
    select: { id: true, nameAr: true, image: true }
  });
  
  console.log('\nإجمالي الأدوية في قاعدة البيانات:', drugs.length);
  
  let updated = 0;
  let notFound = 0;
  let alreadyCorrect = 0;
  
  // تحديث كل دواء له صورة حقيقية
  for (const drug of drugs) {
    const realImagePath = imageMap.get(drug.id);
    
    if (realImagePath) {
      // يوجد صورة حقيقية لهذا الدواء
      if (drug.image !== realImagePath) {
        await prisma.drug.update({
          where: { id: drug.id },
          data: { image: realImagePath }
        });
        updated++;
        
        if (updated <= 5) {
          console.log(`تحديث: ${drug.nameAr} -> ${realImagePath}`);
        }
      } else {
        alreadyCorrect++;
      }
    } else {
      // لا توجد صورة حقيقية - استخدام الصورة الافتراضية
      if (!drug.image || !drug.image.startsWith('/images/defaults/')) {
        await prisma.drug.update({
          where: { id: drug.id },
          data: { image: '/images/defaults/drug.svg' }
        });
      }
      notFound++;
    }
    
    if ((updated + notFound + alreadyCorrect) % 5000 === 0) {
      console.log(`تقدم: ${updated + notFound + alreadyCorrect} / ${drugs.length}`);
    }
  }
  
  console.log('\n=== ملخص التحديث ===');
  console.log('تم تحديث:', updated, 'دواء بصور حقيقية');
  console.log('صحيحة مسبقاً:', alreadyCorrect, 'دواء');
  console.log('بدون صور حقيقية:', notFound, 'دواء (ستستخدم الصورة الافتراضية)');
  
  // التحقق النهائي
  const realImagesCount = await prisma.drug.count({
    where: { image: { startsWith: '/images/drugs/' } }
  });
  
  const defaultImagesCount = await prisma.drug.count({
    where: { image: { startsWith: '/images/defaults/' } }
  });
  
  console.log('\n=== الحالة النهائية ===');
  console.log('أدوية بصور حقيقية:', realImagesCount);
  console.log('أدوية بصور افتراضية:', defaultImagesCount);
}

restoreRealDrugImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
