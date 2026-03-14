import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitalNames = [
  'دار الفؤاد', 'السلام الدولي', 'كليوباترا', 'السعودي الألماني', 'القوات الجوية', 'عين شمس التخصصي', 
  'النيل بدراوي', 'الشرطة', 'دار الشفاء', 'المبرة', 'الحياة', 'الرحمة', 'الأمل', 'النور', 'الشفاء', 
  'طيبة', 'النيل', 'النخبة', 'المدينة', 'الصفوة', 'العاصمة', 'المركز الطبي', 'المستشفى العام', 
  'المستشفى التعليمي', 'المستشفى الجامعي', 'معهد ناصر', 'بهية', '57357', 'مجدي يعقوب', 'أندلسية',
  'تبارك', 'الكاتب', 'القاهرة التخصصي', 'مصر الدولي', 'الدلتا', 'المواساة', 'المستشفى الإيطالي',
  'المستشفى اليوناني', 'المستشفى الفرنسي', 'مستشفى الهلال', 'مستشفى الحسين', 'مستشفى سيد جلال'
];

const prefixes = ['مستشفى', 'مركز', 'معهد', 'مجمع'];
const suffixes = ['التخصصي', 'الدولي', 'الجديد', 'العام', 'التعليمي', 'فرع 1', 'فرع 2', 'المتميز'];

const types = ['general', 'specialized', 'university', 'military', 'private', 'center', 'charity', 'teaching'];

const governorates = [
  { nameAr: 'القاهرة', cities: ['مدينة نصر', 'المعادي', 'مصر الجديدة', 'التجمع الخامس', 'الزمالك', 'المنيل', 'شبرا', 'حلوان', 'المرج', 'عين شمس'] },
  { nameAr: 'الجيزة', cities: ['الدقي', 'المهندسين', '6 أكتوبر', 'الشيخ زايد', 'الهرم', 'العجوزة', 'فيصل', 'الحوامدية', 'البدرشين'] },
  { nameAr: 'الإسكندرية', cities: ['سموحة', 'ميامي', 'المنشية', 'الشاطبي', 'العصافرة', 'سيدي جابر', 'لوران', 'زيزينيا'] },
  { nameAr: 'القليوبية', cities: ['بنها', 'شبرا الخيمة', 'قليوب', 'الخانكة'] },
  { nameAr: 'المنوفية', cities: ['شبين الكوم', 'منوف', 'قويسنا', 'السادات'] },
  { nameAr: 'الغربية', cities: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'بسيون'] },
  { nameAr: 'الدقهلية', cities: ['المنصورة', 'طلخا', 'ميت غمر', 'دكرنس'] },
  { nameAr: 'الشرقية', cities: ['الزقازيق', 'بلبيس', 'منيا القمح', 'فاقوس'] },
  { nameAr: 'البحيرة', cities: ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'كوم حمادة'] },
  { nameAr: 'كفر الشيخ', cities: ['كفر الشيخ', 'دسوق', 'فوه', 'مطوبس'] },
  { nameAr: 'دمياط', cities: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور'] },
  { nameAr: 'بورسعيد', cities: ['بورسعيد', 'بورفؤاد'] },
  { nameAr: 'الإسماعيلية', cities: ['الإسماعيلية', 'التل الكبير', 'فايد'] },
  { nameAr: 'السويس', cities: ['السويس'] },
  { nameAr: 'الفيوم', cities: ['الفيوم', 'إطسا', 'طامية'] },
  { nameAr: 'بني سويف', cities: ['بني سويف', 'ببا', 'الواسطى'] },
  { nameAr: 'المنيا', cities: ['المنيا', 'ملوي', 'مغاغة'] },
  { nameAr: 'أسيوط', cities: ['أسيوط', 'ديروط', 'منفلوط'] },
  { nameAr: 'سوهاج', cities: ['سوهاج', 'أخميم', 'طما'] },
  { nameAr: 'قنا', cities: ['قنا', 'نجع حمادي', 'دشنا'] },
  { nameAr: 'الأقصر', cities: ['الأقصر', 'إسنا', 'أرمنت'] },
  { nameAr: 'أسوان', cities: ['أسوان', 'إدفو', 'كوم أمبو'] },
  { nameAr: 'البحر الأحمر', cities: ['الغردقة', 'سفاجا', 'القصير'] },
  { nameAr: 'الوادي الجديد', cities: ['الخارجة', 'الداخلة'] },
  { nameAr: 'مطروح', cities: ['مرسى مطروح', 'العلمين'] },
  { nameAr: 'شمال سيناء', cities: ['العريش'] },
  { nameAr: 'جنوب سيناء', cities: ['شرم الشيخ', 'طور سيناء'] },
];

