/**
 * فحص قاعدة البيانات الحالية باستخدام Prisma
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('📊 فحص قاعدة البيانات الحالية...\n');

  try {
    // عدد المقالات
    const articleCount = await prisma.article.count();
    console.log('عدد المقالات الحالية:', articleCount);

    // المقالات مع الصور
    const withImages = await prisma.article.count({
      where: {
        image: { not: null }
      }
    });
    console.log('المقالات مع صور:', withImages);

    // عينة من المقالات
    const samples = await prisma.article.findMany({
      take: 5,
      select: { id: true, title: true, image: true }
    });
    console.log('\n📝 عينة من المقالات:');
    samples.forEach(a => {
      console.log('- ' + (a.title ? a.title.substring(0, 50) : 'بدون عنوان') + '...');
      console.log('  الصورة:', a.image || 'لا توجد');
    });

    // فحص المستشفيات
    const hospitalCount = await prisma.hospital.count();
    console.log('\n🏥 عدد المستشفيات:', hospitalCount);

    const hospitalsWithLogo = await prisma.hospital.count({
      where: { logo: { not: null } }
    });
    console.log('المستشفيات مع شعار:', hospitalsWithLogo);

    // عينة من المستشفيات
    const hospitalSamples = await prisma.hospital.findMany({
      take: 3,
      select: { id: true, nameAr: true, logo: true }
    });
    console.log('\nعينة من المستشفيات:');
    hospitalSamples.forEach(h => {
      console.log('- ' + h.nameAr);
      console.log('  الشعار:', h.logo || 'لا يوجد');
    });

    // فحص الصيدليات
    const pharmacyCount = await prisma.pharmacy.count();
    console.log('\n💊 عدد الصيدليات:', pharmacyCount);

    // فحص المعامل
    const labCount = await prisma.lab.count();
    console.log('🔬 عدد المعامل:', labCount);

    // فحص العيادات
    const clinicCount = await prisma.clinic.count();
    console.log('🏨 عدد العيادات:', clinicCount);

    // فحص الأدوية
    const drugCount = await prisma.drug.count();
    console.log('💉 عدد الأدوية:', drugCount);

    console.log('\n✅ تم الفحص بنجاح');
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
