/**
 * تحليل صور المقالات من قاعدة البيانات القديمة
 */

const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

function main() {
  console.log('🔍 تحليل صور المقالات من قاعدة البيانات...\n');
  
  const content = fs.readFileSync(sqlFilePath, 'utf8');
  
  // البحث عن جدول المقالات
  const articlesMatch = content.match(/INSERT INTO `?contentapp_article`?\s+VALUES\s*\(([^;]+)\);/gi);
  
  if (!articlesMatch) {
    console.log('❌ لم يتم العثور على بيانات المقالات');
    
    // محاولة البحث بطريقة أخرى
    console.log('\n🔄 محاولة البحث بطريقة أخرى...');
    
    // البحث عن أي ذكر للصور
    const allImages = [];
    
    // البحث عن uploads/articles
    const uploadsRegex = /uploads\/articles\/[^'")\s,]+/gi;
    let match;
    while ((match = uploadsRegex.exec(content)) !== null) {
      if (!allImages.includes(match[0])) {
        allImages.push(match[0]);
      }
    }
    
    console.log(`\n📸 صور المقالات المكتشفة: ${allImages.length}`);
    allImages.slice(0, 20).forEach((img, i) => {
      console.log(`  ${i + 1}. ${img}`);
    });
    
    // البحث عن صور المستشفيات
    const hospitalImages = [];
    const hospitalRegex = /uploads\/hospitals\/[^'")\s,]+/gi;
    while ((match = hospitalRegex.exec(content)) !== null) {
      if (!hospitalImages.includes(match[0])) {
        hospitalImages.push(match[0]);
      }
    }
    
    console.log(`\n🏥 صور المستشفيات: ${hospitalImages.length}`);
    hospitalImages.slice(0, 10).forEach((img, i) => {
      console.log(`  ${i + 1}. ${img}`);
    });
    
    // البحث عن صور العيادات
    const clinicImages = [];
    const clinicRegex = /uploads\/clinics\/[^'")\s,]+/gi;
    while ((match = clinicRegex.exec(content)) !== null) {
      if (!clinicImages.includes(match[0])) {
        clinicImages.push(match[0]);
      }
    }
    
    console.log(`\n🏨 صور العيادات: ${clinicImages.length}`);
    
    // البحث عن صور الصيدليات
    const pharmacyImages = [];
    const pharmacyRegex = /uploads\/pharmacies\/[^'")\s,]+/gi;
    while ((match = pharmacyRegex.exec(content)) !== null) {
      if (!pharmacyImages.includes(match[0])) {
        pharmacyImages.push(match[0]);
      }
    }
    
    console.log(`💊 صور الصيدليات: ${pharmacyImages.length}`);
    
    // ملخص
    console.log('\n' + '='.repeat(50));
    console.log('📊 ملخص الصور:');
    console.log('='.repeat(50));
    console.log(`  📝 المقالات: ${allImages.length}`);
    console.log(`  🏥 المستشفيات: ${hospitalImages.length}`);
    console.log(`  🏨 العيادات: ${clinicImages.length}`);
    console.log(`  💊 الصيدليات: ${pharmacyImages.length}`);
    console.log(`  📦 الإجمالي: ${allImages.length + hospitalImages.length + clinicImages.length + pharmacyImages.length}`);
    
    // حفظ قائمة الصور
    const allImagesList = {
      articles: allImages,
      hospitals: hospitalImages,
      clinics: clinicImages,
      pharmacies: pharmacyImages
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'images-list.json'),
      JSON.stringify(allImagesList, null, 2),
      'utf8'
    );
    console.log('\n✅ تم حفظ قائمة الصور في: scripts/images-list.json');
    
    return;
  }
  
  console.log(`✅ تم العثور على ${articlesMatch.length} سجل`);
}

main();