const hospitalImages = [
  'https://images.unsplash.com/photo-1587351021759-3e566b9af92c?w=800&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
  'https://images.unsplash.com/photo-1538108149393-fbbd8189718c?w=800&q=80',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
  'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&q=80',
  'https://images.unsplash.com/photo-1516574187841-69301976e499?w=800&q=80',
  'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&q=80',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
  'https://images.unsplash.com/photo-1579684385136-137af75461bb?w=800&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
  'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80'
];

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const hospitalTypes = [
  { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', icon: 'building-office-2', isActive: true },
  { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', icon: 'star', isActive: true },
  { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', icon: 'academic-cap', isActive: true },
  { nameAr: 'مستشفى عسكري', nameEn: 'Military Hospital', slug: 'military', icon: 'shield-check', isActive: true },
  { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', icon: 'currency-dollar', isActive: true },
  { nameAr: 'مركز طبي', nameEn: 'Medical Center', slug: 'center', icon: 'building-storefront', isActive: true },
  { nameAr: 'مستشفى خيري', nameEn: 'Charity Hospital', slug: 'charity', icon: 'heart', isActive: true },
  { nameAr: 'مستشفى تعليمي', nameEn: 'Teaching Hospital', slug: 'teaching', icon: 'book-open', isActive: true },
];

async function seed() {
  console.log('Starting massive hospital seeding (5000+)...');

  // Seed Types first
  console.log('Seeding types...');
  for (const t of hospitalTypes) {
    await prisma.hospitalType.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }

  // Cache IDs
  const typesData = await prisma.hospitalType.findMany();
  const typeMap = new Map(typesData.map(t => [t.slug, t.id]));
  
  const citiesData = await prisma.city.findMany({ include: { governorate: true } });
  const cityMap = new Map(citiesData.map(c => [`${c.governorate.nameAr}-${c.nameAr}`, c]));
  
  const specialtiesData = await prisma.specialty.findMany();
  const specIds = specialtiesData.map(s => s.id);

  let totalCount = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < 50; i++) { // 50 batches of 100 = 5000
    const hospitalsToCreate = [];
    
    for (let j = 0; j < BATCH_SIZE; j++) {
      const gov = governorates[Math.floor(Math.random() * governorates.length)];
      const cityName = gov.cities[Math.floor(Math.random() * gov.cities.length)];
      const city = cityMap.get(`${gov.nameAr}-${cityName}`);
      
      if (!city) continue;

      const baseName = hospitalNames[Math.floor(Math.random() * hospitalNames.length)];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const nameAr = `${prefix} ${baseName} ${suffix}`.trim();
      const nameEn = `Hospital ${totalCount + 1}`; // Simple English name for scale
      
      const slug = `hosp-${totalCount + 1}-${Math.random().toString(36).substr(2, 5)}`;
      const typeSlug = types[Math.floor(Math.random() * types.length)];
      const typeId = typeMap.get(typeSlug) || typeMap.get('private');
      
      const lat = city.governorate.nameAr === 'القاهرة' ? 30.0444 : 26.8206; // Mock jitter
      const lng = city.governorate.nameAr === 'القاهرة' ? 31.2357 : 30.8025;

      hospitalsToCreate.push({
        nameAr: nameAr,
        nameEn: nameEn,
        slug: slug,
        address: `${cityName}، ${gov.nameAr}، مصر`,
        phone: '19' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        logo: hospitalImages[Math.floor(Math.random() * hospitalImages.length)],
        description: `نحن ملتزمون بتقديم أفضل رعاية طبية في ${cityName}. نضم نخبة من الاستشاريين في كافة التخصصات.`,
        hasEmergency: Math.random() > 0.2,
        isFeatured: Math.random() > 0.95,
        ratingAvg: 3.5 + Math.random() * 1.5,
        ratingCount: Math.floor(Math.random() * 1000),
        lat: lat + (Math.random() - 0.5) * 0.1,
        lng: lng + (Math.random() - 0.5) * 0.1,
        typeId: typeId,
        governorateId: city.governorateId,
        cityId: city.id,
        workingHours: JSON.stringify({ note: 'Open 24/7' })
      });
      
      totalCount++;
    }

    await prisma.hospital.createMany({ data: hospitalsToCreate });
    console.log(`Seeded batch ${i + 1} (${totalCount} hospitals total)`);
  }

  console.log('Seeding specialties and working hours for some hospitals...');
  // For performance, we only add detailed relations to the first 100
  const someHospitals = await prisma.hospital.findMany({ take: 100, select: { id: true, hasEmergency: true } });
  for (const h of someHospitals) {
    // Add 3 random specialties
    const shuffledSpecs = specIds.sort(() => 0.5 - Math.random());
    const selectedSpecs = shuffledSpecs.slice(0, 3);
    
    await prisma.hospital.update({
        where: { id: h.id },
        data: {
            specialties: { connect: selectedSpecs.map(id => ({ id })) }
        }
    });

    for (const day of days) {
      await prisma.workingHour.create({
        data: {
          hospitalId: h.id,
          day: day,
          openTime: '00:00',
          closeTime: '23:59',
          isClosed: false
        }
      });
    }
  }

  console.log('Massive seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
