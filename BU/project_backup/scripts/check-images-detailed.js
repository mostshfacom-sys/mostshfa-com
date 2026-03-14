const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('\n=== Checking Images in Database ===\n');

// Check hospitals
const hospitals = db.prepare(`SELECT id, name_ar, slug, logo FROM hospitals LIMIT 10`).all();
console.log('Hospitals (first 10):');
hospitals.forEach(h => {
  console.log(`  ID: ${h.id}, Name: ${h.name_ar}, Logo: ${h.logo || 'NULL'}`);
});

// Check drugs
const drugs = db.prepare(`SELECT id, name_ar, slug, image FROM drugs LIMIT 10`).all();
console.log('\nDrugs (first 10):');
drugs.forEach(d => {
  console.log(`  ID: ${d.id}, Name: ${d.name_ar.substring(0, 30)}, Image: ${d.image || 'NULL'}`);
});

// Check articles
const articles = db.prepare(`SELECT id, title, slug, image FROM articles LIMIT 10`).all();
console.log('\nArticles (first 10):');
articles.forEach(a => {
  console.log(`  ID: ${a.id}, Title: ${a.title.substring(0, 30)}, Image: ${a.image || 'NULL'}`);
});

// Count images
const hospitalWithImages = db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE logo IS NOT NULL AND logo != ''`).get();
const drugsWithImages = db.prepare(`SELECT COUNT(*) as c FROM drugs WHERE image IS NOT NULL AND image != ''`).get();
const articlesWithImages = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image IS NOT NULL AND image != ''`).get();

console.log('\n=== Image Statistics ===');
console.log(`Hospitals with images: ${hospitalWithImages.c} / 387`);
console.log(`Drugs with images: ${drugsWithImages.c} / 29606`);
console.log(`Articles with images: ${articlesWithImages.c} / 234`);

db.close();
