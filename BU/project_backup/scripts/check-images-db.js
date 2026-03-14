const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImages() {
  try {
    // إحصائيات المستشفيات
    const hospitalsTotal = await prisma.hospital.count();
    const hospitalsWithLogo = await prisma.hospital.count({
      where: { logo: { not: null } }
    });
    console.log(`=== المستشفيات ===`);
    console.log(`الإجمالي: ${hospitalsTotal}, مع صور: ${hospitalsWithLogo}`);

    // إحصائيات المقالات
    const articlesTotal = await prisma.article.count();
    const articlesWithImage = await prisma.article.count({
      where: { image: { not: null } }
    });
    console.log(`\n=== المقالات ===`);
    console.log(`الإجمالي: ${articlesTotal}, مع صور: ${articlesWithImage}`);

    // إحصائيات الأدوية
    const drugsTotal = await prisma.drug.count();
    const drugsWithImage = await prisma.drug.count({
      where: { 
        image: { not: null },
        NOT: { image: 'no_image.jpg' }
      }
    });
    console.log(`\n=== الأدوية ===`);
    console.log(`الإجمالي: ${drugsTotal}, مع صور: ${drugsWithImage}`);

    // إحصائيات العيادات
    const clinicsTotal = await prisma.clinic.count();
    const clinicsWithLogo = await prisma.clinic.count({
      where: { logo: { not: null } }
    });
    console.log(`\n=== العيادات ===`);
    console.log(`الإجمالي: ${clinicsTotal}, مع صور: ${clinicsWithLogo}`);

    // إحصائيات المعامل
    const labsTotal = await prisma.lab.count();
    const labsWithLogo = await prisma.lab.count({
      where: { logo: { not: null } }
    });
    console.log(`\n=== المعامل ===`);
    console.log(`الإجمالي: ${labsTotal}, مع صور: ${labsWithLogo}`);

    // إحصائيات الصيدليات
    const pharmaciesTotal = await prisma.pharmacy.count();
    const pharmaciesWithLogo = await prisma.pharmacy.count({
      where: { logo: { not: null } }
    });
    console.log(`\n=== الصيدليات ===`);
    console.log(`الإجمالي: ${pharmaciesTotal}, مع صور: ${pharmaciesWithLogo}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
