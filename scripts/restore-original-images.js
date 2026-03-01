/**
 * سكريبت استعادة الصور الأصلية من قاعدة البيانات القديمة
 * يقرأ ملف SQL ويستخرج الصور الأصلية ويحدث قاعدة البيانات الحالية
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

console.log('=== استعادة الصور الأصلية ===\n');

// قراءة ملف SQL
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// استخراج بيانات المقالات
function extractArticleImages() {
  const articleImages = [];
  
  // البحث عن INSERT INTO articles
  const articleRegex = /INSERT INTO `articles`[^;]+VALUES\s*([^;]+);/gi;
  const matches = sqlContent.match(articleRegex);
  
  if (matches) {
    matches.forEach(match => {
      // استخراج كل صف
      const rowRegex = /\((\d+),\s*(\d+),\s*\d+,\s*'([^']*)',\s*'([^']*)',\s*'[^']*',\s*(?:NULL|'[^']*'),\s*(?:NULL|\d+),\s*\d+,\s*\d+,\s*\d+,\s*'[^']*',\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*'[^']*',\s*'[^']*',\s*(?:NULL|'([^']*)')/g;
      
      let rowMatch;
      while ((rowMatch = rowRegex.exec(match)) !== null) {
        const id = parseInt(rowMatch[1]);
        const image = rowMatch[5] || null;
        if (image && !image.includes('default')) {
          articleImages.push({ id, image, slug: rowMatch[4] });
        }
      }
    });
  }
  
  return articleImages;
}

// استخراج بيانات المستشفيات
function extractHospitalImages() {
  const hospitalImages = [];
  
  // البحث عن INSERT INTO hospitals
  const hospitalRegex = /INSERT INTO `hospitals`[^;]+VALUES\s*([^;]+);/gi;
  const matches = sqlContent.match(hospitalRegex);
  
  if (matches) {
    matches.forEach(match => {
      // استخراج image_url من كل صف
      const rowRegex = /\((\d+),\s*'([^']*)',\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*(?:NULL|'[^']*'),\s*(?:NULL|'([^']*)')/g;
      
      let rowMatch;
      while ((rowMatch = rowRegex.exec(match)) !== null) {
        const id = parseInt(rowMatch[1]);
        const name = rowMatch[2];
        const imageUrl = rowMatch[3] || null;
        if (imageUrl && !imageUrl.includes('default')) {
          hospitalImages.push({ id, name, imageUrl });
        }
      }
    });
  }
  
  return hospitalImages;
}

// استخراج بيانات الأدوية
function extractDrugImages() {
  const drugImages = [];
  
  // البحث عن INSERT INTO drugs
  const drugRegex = /INSERT INTO `drugs`[^;]+VALUES\s*([^;]+);/gi;
  const matches = sqlContent.match(drugRegex);
  
  if (matches) {
    matches.forEach(match => {
      // استخراج image من كل صف
      const rowRegex = /\((\d+),\s*(?:NULL|\d+),\s*'([^']*)',\s*(?:NULL|'[^']*'),\s*(?:NULL|'([^']*)')/g;
      
      let rowMatch;
      while ((rowMatch = rowRegex.exec(match)) !== null) {
        const id = parseInt(rowMatch[1]);
        const nameAr = rowMatch[2];
        const image = rowMatch[3] || null;
        if (image && !image.includes('default') && image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          drugImages.push({ id, nameAr, image });
        }
      }
    });
  }
  
  return drugImages;
}

// تحديث قاعدة البيانات
function updateDatabase() {
  const db = new Database(dbPath);
  
  console.log('جاري استخراج الصور من ملف SQL...\n');
  
  // استخراج صور المقالات
  const articleImages = extractArticleImages();
  console.log(`تم العثور على ${articleImages.length} صورة مقالات`);
  
  // تحديث المقالات
  let articlesUpdated = 0;
  const updateArticle = db.prepare('UPDATE articles SET image = ? WHERE id = ?');
  
  articleImages.forEach(article => {
    try {
      // تحويل اسم الصورة إلى مسار كامل
      const imagePath = `/images/articles/${article.image}`;
      updateArticle.run(imagePath, article.id);
      articlesUpdated++;
    } catch (e) {
      // تجاهل الأخطاء
    }
  });
  
  console.log(`تم تحديث ${articlesUpdated} مقالة`);
  
  db.close();
  console.log('\n=== تم الانتهاء ===');
}

// تشغيل السكريبت
try {
  updateDatabase();
} catch (e) {
  console.error('خطأ:', e.message);
}
