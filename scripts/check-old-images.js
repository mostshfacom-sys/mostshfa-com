/**
 * فحص مسارات الصور في قاعدة البيانات القديمة
 */

const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

function main() {
  console.log('🔍 فحص مسارات الصور في قاعدة البيانات القديمة...\n');
  
  const content = fs.readFileSync(sqlFilePath, 'utf8');
  
  // البحث عن مسارات الصور في المقالات
  const articleImages = [];
  const imageRegex = /image['"]\s*,\s*['"]([^'"]+)['"]/gi;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const img = match[1];
    if (img && img !== 'NULL' && !articleImages.includes(img)) {
      articleImages.push(img);
    }
  }
  
  // البحث عن image_url
  const imageUrlRegex = /image_url['"]\s*,\s*['"]([^'"]+)['"]/gi;
  const imageUrls = [];
  
  while ((match = imageUrlRegex.exec(content)) !== null) {
    const img = match[1];
    if (img && img !== 'NULL' && !imageUrls.includes(img)) {
      imageUrls.push(img);
    }
  }
  
  // تحليل أنماط الصور
  console.log('📊 تحليل مسارات الصور:\n');
  
  // صور المقالات
  console.log('📝 صور المقالات:');
  const articlePatterns = analyzePatterns(articleImages);
  console.log(`  - إجمالي: ${articleImages.length} صورة`);
  console.log('  - الأنماط:');
  for (const [pattern, count] of Object.entries(articlePatterns)) {
    console.log(`    • ${pattern}: ${count}`);
  }
  
  // عرض أمثلة
  console.log('\n  أمثلة على مسارات الصور:');
  articleImages.slice(0, 10).forEach((img, i) => {
    console.log(`    ${i + 1}. ${img}`);
  });
  
  // صور الكيانات الأخرى
  console.log('\n🏥 صور الكيانات (image_url):');
  const urlPatterns = analyzePatterns(imageUrls);
  console.log(`  - إجمالي: ${imageUrls.length} صورة`);
  console.log('  - الأنماط:');
  for (const [pattern, count] of Object.entries(urlPatterns)) {
    console.log(`    • ${pattern}: ${count}`);
  }
  
  // عرض أمثلة
  console.log('\n  أمثلة:');
  imageUrls.slice(0, 10).forEach((img, i) => {
    console.log(`    ${i + 1}. ${img}`);
  });
  
  // البحث عن مسارات uploads
  console.log('\n📂 البحث عن مسارات uploads:');
  const uploadsRegex = /uploads\/[^'"]+/gi;
  const uploadPaths = new Set();
  
  while ((match = uploadsRegex.exec(content)) !== null) {
    uploadPaths.add(match[0].split('/').slice(0, 2).join('/'));
  }
  
  console.log('  المجلدات المستخدمة:');
  [...uploadPaths].forEach(p => console.log(`    • ${p}`));
}

function analyzePatterns(images) {
  const patterns = {
    'روابط كاملة (http)': 0,
    'مسارات محلية': 0,
    'أسماء ملفات فقط': 0,
    'Unsplash': 0,
    'أخرى': 0
  };
  
  for (const img of images) {
    if (img.startsWith('http://') || img.startsWith('https://')) {
      if (img.includes('unsplash')) {
        patterns['Unsplash']++;
      } else {
        patterns['روابط كاملة (http)']++;
      }
    } else if (img.includes('/')) {
      patterns['مسارات محلية']++;
    } else if (img.includes('.')) {
      patterns['أسماء ملفات فقط']++;
    } else {
      patterns['أخرى']++;
    }
  }
  
  return patterns;
}

main();
