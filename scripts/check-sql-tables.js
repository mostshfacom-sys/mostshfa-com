const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Find all INSERT INTO statements
const tables = sql.match(/INSERT INTO `([^`]+)`/g);
const unique = [...new Set(tables)];

console.log('Tables with INSERT statements:');
unique.forEach(t => console.log('  -', t));

// Check for hospital data
console.log('\n--- Checking for hospital data ---');
const hospitalIdx = sql.indexOf('hospital');
if (hospitalIdx > 0) {
  console.log('Found "hospital" at index:', hospitalIdx);
  console.log('Context:', sql.substring(hospitalIdx - 50, hospitalIdx + 200));
}
