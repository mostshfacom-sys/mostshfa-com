const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// مسار مجلد صور الأدوية
const DRUGS_IMAGES_DIR = path.join(__dirname, '../public/images/drugs');
const DEFAULT_DRUG_IMAGE = '/images/defaults/drug.svg';

async function restoreDrugImages() {
  console.log('=== استعادة صور الأدوية الأصلية ===\n');
  
  // 1. قراءة الصور الموجودة في المجلد
  console.log('1. قراءة الصور الموجودة في المجلد...');
  const existingImages = new Set();
  
  try {
    const files = fs.readdirSync(DRUGS_IMAGES_DIR);
    files.forEach(file => {
      // استخراج رقم الصورة من اسم الملف (مثل 1.jpg -> 1)
      const match = file.match(/^(\d+)\.(jpg|jpeg|png|gif|webp)$/i);
      if (match) {
        existingImages.add(parseInt(match[1]));
      }
    });
    console.log(`   تم العثور على ${existingImages.size} صورة في المجلد\n`);
  } catch (error) {
    console.error('خطأ في قراءة مجلد الصور:', error);
    return;
  }
  
  // 2. جلب جميع الأدوية
  console.log('2. جلب الأدوية من قاعدة البيانات...');
  const drugs = await prisma.drug.findMany({
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      image: true
    }
  });
  console.log(`   إجمالي الأدوية: ${drugs.length}\n`);
  
  // 3. تحديث الصور
  console.log('3. تحديث صور الأدوية...');
  let withOriginalImage = 0;
  let withDefaultImage = 0;
  let updated = 0;
  
  for (const drug of drugs) {
    let newImage;
    
    // التحقق إذا كانت هناك صورة أصلية لهذا الدواء
    if (existingImages.has(drug.id)) {
      // استخدام الصورة الأصلية
      newImage = `/images/drugs/${drug.id}.jpg`;
      withOriginalImage++;
    } else {
      // استخدام الصورة الافتراضية
      newImage = DEFAULT_DRUG_IMAGE;
      withDefaultImage++;
    }
    
    // تحديث فقط إذا كانت الصورة مختلفة
    if (drug.image !== newImage) {
      await prisma.drug.update({
        where: { id: drug.id },
        data: { image: newImage }
      });
      updated++;
    }
    
    // طباعة التقدم كل 1000 دواء
    if ((withOriginalImage + withDefaultImage) % 1000 === 0) {
      console.log(`   تم معالجة ${withOriginalImage + withDefaultImage} دواء...`);
    }
  }
  
  // 4. طباعة الملخص
  console.log('\n=== ملخص التحديث ===');
  console.log(`إجمالي الأدوية: ${drugs.length}`);
  console.log(`أدوية بصور أصلية: ${withOriginalImage}`);
  console.log(`أدوية بصورة افتراضية: ${withDefaultImage}`);
  console.log(`تم تحديث: ${updated} دواء`);
  
  // 5. عرض بعض الأمثلة
  console.log('\n=== أمثلة على الأدوية بصور أصلية ===');
  const samplesWithImages = drugs
    .filter(d => existingImages.has(d.id))
    .slice(0, 10);
  
  for (const drug of samplesWithImages) {
    console.log(`ID: ${drug.id} | ${drug.nameAr || drug.nameEn} | صورة: /images/drugs/${drug.id}.jpg`);
  }
}

// تشغيل السكريبت
restoreDrugImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
