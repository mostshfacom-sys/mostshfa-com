/**
 * إضافة صور افتراضية للكيانات التي ليس لها صور
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// صور افتراضية من Unsplash
const DEFAULT_IMAGES = {
  hospital: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
  pharmacy: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&h=300&fit=crop',
  lab: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop',
  clinic: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
  article: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=400&fit=crop'
};

// مجموعة صور متنوعة للمستشفيات
const HOSPITAL_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&h=300&fit=crop'
];

// صور متنوعة للمقالات الطبية
const ARTICLE_IMAGES = [
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&h=400&fit=crop'
];

async function addDefaultImages() {
  console.log('🖼️ إضافة صور افتراضية...\n');
  
  try {
    // إضافة صور للمستشفيات
    console.log('🏥 المستشفيات...');
    const hospitals = await prisma.hospital.findMany({
      where: { logo: null }
    });
    
    let count = 0;
    for (const h of hospitals) {
      const img = HOSPITAL_IMAGES[count % HOSPITAL_IMAGES.length];
      await prisma.hospital.update({
        where: { id: h.id },
        data: { logo: img }
      });
      count++;
    }
    console.log(`  ✓ تم تحديث ${count} مستشفى`);
    
    // إضافة صور للصيدليات
    console.log('💊 الصيدليات...');
    const pharmacies = await prisma.pharmacy.findMany({
      where: { logo: null }
    });
    
    count = 0;
    for (const p of pharmacies) {
      await prisma.pharmacy.update({
        where: { id: p.id },
        data: { logo: DEFAULT_IMAGES.pharmacy }
      });
      count++;
    }
    console.log(`  ✓ تم تحديث ${count} صيدلية`);
    
    // إضافة صور للمقالات
    console.log('📝 المقالات...');
    const articles = await prisma.article.findMany({
      where: { 
        OR: [
          { image: null },
          { image: '' }
        ]
      }
    });
    
    count = 0;
    for (const a of articles) {
      const img = ARTICLE_IMAGES[count % ARTICLE_IMAGES.length];
      await prisma.article.update({
        where: { id: a.id },
        data: { image: img }
      });
      count++;
    }
    console.log(`  ✓ تم تحديث ${count} مقال`);
    
    // إحصائيات نهائية
    console.log('\n📊 الإحصائيات النهائية:');
    
    const hospitalsWithImages = await prisma.hospital.count({
      where: { logo: { not: null } }
    });
    const totalHospitals = await prisma.hospital.count();
    console.log(`  🏥 المستشفيات: ${hospitalsWithImages}/${totalHospitals} لديها صور`);
    
    const articlesWithImages = await prisma.article.count({
      where: { image: { not: null } }
    });
    const totalArticles = await prisma.article.count();
    console.log(`  📝 المقالات: ${articlesWithImages}/${totalArticles} لديها صور`);
    
    console.log('\n✅ تم بنجاح!');
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultImages();
