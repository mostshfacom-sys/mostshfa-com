/**
 * سكريبت لإعادة ضبط صور الأدوية
 * يمسح جميع الصور المحملة ويعيد الأدوية للصورة الافتراضية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// الصورة الافتراضية للأدوية
const DEFAULT_DRUG_IMAGE = '/images/defaults/drug.svg';

async function resetDrugImages() {
  console.log('='.repeat(50));
  console.log('إعادة ضبط صور الأدوية');
  console.log('='.repeat(50));
  console.log('');
  
  try {
    // عد الأدوية الحالية
    const totalDrugs = await prisma.drug.count();
    console.log(`إجمالي الأدوية في قاعدة البيانات: ${totalDrugs}`);
    
    // عد الأدوية التي لديها صور غير افتراضية
    const drugsWithCustomImages = await prisma.drug.count({
      where: {
        AND: [
          { image: { not: null } },
          { image: { not: DEFAULT_DRUG_IMAGE } },
          { image: { not: '' } }
        ]
      }
    });
    console.log(`الأدوية بصور مخصصة: ${drugsWithCustomImages}`);
    
    console.log('');
    console.log('جاري إعادة ضبط جميع الصور للصورة الافتراضية...');
    
    // تحديث جميع الأدوية للصورة الافتراضية
    const result = await prisma.drug.updateMany({
      data: {
        image: DEFAULT_DRUG_IMAGE
      }
    });
    
    console.log('');
    console.log('='.repeat(50));
    console.log('تم بنجاح!');
    console.log(`تم تحديث ${result.count} دواء للصورة الافتراضية`);
    console.log(`الصورة الافتراضية: ${DEFAULT_DRUG_IMAGE}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
resetDrugImages();
