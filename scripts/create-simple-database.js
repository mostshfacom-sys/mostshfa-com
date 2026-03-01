const fs = require('fs');
const path = require('path');

async function createSimpleDatabase() {
  console.log('🗄️ إنشاء قاعدة بيانات بسيطة...\n');
  
  const dbPath = path.resolve('./dev.db');
  console.log(`📁 مسار قاعدة البيانات: ${dbPath}`);
  
  try {
    // إنشاء ملف قاعدة بيانات فارغ
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, '');
      console.log('✅ تم إنشاء ملف قاعدة البيانات');
    } else {
      console.log('⚠️ ملف قاعدة البيانات موجود بالفعل');
    }
    
    // الآن نستخدم Prisma لإنشاء الجداول
    console.log('\n🔧 إنشاء الجداول باستخدام Prisma...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // اختبار الاتصال
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // إنشاء جداول بسيطة باستخدام SQL مباشر
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS drug_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        legacy_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        legacy_id INTEGER,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        slug TEXT UNIQUE NOT NULL,
        image TEXT,
        usage TEXT,
        contraindications TEXT,
        dosage TEXT,
        active_ingredient TEXT,
        disclaimer TEXT,
        price_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES drug_categories (id)
      )
    `;
    
    console.log('✅ تم إنشاء الجداول');
    
    // التحقق من الجداول
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    console.log('\n📊 الجداول المنشأة:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.name}`);
    });
    
    await prisma.$disconnect();
    
    console.log('\n✅ تم إنشاء قاعدة البيانات بنجاح!');
    console.log('📝 قاعدة البيانات فارغة وجاهزة للاستخدام');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء قاعدة البيانات:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSimpleDatabase();
    console.log('\n🎉 العملية مكتملة!');
  } catch (error) {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { createSimpleDatabase };