
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const provider = process.argv[2];

if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('Usage: node scripts/switch-database.js [sqlite|postgresql]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (provider === 'sqlite') {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');
} else {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  schema = schema.replace(/url\s*=\s*"file:\.\/dev\.db"/g, 'url = env("DATABASE_URL")');
}

fs.writeFileSync(schemaPath, schema);
console.log(`✅ Updated Prisma schema to use ${provider}`);

try {
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (e) {
  console.error('❌ Failed to generate Prisma client:', e.message);
}
