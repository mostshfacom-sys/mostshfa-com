const Database = require('better-sqlite3');
const path = require('path');

const oldDbPath = path.join(__dirname, '..', '..', 'backend', 'db.sqlite3');
const oldDb = new Database(oldDbPath, { readonly: true });

// Check drugs table structure
console.log('=== Drugs Table Structure ===');
const drugsInfo = oldDb.prepare("PRAGMA table_info(drugs_drug)").all();
console.log(drugsInfo.map(col => `${col.name} (${col.type})`).join('\n'));

// Check first 3 drugs
console.log('\n=== Sample Drugs ===');
const sampleDrugs = oldDb.prepare('SELECT * FROM drugs_drug LIMIT 3').all();
console.log(JSON.stringify(sampleDrugs, null, 2));

oldDb.close();
