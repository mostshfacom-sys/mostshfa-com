const Database = require('better-sqlite3');
const path = require('path');

const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
const oldDb = new Database(oldDbPath, { readonly: true });

// List all tables
console.log('=== All Tables ===');
const tables = oldDb.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
tables.forEach(t => console.log(t.name));

// Check for articles table
console.log('\n=== Looking for Articles ===');
const articleTables = tables.filter(t => t.name.toLowerCase().includes('article') || t.name.toLowerCase().includes('content'));
console.log('Article-related tables:', articleTables.map(t => t.name));

// Check contentapp tables
console.log('\n=== ContentApp Tables ===');
const contentTables = tables.filter(t => t.name.startsWith('contentapp'));
contentTables.forEach(t => {
  console.log(`\nTable: ${t.name}`);
  const count = oldDb.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
  console.log(`  Count: ${count.count}`);
});

oldDb.close();
