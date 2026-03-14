/**
 * إصلاح الصور في جميع الكيانات
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

const BASE_URL = 'https://mostshfa.com';

async function fixImages() {
  console.log('🖼️ إصلاح الصور في قاعدة البيانات...\n');
  
  try {
    const content = fs.readFileSync(sqlFilePath, 'utf8');
    
    // إصلاح صور المستشفيات
    await fixHospitalImages(content);
    
    // إصلاح صور الصيدليات
    await fixPharmacyImages(content);
    
    // إصلاح صور المعامل
    await fixLabImages(content);
    
    // إصلاح صور العيادات
    await fixClinicImages(content);
    
    // إصلاح صور المقالات
    await fixArticleImages();
    
    console.log('\n✅ تم إصلاح جميع الصور');
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixHospitalImages(sql) {
  console.log('🏥 إصلاح صور المستشفيات...');
  
  // استخراج بيانات المستشفيات من SQL
  const hospitalData = extractHospitalData(sql);
  console.log(`  وجدت ${hospitalData.length} مستشفى في SQL`);
  
  let updated = 0;
  for (const h of hospitalData) {
    if (h.image_url || h.logo_url) {
      try {
        // البحث عن المستشفى بالاسم أو slug
        const hospital = await prisma.hospital.findFirst({
          where: {
            OR: [
              { slug: h.slug },
              { nameAr: h.name }
            ]
          }
        });
        
        if (hospital) {
          let logo = h.logo_url || h.image_url;
          if (logo && !logo.startsWith('http')) {
            logo = BASE_URL + '/uploads/hospitals/' + logo;
          } else if (logo) {
            logo = logo.replace('http://localhost/mostshfa', BASE_URL);
          }
          
          await prisma.hospital.update({
            where: { id: hospital.id },
            data: { logo: logo }
          });
          updated++;
        }
      } catch (e) {
        // تجاهل
      }
    }
  }
  console.log(`  ✓ تم تحديث ${updated} مستشفى`);
}

async function fixPharmacyImages(sql) {
  console.log('💊 إصلاح صور الصيدليات...');
  
  const pharmacyData = extractPharmacyData(sql);
  console.log(`  وجدت ${pharmacyData.length} صيدلية في SQL`);
  
  let updated = 0;
  for (const p of pharmacyData) {
    if (p.image_url) {
      try {
        const pharmacy = await prisma.pharmacy.findFirst({
          where: {
            OR: [
              { slug: p.slug },
              { nameAr: p.name }
            ]
          }
        });
        
        if (pharmacy) {
          let logo = p.image_url;
          if (logo && !logo.startsWith('http')) {
            logo = BASE_URL + '/uploads/pharmacies/' + logo;
          } else if (logo) {
            logo = logo.replace('http://localhost/mostshfa', BASE_URL);
          }
          
          await prisma.pharmacy.update({
            where: { id: pharmacy.id },
            data: { logo: logo }
          });
          updated++;
        }
      } catch (e) {
        // تجاهل
      }
    }
  }
  console.log(`  ✓ تم تحديث ${updated} صيدلية`);
}

async function fixLabImages(sql) {
  console.log('🔬 إصلاح صور المعامل...');
  // المعامل لا تحتوي على صور في الـ schema الحالي
  console.log('  ⏭️ لا توجد حقول صور للمعامل');
}

async function fixClinicImages(sql) {
  console.log('🏨 إصلاح صور العيادات...');
  // العيادات لا تحتوي على صور في الـ schema الحالي
  console.log('  ⏭️ لا توجد حقول صور للعيادات');
}

async function fixArticleImages() {
  console.log('📝 إصلاح صور المقالات...');
  
  // تحديث روابط الصور القديمة
  const articles = await prisma.article.findMany({
    where: {
      image: { contains: 'localhost' }
    }
  });
  
  let updated = 0;
  for (const article of articles) {
    if (article.image) {
      const newImage = article.image.replace('http://localhost/mostshfa', BASE_URL);
      await prisma.article.update({
        where: { id: article.id },
        data: { image: newImage }
      });
      updated++;
    }
  }
  console.log(`  ✓ تم تحديث ${updated} مقال`);
}

function extractHospitalData(sql) {
  const hospitals = [];
  
  // البحث عن INSERT INTO hospitals
  const regex = /INSERT INTO `hospitals`\s*\([^)]+\)\s*VALUES\s*/gi;
  let match = regex.exec(sql);
  
  if (match) {
    const startIndex = match.index + match[0].length;
    let i = startIndex;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentRow = '';
    
    while (i < sql.length) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        currentRow += char;
      } else if (inString && char === stringChar) {
        if (nextChar === stringChar) {
          currentRow += char + nextChar;
          i++;
        } else {
          inString = false;
          currentRow += char;
        }
      } else if (!inString && char === '(') {
        depth++;
        if (depth === 1) currentRow = '';
        else currentRow += char;
      } else if (!inString && char === ')') {
        depth--;
        if (depth === 0) {
          const parsed = parseHospitalRow(currentRow);
          if (parsed) hospitals.push(parsed);
          currentRow = '';
        } else {
          currentRow += char;
        }
      } else if (!inString && char === ';') {
        break;
      } else if (depth > 0) {
        currentRow += char;
      }
      i++;
    }
  }
  
  return hospitals;
}

function parseHospitalRow(row) {
  try {
    const values = parseCSV(row);
    if (values.length >= 20) {
      return {
        id: parseInt(values[0]) || 0,
        name: cleanVal(values[1]),
        slug: cleanVal(values[19]),
        image_url: cleanVal(values[11]),
        logo_url: cleanVal(values[12])
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractPharmacyData(sql) {
  const pharmacies = [];
  
  const regex = /INSERT INTO `pharmacies`\s*\([^)]+\)\s*VALUES\s*/gi;
  let match = regex.exec(sql);
  
  if (match) {
    const startIndex = match.index + match[0].length;
    let i = startIndex;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentRow = '';
    
    while (i < sql.length) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        currentRow += char;
      } else if (inString && char === stringChar) {
        if (nextChar === stringChar) {
          currentRow += char + nextChar;
          i++;
        } else {
          inString = false;
          currentRow += char;
        }
      } else if (!inString && char === '(') {
        depth++;
        if (depth === 1) currentRow = '';
        else currentRow += char;
      } else if (!inString && char === ')') {
        depth--;
        if (depth === 0) {
          const parsed = parsePharmacyRow(currentRow);
          if (parsed) pharmacies.push(parsed);
          currentRow = '';
        } else {
          currentRow += char;
        }
      } else if (!inString && char === ';') {
        break;
      } else if (depth > 0) {
        currentRow += char;
      }
      i++;
    }
  }
  
  return pharmacies;
}

function parsePharmacyRow(row) {
  try {
    const values = parseCSV(row);
    if (values.length >= 15) {
      return {
        id: parseInt(values[0]) || 0,
        name: cleanVal(values[1]),
        slug: cleanVal(values[14]),
        image_url: cleanVal(values[16])
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

function parseCSV(row) {
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      if (nextChar === stringChar) {
        current += char;
        i++;
      } else {
        inString = false;
      }
    } else if (!inString && char === ',') {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function cleanVal(val) {
  if (!val || val === 'NULL' || val === 'null') return null;
  return val.replace(/^['"]|['"]$/g, '').trim();
}

fixImages();
