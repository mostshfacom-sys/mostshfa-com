/**
 * سكريبت إعداد قاعدة البيانات
 * يقوم بتشغيل prisma generate و prisma db push
 * 
 * الاستخدام:
 * node scripts/setup-database.js
 */

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

console.log('🔧 إعداد قاعدة البيانات...\n');

try {
  // 1. توليد Prisma Client
  console.log('📦 توليد Prisma Client...');
  execSync('npx prisma generate', { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  console.log('✅ تم توليد Prisma Client بنجاح\n');

  // 2. دفع التغييرات لقاعدة البيانات
  console.log('🚀 دفع التغييرات لقاعدة البيانات...');
  execSync('npx prisma db push', { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  console.log('✅ تم تحديث قاعدة البيانات بنجاح\n');

  console.log('🎉 اكتمل إعداد قاعدة البيانات!');
  console.log('\nالخطوات التالية:');
  console.log('1. تأكد من إعداد DATABASE_URL في ملف .env');
  console.log('2. شغّل السيرفر: npm run dev');
  console.log('3. افتح لوحة التحكم: http://localhost:3001/admin/articles-banner');

} catch (error) {
  console.error('❌ حدث خطأ:', error.message);
  process.exit(1);
}
