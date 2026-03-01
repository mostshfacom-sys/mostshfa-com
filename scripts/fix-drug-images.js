const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// قاموس صور الأدوية الصحيحة حسب الفئة/النوع
// سنستخدم صور من مصادر موثوقة ومجانية
const drugCategoryImages = {
  // أدوية الأطفال والشراب
  'syrup': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'شراب': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  
  // الأقراص والكبسولات
  'tablet': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400',
  'tab': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400',
  'قرص': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400',
  'capsule': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
  'caps': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
  'كبسول': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
  
  // الحقن والأمبولات
  'injection': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  'vial': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  'amp': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  'امبول': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  'فيال': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  
  // الكريمات والمراهم
  'cream': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'ointment': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'gel': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'كريم': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'مرهم': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'جل': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  
  // قطرات العين والأذن
  'drops': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  'eye': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  'نقط': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  'قطرة': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  
  // التحاميل
  'supp': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
  'لبوس': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
  'اقماع': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
  
  // الأكياس والفوار
  'sachet': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
  'effervescent': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
  'كيس': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
  'فوار': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
  
  // اللوشن والمحاليل
  'lotion': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  'solution': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  'لوشن': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  'محلول': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  
  // الشامبو
  'shampoo': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
  'شامبو': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
  
  // المعلق
  'susp': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'معلق': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  
  // الفيتامينات
  'vitamin': 'https://images.unsplash.com/photo-1550572017-4e6d8f0e8e0a?w=400',
  'فيتامين': 'https://images.unsplash.com/photo-1550572017-4e6d8f0e8e0a?w=400',
  
  // الصورة الافتراضية
  'default': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'
};

// دالة لتحديد نوع الدواء من اسمه
function getDrugType(nameAr, nameEn) {
  const combinedName = ((nameAr || '') + ' ' + (nameEn || '')).toLowerCase();
  
  // البحث عن الكلمات المفتاحية
  for (const [keyword, imageUrl] of Object.entries(drugCategoryImages)) {
    if (keyword !== 'default' && combinedName.includes(keyword.toLowerCase())) {
      return imageUrl;
    }
  }
  
  return drugCategoryImages.default;
}

async function updateDrugImages() {
  console.log('بدء تحديث صور الأدوية...\n');
  
  // جلب جميع الأدوية
  const drugs = await prisma.drug.findMany({
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      image: true
    }
  });
  
  console.log('إجمالي الأدوية: ' + drugs.length);
  
  let updated = 0;
  let skipped = 0;
  
  // تحديث كل دواء
  for (const drug of drugs) {
    // تحديد الصورة المناسبة
    const newImage = getDrugType(drug.nameAr, drug.nameEn);
    
    // تحديث الصورة في قاعدة البيانات
    await prisma.drug.update({
      where: { id: drug.id },
      data: { image: newImage }
    });
    
    updated++;
    
    if (updated % 1000 === 0) {
      console.log('تم تحديث ' + updated + ' دواء...');
    }
  }
  
  console.log('\n=== ملخص التحديث ===');
  console.log('تم تحديث: ' + updated + ' دواء');
  console.log('تم التخطي: ' + skipped + ' دواء');
}

// تشغيل السكريبت
updateDrugImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
