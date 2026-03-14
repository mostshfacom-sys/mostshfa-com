const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'").all();
  
  console.log('\n=== Current Database Status ===\n');
  
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
      console.log(`${table.name}: ${count.count} records`);
      
      // Show sample data for key tables
      if (['hospitals', 'drugs', 'articles', 'clinics', 'labs', 'pharmacies'].includes(table.name)) {
        const sample = db.prepare(`SELECT * FROM "${table.name}" LIMIT 2`).all();
        if (sample.length > 0) {
          console.log('  Sample:', JSON.stringify(sample[0], null, 2).substring(0, 200) + '...');
        }
      }
    } catch (e) {
      console.log(`${table.name}: Error - ${e.message}`);
    }
  });
  
  db.close();
} catch (e) {
  console.error('Error:', e.message);
}
