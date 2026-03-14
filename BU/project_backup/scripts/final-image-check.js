const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('=== التحقق النهائي من حالة الصور ===\n');

// Articles
const articlesTotal = db.prepare('SELECT COUNT(*) as c FROM articles').get().c;
const articlesReal = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '%default%'`).get().c;
const articlesDefault = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image LIKE '%default%'`).get().c;

console.log('المقالات:');
console.log(`  الإجمالي: ${articlesTotal}`);
console.log(`  بصور حقيقية: ${articlesReal}`);
console.log(`  بصور افتراضية: ${articlesDefault}`);

// Drugs
const drugsTotal = db.prepare('SELECT COUNT(*) as c FROM drugs').get().c;
const drugsReal = db.prepare(`SELECT COUNT(*) as c FROM drugs WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '%default%'`).get().c;
const drugsDefault = db.prepare(`SELECT COUNT(*) as c FROM drugs WHERE image LIKE '%default%'`).get().c;

console.log('\nالأدوية:');
console.log(`  الإجمالي: ${drugsTotal}`);
console.log(`  بصور حقيقية: ${drugsReal}`);
console.log(`  بصور افتراضية: ${drugsDefault}`);

// Hospitals
const hospitalsTotal = db.prepare('SELECT COUNT(*) as c FROM hospitals').get().c;
const hospitalsReal = db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE logo IS NOT NULL AND logo != '' AND logo NOT LIKE '%default%'`).get().c;
const hospitalsDefault = db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE logo LIKE '%default%'`).get().c;

console.log('\nالمستشفيات:');
console.log(`  الإجمالي: ${hospitalsTotal}`);
console.log(`  بصور حقيقية: ${hospitalsReal}`);
console.log(`  بصور افتراضية: ${hospitalsDefault}`);

// Sample of real article images
console.log('\n=== أمثلة من صور المقالات الحقيقية ===');
const sampleArticles = db.prepare(`SELECT id, title, image FROM articles WHERE image NOT LIKE '%default%' LIMIT 5`).all();
sampleArticles.forEach(a => {
  console.log(`  ID: ${a.id}, Title: ${a.title.substring(0, 40)}, Image: ${a.image}`);
});

// Sample of real drug images
console.log('\n=== أمثلة من صور الأدوية الحقيقية ===');
const sampleDrugs = db.prepare(`SELECT id, name_ar, image FROM drugs WHERE image NOT LIKE '%default%' LIMIT 5`).all();
sampleDrugs.forEach(d => {
  console.log(`  ID: ${d.id}, Name: ${d.name_ar.substring(0, 30)}, Image: ${d.image}`);
});

db.close();
console.log('\n=== تم الانتهاء ===');
