/**
 * تحليل ملف SQL القديم لمعرفة عدد المقالات والصور
 */
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

console.log('📊 تحليل ملف SQL القديم...\n');

try {
  const content = fs.readFileSync(sqlFilePath, 'utf8');
  
  // عدد المقالات
  const articlesMatch = content.match(/INSERT INTO `articles`[^;]+VALUES([^;]+);/is);
  if (articlesMatch) {
    const values = articlesMatch[1];
    const rowCount = (values.match(/\(\d+,/g) || []).length;
    console.log('عدد المقالات في SQL:', rowCount);
  }
  
  // عدد المستشفيات
  const hospitalsMatch = content.match(/INSERT INTO `hospitals`[^;]+VALUES([^;]+);/is);
  if (hospitalsMatch) {
    const values = hospitalsMatch[1];
    const rowCount = (values.match(/\(\d+,/g) || []).length;
    console.log('عدد المستشفيات في SQL:', rowCount);
  }
  
  // عدد التصنيفات
  const categoriesMatch = content.match(/INSERT INTO `article_categories`[^;]+VALUES([^;]+);/is);
  if (categoriesMatch) {
    const values = categoriesMatch[1];
    const rowCount = (values.match(/\(\d+,/g) || []).length;
    console.log('عدد تصنيفات المقالات:', rowCount);
  }
  
  // البحث عن روابط الصور
  const imageUrls = content.match(/https?:\/\/[^\s'",)]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
  console.log('\nعدد روابط الصور المكتشفة:', imageUrls.length);
  
  // عينة من روابط الصور
  const uniqueImages = [...new Set(imageUrls)].slice(0, 5);
  console.log('\nعينة من روابط الصور:');
  uniqueImages.forEach(img => console.log('  -', img.substring(0, 80) + '...'));
  
  // البحث عن أسماء ملفات الصور
  const imageFiles = content.match(/'[^']*\.(jpg|jpeg|png|gif|webp)'/gi) || [];
  console.log('\nعدد أسماء ملفات الصور:', imageFiles.length);
  
  console.log('\n✅ تم التحليل');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
}
