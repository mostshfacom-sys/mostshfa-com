/**
 * فحص حالة الصور في قاعدة البيانات الحالية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 فحص حالة الصور في قاعدة البيانات الحالية...\n');
  
  try {
    // فحص المقالات
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        image: true,
        slug: true
      }
    });
    
    console.log(`📝 المقالات: ${articles.length}`);
    
    const articlesWithImages = articles.filter(a => a.image && a.image.trim() !== '');
    const articlesWithoutImages = articles.filter(a => !a.image || a.image.trim() === '');
    
    console.log(`  ✅ مع صور: ${articlesWithImages.length}`);
    console.log(`  ❌ بدون صور: ${articlesWithoutImages.length}`);
    
    // تحليل أنماط الصور
    const imagePatterns = {
      'mostshfa.com': 0,
      'uploads/': 0,
      'unsplash': 0,
      'placeholder': 0,
      'other': 0
    };
    
    for (const article of articlesWithImages) {
      const img = article.image.toLowerCase();
      if (img.includes('mostshfa.com')) {
        imagePatterns['mostshfa.com']++;
      } else if (img.includes('uploads/')) {
        imagePatterns['uploads/']++;
      } else if (img.includes('unsplash')) {
        imagePatterns['unsplash']++;
      } else if (img.includes('placeholder')) {
        imagePatterns['placeholder']++;
      } else {
        imagePatterns['other']++;
      }
    }
    
    console.log('\n  📊 أنماط الصور:');
    for (const [pattern, count] of Object.entries(imagePatterns)) {
      if (count > 0) {
        console.log(`    • ${pattern}: ${count}`);
      }
    }
    
    // عرض أمثلة
    console.log('\n  📸 أمثلة على الصور:');
    articlesWithImages.slice(0, 10).forEach((a, i) => {
      console.log(`    ${i + 1}. [${a.id}] ${a.title?.substring(0, 30)}...`);
      console.log(`       ${a.image?.substring(0, 60)}...`);
    });
    
    // فحص المستشفيات
    const hospitals = await prisma.hospital.findMany({
      select: { id: true, nameAr: true, logo: true }
    });
    
    const hospitalsWithImages = hospitals.filter(h => h.logo && h.logo.trim() !== '');
    console.log(`\n🏥 المستشفيات: ${hospitals.length}`);
    console.log(`  ✅ مع صور: ${hospitalsWithImages.length}`);
    console.log(`  ❌ بدون صور: ${hospitals.length - hospitalsWithImages.length}`);
    
    // فحص العيادات
    const clinics = await prisma.clinic.findMany({
      select: { id: true, nameAr: true, logo: true }
    });
    
    const clinicsWithImages = clinics.filter(c => c.logo && c.logo.trim() !== '');
    console.log(`\n🏨 العيادات: ${clinics.length}`);
    console.log(`  ✅ مع صور: ${clinicsWithImages.length}`);
    console.log(`  ❌ بدون صور: ${clinics.length - clinicsWithImages.length}`);
    
    // فحص المعامل
    const labs = await prisma.lab.findMany({
      select: { id: true, nameAr: true, logo: true }
    });
    
    const labsWithImages = labs.filter(l => l.logo && l.logo.trim() !== '');
    console.log(`\n🔬 المعامل: ${labs.length}`);
    console.log(`  ✅ مع صور: ${labsWithImages.length}`);
    console.log(`  ❌ بدون صور: ${labs.length - labsWithImages.length}`);
    
    // فحص الصيدليات
    const pharmacies = await prisma.pharmacy.findMany({
      select: { id: true, nameAr: true, logo: true }
    });
    
    const pharmaciesWithImages = pharmacies.filter(p => p.logo && p.logo.trim() !== '');
    console.log(`\n💊 الصيدليات: ${pharmacies.length}`);
    console.log(`  ✅ مع صور: ${pharmaciesWithImages.length}`);
    console.log(`  ❌ بدون صور: ${pharmacies.length - pharmaciesWithImages.length}`);
    
    // ملخص
    console.log('\n' + '='.repeat(50));
    console.log('📊 ملخص حالة الصور:');
    console.log('='.repeat(50));
    console.log(`  📝 المقالات: ${articlesWithImages.length}/${articles.length}`);
    console.log(`  🏥 المستشفيات: ${hospitalsWithImages.length}/${hospitals.length}`);
    console.log(`  🏨 العيادات: ${clinicsWithImages.length}/${clinics.length}`);
    console.log(`  🔬 المعامل: ${labsWithImages.length}/${labs.length}`);
    console.log(`  💊 الصيدليات: ${pharmaciesWithImages.length}/${pharmacies.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
