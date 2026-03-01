const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Find the hospitals INSERT section
const hospitalsStart = sql.indexOf("INSERT INTO `hospitals`");
const hospitalsEnd = sql.indexOf(';', hospitalsStart);
const hospitalsSection = sql.substring(hospitalsStart, hospitalsEnd + 1);

// Print first 3000 characters
console.log('=== محتوى جدول المستشفيات (أول 3000 حرف) ===\n');
console.log(hospitalsSection.substring(0, 3000));
