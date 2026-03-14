const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDrugsData() {
  console.log('🧹 بدء عملية مسح بيانات الأدوية...\n');
  
  try {
    // 1. عرض الإحصائيات الحالية
    const currentDrugsCount = await prisma.drug.count();
    const currentCategoriesCount = await prisma.drugCategory.count();
    
    console.log(`📊 الإحصائيات الحالية:`);
    console.log(`   - عدد الأدوية: ${currentDrugsCount}`);
    console.log(`   - عدد أصناف الأدوية: ${currentCategoriesCount}\n`);
    
    if (currentDrugsCount === 0 && currentCategoriesCount === 0) {
      console.log('✅ لا توجد بيانات أدوية لمسحها');
      return;
    }
    
    // 2. مسح الأدوية أولاً (بسبب العلاقة مع الأصناف)
    if (currentDrugsCount > 0) {
      console.log('🗑️ مسح جميع الأدوية...');
      const deletedDrugs = await prisma.drug.deleteMany({});
      console.log(`   ✅ تم مسح ${deletedDrugs.count} دواء`);
    }
    
    // 3. مسح أصناف الأدوية
    if (currentCategoriesCount > 0) {
      console.log('🗑️ مسح جميع أصناف الأدوية...');
      const deletedCategories = await prisma.drugCategory.deleteMany({});
      console.log(`   ✅ تم مسح ${deletedCategories.count} صنف`);
    }
    
    // 4. إعادة تعيين AUTO_INCREMENT للجداول (SQLite)
    console.log('\n🔄 إعادة تعيين معرفات الجداول...');
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('drugs', 'drug_categories')`;
    console.log('   ✅ تم إعادة تعيين معرفات الجداول');
    
    // 5. التحقق من النتيجة النهائية
    const finalDrugsCount = await prisma.drug.count();
    const finalCategoriesCount = await prisma.drugCategory.count();
    
    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   - عدد الأدوية: ${finalDrugsCount}`);
    console.log(`   - عدد أصناف الأدوية: ${finalCategoriesCount}`);
    
    console.log('\n✅ تم مسح جميع بيانات الأدوية بنجاح!');
    console.log('📝 الجداول محفوظة وجاهزة لإدخال بيانات جديدة');
    
  } catch (error) {
    console.error('❌ خطأ في مسح بيانات الأدوية:', error);
    throw error;
  }
}

async function main() {
  try {
    await clearDrugsData();
  } catch (error) {
    console.error('❌ فشل في العملية:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { clearDrugsData };