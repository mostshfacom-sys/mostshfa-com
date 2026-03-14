#!/usr/bin/env node

/**
 * إعداد قاعدة البيانات PostgreSQL
 * يقوم بإنشاء قاعدة البيانات وتطبيق المخطط الأولي
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء إعداد قاعدة البيانات PostgreSQL...\n');

// التحقق من وجود PostgreSQL
try {
  execSync('psql --version', { stdio: 'pipe' });
  console.log('✅ PostgreSQL مثبت ومتاح');
} catch (error) {
  console.error('❌ PostgreSQL غير مثبت أو غير متاح في PATH');
  console.log('\nلتثبيت PostgreSQL:');
  console.log('- Windows: https://www.postgresql.org/download/windows/');
  console.log('- macOS: brew install postgresql');
  console.log('- Ubuntu: sudo apt-get install postgresql postgresql-contrib');
  process.exit(1);
}

// التحقق من ملف .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 إنشاء ملف .env من .env.example...');
  const examplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ تم إنشاء ملف .env');
  } else {
    console.error('❌ ملف .env.example غير موجود');
    process.exit(1);
  }
}

// قراءة إعدادات قاعدة البيانات من .env
require('dotenv').config({ path: envPath });
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.includes('postgresql://')) {
  console.error('❌ DATABASE_URL غير صحيح في ملف .env');
  console.log('يجب أن يكون بالشكل: postgresql://username:password@localhost:5432/database_name');
  process.exit(1);
}

// استخراج معلومات قاعدة البيانات من URL
const url = new URL(databaseUrl);
const dbName = url.pathname.slice(1).split('?')[0];
const username = url.username;
const password = url.password;
const host = url.hostname;
const port = url.port || 5432;

console.log(`📊 إعدادات قاعدة البيانات:`);
console.log(`   المضيف: ${host}:${port}`);
console.log(`   المستخدم: ${username}`);
console.log(`   قاعدة البيانات: ${dbName}\n`);

// إنشاء قاعدة البيانات إذا لم تكن موجودة
try {
  console.log('🔍 التحقق من وجود قاعدة البيانات...');
  
  // محاولة الاتصال بقاعدة البيانات
  const checkCmd = `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${username} -d ${dbName} -c "SELECT 1;" 2>/dev/null`;
  
  try {
    execSync(checkCmd, { stdio: 'pipe' });
    console.log('✅ قاعدة البيانات موجودة بالفعل');
  } catch (error) {
    console.log('📝 إنشاء قاعدة البيانات الجديدة...');
    
    // إنشاء قاعدة البيانات
    const createCmd = `PGPASSWORD=${password} createdb -h ${host} -p ${port} -U ${username} ${dbName}`;
    execSync(createCmd, { stdio: 'inherit' });
    console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
  }
} catch (error) {
  console.error('❌ فشل في إنشاء قاعدة البيانات:', error.message);
  console.log('\nتأكد من:');
  console.log('1. تشغيل خدمة PostgreSQL');
  console.log('2. صحة بيانات المستخدم وكلمة المرور');
  console.log('3. صلاحيات إنشاء قواعد البيانات للمستخدم');
  process.exit(1);
}

// تطبيق Prisma migrations
try {
  console.log('\n🔄 تطبيق مخطط قاعدة البيانات...');
  
  // إنشاء migration أولي
  console.log('📝 إنشاء migration أولي...');
  execSync('npx prisma migrate dev --name init --create-only', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // تطبيق migrations
  console.log('⚡ تطبيق migrations...');
  execSync('npx prisma migrate dev', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ تم تطبيق مخطط قاعدة البيانات بنجاح');
} catch (error) {
  console.error('❌ فشل في تطبيق مخطط قاعدة البيانات:', error.message);
  process.exit(1);
}

// إنشاء Prisma Client
try {
  console.log('\n🔧 إنشاء Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ تم إنشاء Prisma Client بنجاح');
} catch (error) {
  console.error('❌ فشل في إنشاء Prisma Client:', error.message);
  process.exit(1);
}

// إضافة بيانات أولية (اختياري)
try {
  console.log('\n🌱 إضافة البيانات الأولية...');
  
  const seedScript = path.join(__dirname, 'seed-basic-data.js');
  if (fs.existsSync(seedScript)) {
    execSync(`node ${seedScript}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ تم إضافة البيانات الأولية بنجاح');
  } else {
    console.log('⚠️  ملف البيانات الأولية غير موجود، سيتم تخطي هذه الخطوة');
  }
} catch (error) {
  console.warn('⚠️  تحذير: فشل في إضافة البيانات الأولية:', error.message);
  console.log('يمكنك إضافة البيانات لاحقاً باستخدام: npm run seed');
}

console.log('\n🎉 تم إعداد قاعدة البيانات PostgreSQL بنجاح!');
console.log('\nالخطوات التالية:');
console.log('1. تشغيل الخادم: npm run dev');
console.log('2. فتح Prisma Studio: npx prisma studio');
console.log('3. عرض قاعدة البيانات في المتصفح: http://localhost:5555');

console.log('\n📚 روابط مفيدة:');
console.log('- Prisma Docs: https://www.prisma.io/docs');
console.log('- PostgreSQL Docs: https://www.postgresql.org/docs');
console.log('- Next.js Docs: https://nextjs.org/docs');