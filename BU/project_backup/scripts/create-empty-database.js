const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function createEmptyDatabase() {
  console.log('🗄️ إنشاء قاعدة بيانات فارغة...\n');
  
  const dbPath = path.resolve('./dev.db');
  console.log(`📁 مسار قاعدة البيانات: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ خطأ في إنشاء قاعدة البيانات:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ تم إنشاء ملف قاعدة البيانات');
      
      // إنشاء جداول الأدوية
      const createTables = `
        -- جدول أصناف الأدوية
        CREATE TABLE IF NOT EXISTS drug_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          legacy_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- جدول الأدوية
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
        );
        
        -- فهارس
        CREATE INDEX IF NOT EXISTS idx_drugs_category_id ON drugs(category_id);
        CREATE INDEX IF NOT EXISTS idx_drugs_slug ON drugs(slug);
        CREATE INDEX IF NOT EXISTS idx_drug_categories_name ON drug_categories(name);
      `;
      
      db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ خطأ في إنشاء الجداول:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ تم إنشاء جداول الأدوية');
        
        // التحقق من الجداول
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (err) {
            console.error('❌ خطأ في فحص الجداول:', err.message);
            reject(err);
            return;
          }
          
          console.log('\n📊 الجداول المنشأة:');
          tables.forEach(table => {
            console.log(`   ✅ ${table.name}`);
          });
          
          db.close((err) => {
            if (err) {
              console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
              reject(err);
              return;
            }
            
            console.log('\n✅ تم إنشاء قاعدة البيانات بنجاح!');
            console.log('📝 قاعدة البيانات فارغة وجاهزة للاستخدام');
            resolve();
          });
        });
      });
    });
  });
}

async function main() {
  try {
    await createEmptyDatabase();
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

module.exports = { createEmptyDatabase };