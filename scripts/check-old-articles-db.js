const Database = require('better-sqlite3');
const path = require('path');

const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');

try {
  const oldDb = new Database(oldDbPath, { readonly: true });
  
  // Check if articles table exists
  const tables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%article%'").all();
  console.log('=== Article-related tables ===');
  console.log(tables);
  
  // Try to count articles
  try {
    const count = oldDb.prepare('SELECT COUNT(*) as count FROM contentapp_article').get();
    console.log('\n=== Articles count ===');
    console.log('Total articles:', count.count);
    
    // Get sample
    const sample = oldDb.prepare('SELECT id, title, slug FROM contentapp_article LIMIT 3').all();
    console.log('\n=== Sample articles ===');
    console.log(sample);
  } catch (e) {
    console.log('contentapp_article table not found, trying other names...');
    
    // Try other possible table names
    const allTables = oldDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\nAll tables:', allTables.map(t => t.name).join(', '));
  }
  
  oldDb.close();
} catch (error) {
  console.error('Error:', error.message);
}
