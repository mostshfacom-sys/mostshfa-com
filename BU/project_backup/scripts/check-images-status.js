/**
 * سكريبت للتحقق من حالة الصور في قاعدة البيانات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📊 تقرير حالة الصور في قاعدة البيانات\n');
  console.log('='.repeat(60));

  // 1. المستشفيات
  const hospitals = await prisma.hospital.findMany({ select: { id: true, nameAr: true, logo: true } });
  const hospitalsWithLogo = hospitals.filter(h => h.logo && h.logo.length > 0);
  console.log(`\n📍 المستشفيات:`);
  console.log(`   إجمالي: ${hospitals.length}`);
  console.log(`   مع صور: ${hospitalsWithLogo.length}`);
  console.log(`   بدون صور: ${hospitals.length - hospitalsWithLogo.length}`);
  if (hospitalsWithLogo.length > 0) {
    console.log(`   مثال: ${hospitalsWithLogo[0].logo}`);
  }

  // 2. العيادات
  const clinics = await prisma.clinic.findMany({ select: { id: true, nameAr: true, logo: true } });
  const clinicsWithLogo = clinics.filter(c => c.logo && c.logo.length > 0);
  console.log(`\n🏥 العيادات:`);
  console.log(`   إجمالي: ${clinics.length}`);
  console.log(`   مع صور: ${clinicsWithLogo.length}`);
  console.log(`   بدون صور: ${clinics.length - clinicsWithLogo.length}`);
  if (clinicsWithLogo.length > 0) {
    console.log(`   مثال: ${clinicsWithLogo[0].logo}`);
  }

  // 3. المعامل
  const labs = await prisma.lab.findMany({ select: { id: true, nameAr: true, logo: true } });
  const labsWithLogo = labs.filter(l => l.logo && l.logo.length > 0);
  console.log(`\n🔬 المعامل:`);
  console.log(`   إجمالي: ${labs.length}`);
  console.log(`   مع صور: ${labsWithLogo.length}`);
  console.log(`   بدون صور: ${labs.length - labsWithLogo.length}`);
  if (labsWithLogo.length > 0) {
    console.log(`   مثال: ${labsWithLogo[0].logo}`);
  }

  // 4. الصيدليات
  const pharmacies = await prisma.pharmacy.findMany({ select: { id: true, nameAr: true, logo: true } });
  const pharmaciesWithLogo = pharmacies.filter(p => p.logo && p.logo.length > 0);
  console.log(`\n💊 الصيدليات:`);
  console.log(`   إجمالي: ${pharmacies.length}`);
  console.log(`   مع صور: ${pharmaciesWithLogo.length}`);
  console.log(`   بدون صور: ${pharmacies.length - pharmaciesWithLogo.length}`);
  if (pharmaciesWithLogo.length > 0) {
    console.log(`   مثال: ${pharmaciesWithLogo[0].logo}`);
  }

  // 5. الأدوية
  const drugs = await prisma.drug.findMany({ select: { id: true, nameAr: true, image: true } });
  const drugsWithImage = drugs.filter(d => d.image && d.image.length > 0);
  console.log(`\n💉 الأدوية:`);
  console.log(`   إجمالي: ${drugs.length}`);
  console.log(`   مع صور: ${drugsWithImage.length}`);
  console.log(`   بدون صور: ${drugs.length - drugsWithImage.length}`);
  if (drugsWithImage.length > 0) {
    console.log(`   مثال: ${drugsWithImage[0].image}`);
  }

  // 6. المقالات
  const articles = await prisma.article.findMany({ select: { id: true, title: true, image: true } });
  const articlesWithImage = articles.filter(a => a.image && a.image.length > 0);
  console.log(`\n📰 المقالات:`);
  console.log(`   إجمالي: ${articles.length}`);
  console.log(`   مع صور: ${articlesWithImage.length}`);
  console.log(`   بدون صور: ${articles.length - articlesWithImage.length}`);
  if (articlesWithImage.length > 0) {
    console.log(`   مثال: ${articlesWithImage[0].image}`);
  }

  // 7. الطاقم الطبي
  const staff = await prisma.staff.findMany({ select: { id: true, nameAr: true, image: true } });
  const staffWithImage = staff.filter(s => s.image && s.image.length > 0);
  console.log(`\n👨‍⚕️ الطاقم الطبي:`);
  console.log(`   إجمالي: ${staff.length}`);
  console.log(`   مع صور: ${staffWithImage.length}`);
  console.log(`   بدون صور: ${staff.length - staffWithImage.length}`);
  if (staffWithImage.length > 0) {
    console.log(`   مثال: ${staffWithImage[0].image}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهى التقرير');
}

main()
  .catch(e => console.error('❌ خطأ:', e))
  .finally(() => prisma.$disconnect());
