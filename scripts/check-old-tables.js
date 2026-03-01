const Database = require('better-sqlite3');
const path = require('path');

const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
const oldDb = new Database(oldDbPath, { readonly: true });

console.log('=== جداول قاعدة البيانات القديمة ===\n');

const tables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

tables.forEach(t => {
  try {
    const count = oldDb.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
    console.log(`${t.name}: ${count.c}`);
  } catch(e) {
    console.log(`${t.name}: خطأ - ${e.message}`);
  }
});

// البحث عن جداول تحتوي على staff أو doctor
console.log('\n=== البحث عن جداول الأطباء ===');
const staffTables = tables.filter(t => 
  t.name.toLowerCase().includes('staff') || 
  t.name.toLowerCase().includes('doctor') ||
  t.name.toLowerCase().includes('physician')
);
console.log('الجداول المحتملة:', staffTables.map(t => t.name));

oldDb.close();
