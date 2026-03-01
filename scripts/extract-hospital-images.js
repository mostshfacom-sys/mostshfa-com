const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

const sql = fs.readFileSync(sqlFilePath, 'utf8');

console.log('=== استخراج صور المستشفيات ===\n');

// Find the hospitals INSERT section
const hospitalsStart = sql.indexOf("INSERT INTO `hospitals`");
if (hospitalsStart === -1) {
  console.log('لم يتم العثور على جدول المستشفيات');
  process.exit(1);
}

// Find the end of the INSERT statement
const hospitalsEnd = sql.indexOf(';', hospitalsStart);
const hospitalsSection = sql.substring(hospitalsStart, hospitalsEnd);

console.log('طول قسم المستشفيات:', hospitalsSection.length, 'حرف');

// Extract VALUES part
const valuesStart = hospitalsSection.indexOf('VALUES');
const valuesSection = hospitalsSection.substring(valuesStart + 6);

// Parse each row - looking for image_url and logo_url fields
// Based on db_details.txt, hospitals table has:
// id, name, type_id, governorate_id, city_id, district_id, city, address, phone, whatsapp, facebook, image_url, logo_url, ...

const hospitals = [];

// Split by ),( to get individual rows
const rows = valuesSection.split(/\),\s*\(/);

rows.forEach((row, index) => {
  // Clean up the row
  let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
  
  // Extract fields - this is tricky because of nested quotes
  // Let's look for image patterns
  const imageMatch = row.match(/['"]([^'"]*\.(jpg|jpeg|png|gif|webp))['"]/gi);
  const idMatch = row.match(/^\(?(\d+)/);
  const nameMatch = row.match(/^\(?(\d+),\s*'([^']+)'/);
  const slugMatch = row.match(/'([a-z0-9-]+)',\s*(?:'[^']*'|NULL),\s*'[^']*',\s*'[^']*'$/i);
  
  if (idMatch && imageMatch) {
    const id = parseInt(idMatch[1]);
    const name = nameMatch ? nameMatch[2] : 'Unknown';
    const images = imageMatch.map(m => m.replace(/['"]/g, ''));
    
    hospitals.push({
      id,
      name: name.substring(0, 50),
      images
    });
  }
});

console.log(`\nتم العثور على ${hospitals.length} مستشفى بصور`);

// Show first 10 examples
console.log('\nأمثلة:');
hospitals.slice(0, 10).forEach(h => {
  console.log(`  ID: ${h.id}, Name: ${h.name}, Images: ${h.images.join(', ')}`);
});

// Now let's try a different approach - look for specific image patterns in the hospitals section
console.log('\n--- البحث عن أنماط الصور ---');

const allImages = hospitalsSection.match(/['"]([^'"]*\.(jpg|jpeg|png|gif|webp))['"]/gi);
if (allImages) {
  const uniqueImages = [...new Set(allImages.map(m => m.replace(/['"]/g, '')))];
  console.log(`إجمالي الصور الفريدة: ${uniqueImages.length}`);
  console.log('أمثلة:', uniqueImages.slice(0, 10).join(', '));
}

// Update database with found images
if (hospitals.length > 0) {
  console.log('\n--- تحديث قاعدة البيانات ---');
  const db = new Database(dbPath);
  
  const updateHospital = db.prepare('UPDATE hospitals SET logo = ? WHERE id = ?');
  let updated = 0;
  
  hospitals.forEach(h => {
    if (h.images.length > 0) {
      try {
        const result = updateHospital.run(h.images[0], h.id);
        if (result.changes > 0) updated++;
      } catch (e) {
        // ignore
      }
    }
  });
  
  console.log(`تم تحديث ${updated} مستشفى`);
  
  // Check results
  const withImages = db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE logo IS NOT NULL AND logo != ''`).get();
  console.log(`المستشفيات بصور: ${withImages.c}`);
  
  db.close();
}
