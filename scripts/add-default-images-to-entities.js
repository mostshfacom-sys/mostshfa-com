/**
 * إضافة صور افتراضية للعيادات والمعامل
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// صور افتراضية من Unsplash للعيادات
const clinicImages = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800',
  'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800',
  'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800'
];

// صور افتراضية من Unsplash للمعامل
const labImages = [
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800',
  'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800',
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800',
  'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
  'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800',
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800'
];

async function main() {
  console.log('🖼️ إضافة صور افتراضية للعيادات والمعامل...\n');
  
  try {
    // تحديث العيادات
    const clinics = await prisma.clinic.findMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      }
    });
    
    console.log(`🏨 العيادات بدون صور: ${clinics.length}`);
    
    for (let i = 0; i < clinics.length; i++) {
      const clinic = clinics[i];
      const imageUrl = clinicImages[i % clinicImages.length];
      
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: { logo: imageUrl }
      });
      
      console.log(`  ✅ ${clinic.nameAr || clinic.nameEn}`);
    }
    
    // تحديث المعامل
    const labs = await prisma.lab.findMany({
      where: {
        OR: [
          { logo: null },
          { logo: '' }
        ]
      }
    });
    
    console.log(`\n🔬 المعامل بدون صور: ${labs.length}`);
    
    for (let i = 0; i < labs.length; i++) {
      const lab = labs[i];
      const imageUrl = labImages[i % labImages.length];
      
      await prisma.lab.update({
        where: { id: lab.id },
        data: { logo: imageUrl }
      });
      
      console.log(`  ✅ ${lab.nameAr || lab.nameEn}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ تم إضافة الصور الافتراضية بنجاح!');
    console.log('='.repeat(50));
    console.log(`  🏨 العيادات: ${clinics.length}`);
    console.log(`  🔬 المعامل: ${labs.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
