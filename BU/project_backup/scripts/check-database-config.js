const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function checkDatabaseConfig() {
  console.log('🔍 فحص إعدادات قاعدة البيانات...\n');
  
  try {
    // 1. فحص متغير البيئة
    const databaseUrl = process.env.DATABASE_URL;
    console.log('📊 إعدادات قاعدة البيانات:');
    
    if (!databaseUrl) {
      console.log('   ❌ DATABASE_URL غير محدد');
      console.log('   💡 تأكد من وجود ملف .env مع DATABASE_URL');
      return false;
    }
    
    console.log(`   ✅ DATABASE_URL: ${databaseUrl.substring(0, 20)}...`);
    
    // تحديد نوع قاعدة البيانات
    let dbType = 'unknown';
    if (databaseUrl.startsWith('file:')) {
      dbType = 'SQLite';
    } else if (databaseUrl.startsWith('mysql:')) {
      dbType = 'MySQL';
    } else if (databaseUrl.startsWith('postgresql:')) {
      dbType = 'PostgreSQL';
    }
    
    console.log(`   📝 نوع قاعدة البيانات: ${dbType}`);
    
    // 2. فحص ملف قاعدة البيانات (للـ SQLite)
    if (dbType === 'SQLite') {
      const dbPath = databaseUrl.replace('file:', '');
      const fullDbPath = path.resolve(dbPath);
      
      console.log(`   📁 مسار الملف: ${fullDbPath}`);
      
      if (fs.existsSync(fullDbPath)) {
        const stats = fs.statSync(fullDbPath);
        console.log(`   ✅ ملف قاعدة البيانات موجود (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        console.log('   ❌ ملف قاعدة البيانات غير موجود');
        return false;
      }
    }
    
    // 3. اختبار الاتصال
    console.log('\n🔌 اختبار الاتصال بقاعدة البيانات...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('   ✅ تم الاتصال بنجاح');
      
      // 4. فحص الجداول المطلوبة
      console.log('\n🏗️ فحص الجداول المطلوبة...');
      
      try {
        const drugsCount = await prisma.drug.count();
        console.log(`   ✅ جدول الأدوية موجود (${drugsCount} دواء)`);
      } catch (error) {
        console.log('   ❌ جدول الأدوية غير موجود أو تالف');
        console.log(`   💡 خطأ: ${error.message}`);
        return false;
      }
      
      try {
        const categoriesCount = await prisma.drugCategory.count();
        console.log(`   ✅ جدول أصناف الأدوية موجود (${categoriesCount} صنف)`);
      } catch (error) {
        console.log('   ❌ جدول أصناف الأدوية غير موجود أو تالف');
        console.log(`   💡 خطأ: ${error.message}`);
        return false;
      }
      
      // 5. فحص العلاقات
      console.log('\n🔗 فحص العلاقات بين الجداول...');
      try {
        const drugWithCategory = await prisma.drug.findFirst({
          include: { category: true }
        });
        
        if (drugWithCategory) {
          console.log('   ✅ العلاقة بين الأدوية والأصناف تعمل بشكل صحيح');
        } else {
          console.log('   ⚠️ لا توجد أدوية لاختبار العلاقات');
        }
      } catch (error) {
        console.log('   ❌ مشكلة في العلاقات بين الجداول');
        console.log(`   💡 خطأ: ${error.message}`);
      }
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.log('   ❌ فشل في الاتصال بقاعدة البيانات');
      console.log(`   💡 خطأ: ${error.message}`);
      return false;
    }
    
    // 6. فحص صلاحيات الكتابة
    console.log('\n✏️ فحص صلاحيات الكتابة...');
    if (dbType === 'SQLite') {
      const dbPath = databaseUrl.replace('file:', '');
      const dbDir = path.dirname(path.resolve(dbPath));
      
      try {
        // اختبار إنشاء ملف مؤقت
        const testFile = path.join(dbDir, 'test-write-permission.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('   ✅ صلاحيات الكتابة متاحة');
      } catch (error) {
        console.log('   ❌ لا توجد صلاحيات كتابة');
        console.log(`   💡 خطأ: ${error.message}`);
        return false;
      }
    } else {
      console.log('   ⚠️ لا يمكن فحص صلاحيات الكتابة لقواعد البيانات البعيدة');
    }
    
    console.log('\n✅ جميع الفحوصات نجحت - قاعدة البيانات جاهزة للعملية');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في فحص إعدادات قاعدة البيانات:', error);
    return false;
  }
}

async function main() {
  const isReady = await checkDatabaseConfig();
  
  if (isReady) {
    console.log('\n🚀 يمكنك الآن تشغيل عملية مسح البيانات بأمان');
    process.exit(0);
  } else {
    console.log('\n❌ قاعدة البيانات غير جاهزة. يرجى إصلاح المشاكل أولاً');
    process.exit(1);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { checkDatabaseConfig };