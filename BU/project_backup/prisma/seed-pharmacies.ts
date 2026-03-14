import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pharmacyNames = [
  'صيدلية العزبي', 'صيدليات مصر', 'صيدلية سيف', 'صيدليات 19011', 'صيدلية رشدي', 'صيدلية علي وعلي',
  'صيدلية نورماندي', 'صيدليات الدواء', 'صيدلية أبو ذكري', 'صيدلية شفاء', 'صيدلية الصحة', 'صيدلية الأمل',
  'صيدلية النور', 'صيدلية الشفاء', 'صيدلية الرحمة', 'صيدلية المروة', 'صيدلية الإيمان', 'صيدلية التقوى',
  'صيدلية القدس', 'صيدلية السلام', 'صيدلية النهضة', 'صيدلية القاهرة', 'صيدلية الجيزة', 'صيدلية الإسكندرية',
  'صيدلية طيبة', 'صيدلية زمزم', 'صيدلية المدينة', 'صيدلية الحجاز', 'صيدلية الأندلس', 'صيدلية الفاروق'
];

const pharmacyImages = [
  'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&q=80',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
  'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80',
  'https://images.unsplash.com/photo-1665061828011-282424b9ad0d?w=800&q=80',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=800&q=80',
  'https://images.unsplash.com/photo-1628771065518-0d82f1110503?w=800&q=80',
  'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80',
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80'
];

async function seed() {
  console.log('Clearing existing pharmacy data...');
  await prisma.pharmacy.deleteMany({});
  
  console.log('Starting pharmacy seeding (500+)...');

  const govs = await prisma.governorate.findMany({ include: { cities: true } });
  
  let totalCount = 0;
  const targetCount = 550;

  for (const gov of govs) {
    if (totalCount >= targetCount) break;

    for (const city of gov.cities) {
      if (totalCount >= targetCount) break;

      // 1-3 pharmacies per city
      const numPharmacies = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numPharmacies; i++) {
        const baseName = pharmacyNames[Math.floor(Math.random() * pharmacyNames.length)];
        const suffix = i > 0 ? ` - فرع ${i + 1}` : '';
        const nameAr = `${baseName}${suffix}`;
        const nameEn = `Pharmacy ${totalCount + 1}`;
        
        const slug = `pharmacy-${totalCount + 1}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Random attributes
        const is24h = Math.random() > 0.4;
        const hasDelivery = Math.random() > 0.2;
        const hasNursing = Math.random() > 0.7; // 30% have nursing
        const isFeatured = Math.random() > 0.9;
        
        const latBase = gov.nameAr === 'القاهرة' ? 30.0444 : 26.8206;
        const lngBase = gov.nameAr === 'القاهرة' ? 31.2357 : 30.8025;

        await prisma.pharmacy.create({
          data: {
            nameAr,
            nameEn,
            slug,
            addressAr: `${city.nameAr}، ${gov.nameAr}، مصر`,
            phone: '0' + (1000000000 + Math.floor(Math.random() * 999999999)).toString(),
            hotline: Math.random() > 0.5 ? '19' + Math.floor(Math.random() * 999).toString().padStart(3, '0') : null,
            image: pharmacyImages[Math.floor(Math.random() * pharmacyImages.length)],
            logo: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nameAr) + '&background=random',
            governorateId: gov.id,
            cityId: city.id,
            is24h,
            hasDeliveryService: hasDelivery,
            hasNursingService: hasNursing,
            isFeatured,
            isOpen: true,
            ratingAvg: 3.8 + Math.random() * 1.2,
            ratingCount: Math.floor(Math.random() * 300) + 10,
            lat: latBase + (Math.random() - 0.5) * 0.2,
            lng: lngBase + (Math.random() - 0.5) * 0.2,
            hours: is24h ? '24 ساعة' : '9:00 AM - 11:00 PM',
            workingHours: JSON.stringify({
               note: is24h ? 'مفتوح 24 ساعة' : 'يومياً من 9 صباحاً حتى 11 مساءً'
            }),
            services: JSON.stringify([
              'قياس ضغط', 'قياس سكر', 'حقن عضل', 'تركيب محاليل'
            ].filter(() => Math.random() > 0.3))
          }
        });
        
        totalCount++;
        if (totalCount % 50 === 0) console.log(`Seeded ${totalCount} pharmacies...`);
      }
    }
  }

  console.log(`Successfully seeded ${totalCount} pharmacies with full data and images.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
