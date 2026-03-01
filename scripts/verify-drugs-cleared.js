const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDrugsCleared() {
  console.log('🔍 التحقق من حالة قاعدة البيانات بعد مسح الأدوية...\n');
  
  try {
    // 1. فحص عدد الأدوية
    const drugsCount = await prisma.drug.count();
    console.log(`📊 عدد الأدوية الحالي: ${drugsCount}`);
    
    // 2. فحص عدد أصناف الأدوية
    const categoriesCount = await prisma.drugCategory.count();
    console.log(`📊 عدد أصناف الأدوية الحالي: ${categoriesCount}`);
    
    // 3. فحص بنية الجداول
    console.log('\n🏗️ فحص بنية الجداول:');
    
    // فحص جدول الأدوية
    try {
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='drugs'`;
      console.log('   ✅ جدول الأدوية (drugs) موجود');
    } catch (error) {
      console.log('   ❌ جدول الأدوية غير موجود');
    }
    
    // فحص جدول أصناف الأدوية
    try {
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='drug_categories'`;
      console.log('   ✅ جدول أصناف الأدوية (drug_categories) موجود');
    } catch (error) {
      console.log('   ❌ جدول أصناف الأدوية غير موجود');
    }
    
    // 4. فحص الفهارس
    console.log('\n📇 فحص الفهارس:');
    const indexes = await prisma.$queryRaw`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type='index' 
      AND tbl_name IN ('drugs', 'drug_categories')
      AND name NOT LIKE 'sqlite_%'
    `;
    
    if (indexes.length > 0) {
      indexes.forEach(idx => {
        console.log(`   ✅ فهرس: ${idx.name} على جدول ${idx.tbl_name}`);
      });
    } else {
      console.log('   📝 لا توجد فهارس مخصصة');
    }
    
    // 5. اختبار إدراج بيانات تجريبية
    console.log('\n🧪 اختبار إدراج بيانات تجريبية...');
    
    try {
      // إنشاء صنف تجريبي
      const testCategory = await prisma.drugCategory.create({
        data: {
          name: 'صنف تجريبي'
        }
      });
      console.log(`   ✅ تم إنشاء صنف تجريبي بمعرف: ${testCategory.id}`);
      
      // إنشاء دواء تجريبي
      const testDrug = await prisma.drug.create({
        data: {
          nameAr: 'دواء تجريبي',
          slug: 'test-drug-' + Date.now(),
          categoryId: testCategory.id
        }
      });
      console.log(`   ✅ تم إنشاء دواء تجريبي بمعرف: ${testDrug.id}`);
      
      // مسح البيانات التجريبية
      await prisma.drug.delete({ where: { id: testDrug.id } });
      await prisma.drugCategory.delete({ where: { id: testCategory.id } });
      console.log('   ✅ تم مسح البيانات التجريبية');
      
    } catch (error) {
      console.log('   ❌ فشل في اختبار إدراج البيانات:', error.message);
    }
    
    // 6. النتيجة النهائية
    console.log('\n📋 ملخص الحالة:');
    if (drugsCount === 0 && categoriesCount === 0) {
      console.log('✅ تم مسح جميع بيانات الأدوية بنجاح');
      console.log('✅ الجداول محفوظة وجاهزة لإدخال بيانات جديدة');
      console.log('✅ يمكن الآن ملء قاعدة البيانات ببيانات جديدة');
    } else {
      console.log('⚠️ لا تزال هناك بيانات في قاعدة البيانات:');
      if (drugsCount > 0) console.log(`   - ${drugsCount} دواء`);
      if (categoriesCount > 0) console.log(`   - ${categoriesCount} صنف`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من حالة قاعدة البيانات:', error);
    throw error;
  }
}

async function main() {
  try {
    await verifyDrugsCleared();
  } catch (error) {
    console.error('❌ فشل في التحقق:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { verifyDrugsCleared };