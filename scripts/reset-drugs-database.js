const { PrismaClient } = require('@prisma/client');
const { clearDrugsData } = require('./clear-drugs-data');
const { verifyDrugsCleared } = require('./verify-drugs-cleared');
const { checkDatabaseConfig } = require('./check-database-config');

const prisma = new PrismaClient();

async function resetDrugsDatabase() {
  console.log('🔄 بدء عملية إعادة تعيين قاعدة بيانات الأدوية...\n');
  console.log('=' .repeat(60));
  
  try {
    // 0. فحص إعدادات قاعدة البيانات أولاً
    console.log('المرحلة 0: فحص إعدادات قاعدة البيانات');
    console.log('-'.repeat(30));
    const isConfigValid = await checkDatabaseConfig();
    
    if (!isConfigValid) {
      console.log('❌ قاعدة البيانات غير جاهزة. يرجى إصلاح المشاكل أولاً');
      return;
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 1. عرض تحذير وطلب تأكيد
    console.log('⚠️  تحذير: هذه العملية ستقوم بمسح جميع بيانات الأدوية نهائياً!');
    console.log('📝 سيتم الاحتفاظ بالجداول وبنية قاعدة البيانات');
    console.log('🔒 قاعدة البيانات المصدر لن تتأثر\n');
    
    // في بيئة الإنتاج، يمكن إضافة prompt للتأكيد
    // const readline = require('readline');
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });
    // 
    // const answer = await new Promise(resolve => {
    //   rl.question('هل تريد المتابعة؟ (yes/no): ', resolve);
    // });
    // rl.close();
    // 
    // if (answer.toLowerCase() !== 'yes') {
    //   console.log('❌ تم إلغاء العملية');
    //   return;
    // }
    
    console.log('🚀 بدء العملية...\n');
    
    // 2. مسح بيانات الأدوية
    console.log('المرحلة 1: مسح البيانات');
    console.log('-'.repeat(30));
    await clearDrugsData();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 3. التحقق من النتيجة
    console.log('المرحلة 2: التحقق من النتيجة');
    console.log('-'.repeat(30));
    await verifyDrugsCleared();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 تمت عملية إعادة تعيين قاعدة بيانات الأدوية بنجاح!');
    console.log('✅ قاعدة البيانات جاهزة الآن لإدخال بيانات جديدة');
    
  } catch (error) {
    console.error('\n❌ فشلت عملية إعادة التعيين:', error);
    console.error('💡 تأكد من أن قاعدة البيانات متاحة وأن لديك الصلاحيات المطلوبة');
    throw error;
  }
}

async function main() {
  try {
    await resetDrugsDatabase();
  } catch (error) {
    console.error('❌ خطأ في العملية:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { resetDrugsDatabase };