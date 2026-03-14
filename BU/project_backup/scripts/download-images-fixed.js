const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// تجاوز مشكلة الشهادة
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prisma = new PrismaClient();

// مجلد الصور
const IMAGES_DIR = path.join(__dirname, '../public/images/articles');

// إنشاء المجلد إذا لم يكن موجوداً
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('✅ تم إنشاء مجلد الصور:', IMAGES_DIR);
}

// تحميل صورة واحدة
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGES_DIR, filename);
    
    // تخطي إذا كانت الصورة موجودة
    if (fs.existsSync(filepath)) {
      resolve({ status: 'exists', filepath });
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      timeout: 15000,
      rejectUnauthorized: false
    };
    
    const request = protocol.get(url, options, (response) => {
      // التعامل مع إعادة التوجيه
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve({ status: 'downloaded', filepath });
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// استخراج اسم الملف من URL
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return path.basename(urlObj.pathname);
  } catch {
    return url.split('/').pop();
  }
}

async function main() {
  console.log('🚀 بدء تحميل صور المقالات (مع تجاوز SSL)...\n');
  
  // جلب جميع المقالات مع صور من الموقع القديم
  const articles = await prisma.article.findMany({
    where: {
      image: {
        contains: 'mostshfa.com'
      }
    },
    select: {
      id: true,
      title: true,
      image: true
    }
  });
  
  console.log(`📊 عدد المقالات للتحميل: ${articles.length}\n`);
  
  let downloaded = 0;
  let exists = 0;
  let failed = 0;
  const errors = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const filename = getFilenameFromUrl(article.image);
    const newPath = `/images/articles/${filename}`;
    
    try {
      const result = await downloadImage(article.image, filename);
      
      if (result.status === 'downloaded') {
        downloaded++;
      } else {
        exists++;
      }
      
      // تحديث المسار في قاعدة البيانات
      await prisma.article.update({
        where: { id: article.id },
        data: { image: newPath }
      });
      
      if ((i + 1) % 25 === 0) {
        console.log(`⏳ تم معالجة ${i + 1}/${articles.length} مقال...`);
      }
    } catch (err) {
      failed++;
      errors.push({ id: article.id, title: article.title, error: err.message, url: article.image });
    }
  }
  
  console.log('\n============================================================');
  console.log('📊 النتائج النهائية:');
  console.log('============================================================');
  console.log(`✅ تم تحميل: ${downloaded} صورة`);
  console.log(`📁 موجودة مسبقاً: ${exists} صورة`);
  console.log(`❌ فشل: ${failed} صورة`);
  
  if (errors.length > 0) {
    console.log('\n⚠️ الأخطاء:');
    errors.slice(0, 5).forEach(e => {
      console.log(`  - [${e.id}] ${e.error}`);
    });
    if (errors.length > 5) {
      console.log(`  ... و ${errors.length - 5} أخطاء أخرى`);
    }
    
    // حفظ الأخطاء في ملف
    fs.writeFileSync(
      path.join(__dirname, 'failed-images.json'),
      JSON.stringify(errors, null, 2)
    );
    console.log('\n📄 تم حفظ قائمة الأخطاء في: scripts/failed-images.json');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
