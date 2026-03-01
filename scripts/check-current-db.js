/**
 * فحص قاعدة البيانات الحالية
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath, { readonly: true });

console.log('📊 فحص قاعدة البيانات الحالية...\n');

// عدد المقالات
const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
console.log('عدد المقالات الحالية:', articleCount.count);

// المقالات مع الصور
const withImages = db.prepare("SELECT COUNT(*) as count FROM articles WHERE image IS NOT NULL AND image != ''").get();
console.log('المقالات مع صور:', withImages.count);

// عينة من المقالات
const samples = db.prepare('SELECT id, title, image FROM articles LIMIT 5').all();
console.log('\n📝 عينة من المقالات:');
samples.forEach(a => {
  console.log('- ' + (a.title ? a.title.substring(0, 50) : 'بدون عنوان') + '...');
  console.log('  الصورة:', a.image || 'لا توجد');
});

// فحص المستشفيات
const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get();
console.log('\n🏥 عدد المستشفيات:', hospitalCount.count);

const hospitalsWithLogo = db.prepare("SELECT COUNT(*) as count FROM hospitals WHERE logo IS NOT NULL AND logo != ''").get();
console.log('المستشفيات مع شعار:', hospitalsWithLogo.count);

// عينة من المستشفيات
const hospitalSamples = db.prepare('SELECT id, name_ar, logo FROM hospitals LIMIT 3').all();
console.log('\nعينة من المستشفيات:');
hospitalSamples.forEach(h => {
  console.log('- ' + h.name_ar);
  console.log('  الشعار:', h.logo || 'لا يوجد');
});

// فحص الصيدليات
const pharmacyCount = db.prepare('SELECT COUNT(*) as count FROM pharmacies').get();
console.log('\n💊 عدد الصيدليات:', pharmacyCount.count);

// فحص المعامل
const labCount = db.prepare('SELECT COUNT(*) as count FROM labs').get();
console.log('🔬 عدد المعامل:', labCount.count);

// فحص العيادات
const clinicCount = db.prepare('SELECT COUNT(*) as count FROM clinics').get();
console.log('🏨 عدد العيادات:', clinicCount.count);

db.close();
console.log('\n✅ تم الفحص بنجاح');
