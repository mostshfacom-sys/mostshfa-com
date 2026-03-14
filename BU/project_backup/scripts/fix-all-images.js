/**
 * سكريبت إصلاح جميع الصور من قاعدة البيانات القديمة MySQL
 * يقرأ ملف SQL ويستخرج الصور الأصلية ويحدث قاعدة البيانات الحالية SQLite
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

console.log('=== إصلاح جميع الصور من قاعدة البيانات القديمة ===\n');
console.log('SQL File:', sqlFilePath);
console.log('DB Path:', dbPath);

// قراءة ملف SQL
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
console.log('\nحجم ملف SQL:', (sqlContent.length / 1024 / 1024).toFixed(2), 'MB');

// استخراج صور المقالات
function extractArticleImages() {
  const images = new Map();
  
  // البحث عن أنماط الصور في المقالات
  // الصيغة: (id, category_id, author_id, title, slug, content, ..., image, ...)
  const regex = /\((\d+),\s*\d+,\s*\d+,\s*'[^']*',\s*'([^']*)',\s*'[^']*',\s*(?:NULL|'[^']*'),\s*(?:NULL|\d+),\s*\d+,\s*\d+,\s*\d+,\s*'[^']*',\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*'[^']*',\s*'[^']*',\s*'([^']*)'/g;
  
  let match;
  while ((match = regex.exec(sqlContent)) !== null) {
    const id = parseInt(match[1]);
    const slug = match[2];
    const image = match[3];
    
    if (image && image.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !image.includes('default')) {
      images.set(slug, { id, slug, image });
    }
  }
  
  return images;
}

// استخراج صور المستشفيات
function extractHospitalImages() {
  const images = new Map();
  
  // البحث عن image_url في المستشفيات
  const hospitalSection = sqlContent.match(/INSERT INTO `hospitals`[^;]+;/gi);
  
  if (hospitalSection) {
    hospitalSection.forEach(section => {
      // استخراج كل صف
      const rowRegex = /\((\d+),\s*'([^']*)',/g;
      let match;
      while ((match = rowRegex.exec(section)) !== null) {
        const id = parseInt(match[1]);
        const name = match[2];
        images.set(id, { id, name });
      }
    });
  }
  
  return images;
}

// تحديث قاعدة البيانات
function updateDatabase() {
  const db = new Database(dbPath);
  
  console.log('\n--- استخراج صور المقالات ---');
  const articleImages = extractArticleImages();
  console.log(`تم العثور على ${articleImages.size} صورة مقالات`);
  
  // عرض بعض الأمثلة
  let count = 0;
  for (const [slug, data] of articleImages) {
    if (count < 5) {
      console.log(`  - ${slug}: ${data.image}`);
      count++;
    }
  }
  
  // تحديث المقالات
  console.log('\n--- تحديث صور المقالات ---');
  const updateArticle = db.prepare('UPDATE articles SET image = ? WHERE slug = ?');
  
  let articlesUpdated = 0;
  for (const [slug, data] of articleImages) {
    try {
      // تحويل اسم الصورة إلى مسار كامل
      const imagePath = `/images/articles/${data.image}`;
      const result = updateArticle.run(imagePath, slug);
      if (result.changes > 0) {
        articlesUpdated++;
      }
    } catch (e) {
      // تجاهل الأخطاء
    }
  }
  console.log(`تم تحديث ${articlesUpdated} مقالة`);
  
  // التحقق من النتائج
  console.log('\n--- التحقق من النتائج ---');
  const articlesWithImages = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image NOT LIKE '%default%'`).get();
  const articlesWithDefaults = db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image LIKE '%default%'`).get();
  console.log(`مقالات بصور حقيقية: ${articlesWithImages.c}`);
  console.log(`مقالات بصور افتراضية: ${articlesWithDefaults.c}`);
  
  // عرض أمثلة من المقالات المحدثة
  const sampleArticles = db.prepare(`SELECT id, title, image FROM articles WHERE image NOT LIKE '%default%' LIMIT 5`).all();
  console.log('\nأمثلة من المقالات المحدثة:');
  sampleArticles.forEach(a => {
    console.log(`  - ID: ${a.id}, Image: ${a.image}`);
  });
  
  db.close();
  console.log('\n=== تم الانتهاء ===');
}

// تشغيل السكريبت
try {
  updateDatabase();
} catch (e) {
  console.error('خطأ:', e.message);
  console.error(e.stack);
}
