const Database = require('better-sqlite3');
const path = require('path');

const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');

try {
  const oldDb = new Database(oldDbPath, { readonly: true });

  // Check hospitals table structure
  console.log('=== Hospitals Table Structure ===');
  const hospitalsInfo = oldDb.prepare("PRAGMA table_info(directory_hospital)").all();
  console.log(hospitalsInfo.map(col => `${col.name} (${col.type})`).join('\n'));

  // Check first 10 hospitals
  console.log('\n=== Sample Hospitals ===');
  const sampleHospitals = oldDb.prepare('SELECT id, name_ar, logo_url, logo, slug FROM directory_hospital LIMIT 10').all();
  sampleHospitals.forEach(h => {
    console.log(`ID: ${h.id}, Name: ${h.name_ar?.substring(0, 30)}, Logo URL: ${h.logo_url || 'لا يوجد'}, Logo: ${h.logo || 'لا يوجد'}`);
  });

  // Count hospitals with images
  const totalHospitals = oldDb.prepare('SELECT COUNT(*) as count FROM directory_hospital').get();
  const withImages = oldDb.prepare("SELECT COUNT(*) as count FROM directory_hospital WHERE image_url IS NOT NULL AND image_url != ''").get();
  const withLogos = oldDb.prepare("SELECT COUNT(*) as count FROM directory_hospital WHERE logo_url IS NOT NULL AND logo_url != ''").get();
  
  console.log(`\n📊 إحصائيات:`);
  console.log(`  إجمالي المستشفيات: ${totalHospitals.count}`);
  console.log(`  مع صور: ${withImages.count}`);
  console.log(`  مع لوجو: ${withLogos.count}`);

  oldDb.close();
} catch (err) {
  console.error('خطأ:', err.message);
  
  // Try MySQL connection
  console.log('\nجاري محاولة الاتصال بـ MySQL...');
}
