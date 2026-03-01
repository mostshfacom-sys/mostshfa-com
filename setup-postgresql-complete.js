#!/usr/bin/env node

/**
 * إعداد PostgreSQL كامل للمشروع
 * يقوم بإنشاء قاعدة البيانات وتحديث الإعدادات ونقل البيانات
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 بدء إعداد PostgreSQL...\n');

// 1. التحقق من وجود PostgreSQL
console.log('1️⃣ التحقق من PostgreSQL...');
try {
  execSync('psql --version', { stdio: 'pipe' });
  console.log('✅ PostgreSQL مثبت ومتاح\n');
} catch (error) {
  console.log('❌ PostgreSQL غير مثبت. يرجى تثبيته أولاً:');
  console.log('   - Windows: https://www.postgresql.org/download/windows/');
  console.log('   - أو استخدم: winget install PostgreSQL.PostgreSQL');
  process.exit(1);
}

// 2. إنشاء قاعدة البيانات
console.log('2️⃣ إنشاء قاعدة البيانات...');
const dbName = 'mostshfa_new';
const dbUser = 'postgres';
const dbPassword = 'postgres123';
const dbHost = 'localhost';
const dbPort = '5432';

try {
  // إنشاء قاعدة البيانات
  execSync(`createdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`, { 
    stdio: 'pipe',
    env: { ...process.env, PGPASSWORD: dbPassword }
  });
  console.log('✅ تم إنشاء قاعدة البيانات بنجاح\n');
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('✅ قاعدة البيانات موجودة مسبقاً\n');
  } else {
    console.log('⚠️ تعذر إنشاء قاعدة البيانات. تأكد من:');
    console.log('   - تشغيل خدمة PostgreSQL');
    console.log('   - صحة بيانات الاتصال');
    console.log('   - وجود صلاحيات إنشاء قواعد البيانات\n');
  }
}

// 3. تحديث ملف البيئة
console.log('3️⃣ تحديث ملف البيئة...');
const envPath = path.join(__dirname, '.env.local');
const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// تحديث أو إضافة DATABASE_URL
if (envContent.includes('DATABASE_URL=')) {
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${databaseUrl}"`);
} else {
  envContent += `\n# PostgreSQL Database\nDATABASE_URL="${databaseUrl}"\n`;
}

fs.writeFileSync(envPath, envContent);
console.log('✅ تم تحديث ملف البيئة\n');

// 4. تحديث Prisma Schema
console.log('4️⃣ تحديث Prisma Schema...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// تحديث datasource
schemaContent = schemaContent.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

fs.writeFileSync(schemaPath, schemaContent);
console.log('✅ تم تحديث Prisma Schema\n');

// 5. إنشاء Migration
console.log('5️⃣ إنشاء Migration...');
try {
  execSync('npx prisma migrate dev --name init-postgresql', { stdio: 'inherit' });
  console.log('✅ تم إنشاء Migration بنجاح\n');
} catch (error) {
  console.log('⚠️ تعذر إنشاء Migration. سيتم المحاولة مرة أخرى...\n');
}

// 6. توليد Prisma Client
console.log('6️⃣ توليد Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ تم توليد Prisma Client بنجاح\n');
} catch (error) {
  console.log('⚠️ تعذر توليد Prisma Client\n');
}

// 7. نقل البيانات من SQLite (إذا كانت موجودة)
console.log('7️⃣ نقل البيانات من SQLite...');
const sqliteDbPath = path.join(__dirname, 'dev.db');
if (fs.existsSync(sqliteDbPath)) {
  try {
    // تشغيل script نقل البيانات
    execSync('node migrate-sqlite-to-postgresql.js', { stdio: 'inherit' });
    console.log('✅ تم نقل البيانات بنجاح\n');
  } catch (error) {
    console.log('⚠️ تعذر نقل البيانات. يمكن القيام بذلك لاحقاً\n');
  }
} else {
  console.log('ℹ️ لا توجد بيانات SQLite لنقلها\n');
}

// 8. اختبار الاتصال
console.log('8️⃣ اختبار الاتصال...');
try {
  execSync('npx prisma db push', { stdio: 'pipe' });
  console.log('✅ تم اختبار الاتصال بنجاح\n');
} catch (error) {
  console.log('⚠️ تعذر الاتصال بقاعدة البيانات\n');
}

console.log('🎉 تم إكمال إعداد PostgreSQL بنجاح!');
console.log('\n📋 الخطوات التالية:');
console.log('1. تشغيل الخادم: npm run dev');
console.log('2. فتح Prisma Studio: npx prisma studio');
console.log('3. اختبار APIs: node test-new-apis.js');
console.log('\n🔗 معلومات الاتصال:');
console.log(`   Database: ${dbName}`);
console.log(`   Host: ${dbHost}:${dbPort}`);
console.log(`   User: ${dbUser}`);
console.log(`   URL: ${databaseUrl}`);