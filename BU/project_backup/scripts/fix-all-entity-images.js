/**
 * سكريبت إصلاح جميع صور الكيانات من قاعدة البيانات القديمة MySQL
 * يستخرج الصور الأصلية للمستشفيات والأدوية والعيادات والمعامل والصيدليات
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

console.log('=== إصلاح جميع صور الكيانات من قاعدة البيانات القديمة ===\n');
console.log('SQL File:', sqlFilePath);
console.log('DB Path:', dbPath);

// قراءة ملف SQL
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
console.log('\nحجم ملف SQL:', (sqlContent.length / 1024 / 1024).toFixed(2), 'MB');

// استخراج صور المستشفيات
function extractHospitalImages() {
  const images = new Map();
  
  // البحث عن INSERT INTO hospitals
  const hospitalRegex = /INSERT INTO `hospitals`[^;]+VALUES\s*([^;]+);/gi;
  const match = hospitalRegex.exec(sqlContent);
  
  if (match) {
    const valuesStr = match[1];
    // استخراج كل صف - البحث عن image_url و logo_url
    // الترتيب: id, name, type_id, governorate_id, city_id, district_id, city, address, phone, whatsapp, facebook, image_url, logo_url, ...
    const rowRegex = /\((\d+),\s*'([^']*)',\s*(?:\d+|NULL),\s*(?:\d+|NULL),\s*(?:\d+|NULL),\s*(?:\d+|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'([^']*)'|NULL),\s*(?:'([^']*)'|NULL)/g;
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
      const id = parseInt(rowMatch[1]);
      const name = rowMatch[2];
      const imageUrl = rowMatch[3] || null;
      const logoUrl = rowMatch[4] || null;
      
      if (imageUrl || logoUrl) {
        images.set(id, { id, name, imageUrl, logoUrl });
      }
    }
  }
  
  return images;
}

// استخراج صور الأدوية
function extractDrugImages() {
  const images = new Map();
  
  // البحث عن INSERT INTO drugs
  // الترتيب: id, category_id, name_ar, name_en, image, usage, contraindications, dosage, active_ingredient, disclaimer, slug, ...
  const drugRegex = /\((\d+),\s*(?:\d+|NULL),\s*'([^']*)',\s*(?:'[^']*'|NULL),\s*(?:'([^']*)'|NULL),/g;
  
  // البحث في قسم الأدوية
  const drugsSection = sqlContent.match(/INSERT INTO `drugs`[^;]+;/gi);
  
  if (drugsSection) {
    drugsSection.forEach(section => {
      let match;
      while ((match = drugRegex.exec(section)) !== null) {
        const id = parseInt(match[1]);
        const nameAr = match[2];
        const image = match[3] || null;
        
        if (image && image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          images.set(id, { id, nameAr, image });
        }
      }
    });
  }
  
  return images;
}

// استخراج صور العيادات
function extractClinicImages() {
  const images = new Map();
  
  // البحث عن image_url في العيادات
  const clinicRegex = /\((\d+),\s*'([^']*)',\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:\d+(?:\.\d+)?|NULL),\s*(?:\d+|NULL),\s*(?:\d+|NULL),\s*(?:\d+(?:\.\d+)?|NULL),\s*(?:\d+(?:\.\d+)?|NULL),\s*'([^']*)',\s*(?:'([^']*)'|NULL)/g;
  
  const clinicsSection = sqlContent.match(/INSERT INTO `clinics`[^;]+;/gi);
  
  if (clinicsSection) {
    clinicsSection.forEach(section => {
      let match;
      while ((match = clinicRegex.exec(section)) !== null) {
        const id = parseInt(match[1]);
        const name = match[2];
        const slug = match[3];
        const imageUrl = match[4] || null;
        
        if (imageUrl && imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          images.set(id, { id, name, slug, imageUrl });
        }
      }
    });
  }
  
  return images;
}

// تحديث قاعدة البيانات
function updateDatabase() {
  const db = new Database(dbPath);
  
  // === تحديث صور المستشفيات ===
  console.log('\n--- استخراج صور المستشفيات ---');
  const hospitalImages = extractHospitalImages();
  console.log(`تم العثور على ${hospitalImages.size} صورة مستشفى`);
  
  if (hospitalImages.size > 0) {
    const updateHospital = db.prepare('UPDATE hospitals SET logo = ? WHERE id = ?');
    let hospitalsUpdated = 0;
    
    for (const [id, data] of hospitalImages) {
      try {
        const logo = data.logoUrl || data.imageUrl;
        if (logo) {
          const result = updateHospital.run(logo, id);
          if (result.changes > 0) {
            hospitalsUpdated++;
          }
        }
      } catch (e) {
        // تجاهل الأخطاء
      }
    }
    console.log(`تم تحديث ${hospitalsUpdated} مستشفى`);
  }
  
  // === تحديث صور الأدوية ===
  console.log('\n--- استخراج صور الأدوية ---');
  const drugImages = extractDrugImages();
  console.log(`تم العثور على ${drugImages.size} صورة دواء`);
  
  if (drugImages.size > 0) {
    const updateDrug = db.prepare('UPDATE drugs SET image = ? WHERE legacy_id = ?');
    let drugsUpdated = 0;
    
    for (const [id, data] of drugImages) {
      try {
        const imagePath = `/images/drugs/${data.image}`;
        const result = updateDrug.run(imagePath, id);
        if (result.changes > 0) {
          drugsUpdated++;
        }
      } catch (e) {
        // تجاهل الأخطاء
      }
    }
    console.log(`تم تحديث ${drugsUpdated} دواء`);
  }
  
  // === التحقق من النتائج النهائية ===
  console.log('\n=== التحقق من النتائج النهائية ===');
  
  const stats = {
    hospitals: {
      total: db.prepare('SELECT COUNT(*) as c FROM hospitals').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE logo IS NOT NULL AND logo != '' AND logo NOT LIKE '%default%'`).get().c
    },
    drugs: {
      total: db.prepare('SELECT COUNT(*) as c FROM drugs').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM drugs WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '%default%'`).get().c
    },
    articles: {
      total: db.prepare('SELECT COUNT(*) as c FROM articles').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM articles WHERE image IS NOT NULL AND image != '' AND image NOT LIKE '%default%'`).get().c
    },
    clinics: {
      total: db.prepare('SELECT COUNT(*) as c FROM clinics').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM clinics WHERE logo IS NOT NULL AND logo != '' AND logo NOT LIKE '%default%'`).get().c
    },
    labs: {
      total: db.prepare('SELECT COUNT(*) as c FROM labs').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM labs WHERE logo IS NOT NULL AND logo != '' AND logo NOT LIKE '%default%'`).get().c
    },
    pharmacies: {
      total: db.prepare('SELECT COUNT(*) as c FROM pharmacies').get().c,
      withImages: db.prepare(`SELECT COUNT(*) as c FROM pharmacies WHERE logo IS NOT NULL AND logo != '' AND logo NOT LIKE '%default%'`).get().c
    }
  };
  
  console.log('\nإحصائيات الصور:');
  console.log(`  المستشفيات: ${stats.hospitals.withImages} / ${stats.hospitals.total}`);
  console.log(`  الأدوية: ${stats.drugs.withImages} / ${stats.drugs.total}`);
  console.log(`  المقالات: ${stats.articles.withImages} / ${stats.articles.total}`);
  console.log(`  العيادات: ${stats.clinics.withImages} / ${stats.clinics.total}`);
  console.log(`  المعامل: ${stats.labs.withImages} / ${stats.labs.total}`);
  console.log(`  الصيدليات: ${stats.pharmacies.withImages} / ${stats.pharmacies.total}`);
  
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
