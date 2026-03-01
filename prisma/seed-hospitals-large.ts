import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitalTemplates = [
  {
    nameAr: 'مستشفى دار الفؤاد',
    nameEn: 'Dar Al Fouad Hospital',
    type: 'private',
    ratingBase: 4.8,
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b9af92c?w=800&q=80',
    desc: 'صرح طبي متميز يقدم خدمات صحية عالمية المستوى، معتمد من اللجنة الدولية المشتركة JCI.'
  },
  {
    nameAr: 'مستشفى السلام الدولي',
    nameEn: 'As-Salam International Hospital',
    type: 'private',
    ratingBase: 4.7,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    desc: 'مستشفى رائد يقدم رعاية طبية شاملة بأحدث التقنيات.'
  },
  {
    nameAr: 'مستشفى كليوباترا',
    nameEn: 'Cleopatra Hospital',
    type: 'private',
    ratingBase: 4.6,
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    desc: 'جزء من مجموعة كليوباترا، أكبر مجموعة مستشفيات خاصة في مصر.'
  },
  {
    nameAr: 'مستشفى السعودي الألماني',
    nameEn: 'Saudi German Hospital',
    type: 'private',
    ratingBase: 4.5,
    image: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&q=80',
    desc: 'جزء من مجموعة مستشفيات السعودي الألماني الرائدة في المنطقة.'
  },
  {
    nameAr: 'مستشفى القوات الجوية',
    nameEn: 'Air Force Hospital',
    type: 'military',
    ratingBase: 4.6,
    image: 'https://images.unsplash.com/photo-1516574187841-69301976e499?w=800&q=80',
    desc: 'صرح طبي عسكري متميز يخدم العسكريين والمدنيين.'
  },
  {
    nameAr: 'مستشفى عين شمس التخصصي',
    nameEn: 'Ain Shams Specialized Hospital',
    type: 'university',
    ratingBase: 4.1,
    image: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&q=80',
    desc: 'مستشفى جامعي تخصصي يقدم خدمات طبية متميزة بأسعار اقتصادية.'
  },
  {
    nameAr: 'مستشفى النيل بدراوي',
    nameEn: 'Nile Badrawi Hospital',
    type: 'private',
    ratingBase: 4.3,
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    desc: 'مستشفى خاص عريق يطل على النيل، معروف بتميزه في الجراحات الدقيقة.'
  },
  {
    nameAr: 'مستشفى الشرطة',
    nameEn: 'Police Hospital',
    type: 'military',
    ratingBase: 4.4,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    desc: 'مستشفى مجهز بأحدث الأجهزة لخدمة ضباط الشرطة والمواطنين.'
  },
  {
    nameAr: 'مستشفى دار الشفاء',
    nameEn: 'Dar El Shefa Hospital',
    type: 'general',
    ratingBase: 4.0,
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    desc: 'مستشفى حكومي متطور يقدم خدمات طبية عالية الجودة.'
  },
  {
    nameAr: 'مستشفى المبرة',
    nameEn: 'El Mabarra Hospital',
    type: 'private',
    ratingBase: 4.3,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    desc: 'من أعرق المستشفيات الخاصة، يقدم رعاية صحية متميزة.'
  },
  {
    nameAr: 'مستشفى الحياة',
    nameEn: 'Al Hayat Hospital',
    type: 'private',
    ratingBase: 4.2,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    desc: 'مستشفى حديث يقدم خدمات الطوارئ والعيادات الخارجية.'
  },
  {
    nameAr: 'مستشفى الرحمة',
    nameEn: 'Al Rahma Hospital',
    type: 'charity',
    ratingBase: 4.5,
    image: 'https://images.unsplash.com/photo-1579684385136-137af75461bb?w=800&q=80',
    desc: 'مستشفى خيري يقدم خدماته للمحتاجين بأعلى جودة.'
  },
];

const locations = [
  { gov: 'القاهرة', city: 'مدينة نصر', lat: 30.0444, lng: 31.2357 },
  { gov: 'القاهرة', city: 'المعادي', lat: 29.9602, lng: 31.2569 },
  { gov: 'القاهرة', city: 'مصر الجديدة', lat: 30.0898, lng: 31.3287 },
  { gov: 'القاهرة', city: 'التجمع الخامس', lat: 30.0055, lng: 31.4779 },
  { gov: 'الجيزة', city: '6 أكتوبر', lat: 29.9737, lng: 30.9511 },
  { gov: 'الجيزة', city: 'الشيخ زايد', lat: 30.0435, lng: 30.9822 },
  { gov: 'الجيزة', city: 'المهندسين', lat: 30.0511, lng: 31.2045 },
  { gov: 'الجيزة', city: 'الدقي', lat: 30.0385, lng: 31.2127 },
  { gov: 'الإسكندرية', city: 'سموحة', lat: 31.2156, lng: 29.9553 },
  { gov: 'الإسكندرية', city: 'ميامي', lat: 31.2675, lng: 30.0058 },
  { gov: 'الإسكندرية', city: 'المنشية', lat: 31.2001, lng: 29.8999 },
];

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function seed() {
  console.log('Starting large scale seeding...');

  // Cache IDs
  const types = await prisma.hospitalType.findMany();
  const typeMap = new Map(types.map(t => [t.slug, t.id]));
  
  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const cityMap = new Map(cities.map(c => [`${c.governorate.nameAr}-${c.nameAr}`, c]));
  
  const specialties = await prisma.specialty.findMany();
  const specIds = specialties.map(s => s.id);

  let count = 0;
  
  for (const loc of locations) {
    const city = cityMap.get(`${loc.gov}-${loc.city}`);
    if (!city) continue;

    // Generate 3-5 hospitals per location
    const numHospitals = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numHospitals; i++) {
      const template = hospitalTemplates[Math.floor(Math.random() * hospitalTemplates.length)];
      
      // Randomize name slightly
      const suffixAr = ['التخصصي', 'الدولي', 'الجديد', 'فرع ' + loc.city, ''][Math.floor(Math.random() * 5)];
      const suffixEn = ['Specialized', 'International', 'New', 'Branch ' + loc.city, ''][Math.floor(Math.random() * 5)];
      
      const nameAr = `${template.nameAr} ${suffixAr}`.trim();
      const nameEn = `${template.nameEn} ${suffixEn}`.trim();
      
      const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const uniqueSlug = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Jitter location
      const lat = loc.lat + (Math.random() - 0.5) * 0.05;
      const lng = loc.lng + (Math.random() - 0.5) * 0.05;
      
      const typeId = typeMap.get(template.type) || typeMap.get('private');
      
      // Random specialties
      const shuffledSpecs = specIds.sort(() => 0.5 - Math.random());
      const selectedSpecs = shuffledSpecs.slice(0, Math.floor(Math.random() * 5) + 3);

      const hospital = await prisma.hospital.create({
        data: {
          nameAr: nameAr,
          nameEn: nameEn,
          slug: uniqueSlug,
          address: `${loc.city}، ${loc.gov}، مصر`,
          phone: '19' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          website: 'https://example.com',
          logo: template.image,
          description: template.desc,
          hasEmergency: Math.random() > 0.3,
          isFeatured: Math.random() > 0.8,
          ratingAvg: template.ratingBase + (Math.random() - 0.5) * 0.5,
          ratingCount: Math.floor(Math.random() * 200) + 10,
          lat: lat,
          lng: lng,
          typeId: typeId,
          governorateId: city.governorateId,
          cityId: city.id,
          workingHours: JSON.stringify({ note: 'Open 24/7' }),
          specialties: {
            connect: selectedSpecs.map(id => ({ id }))
          }
        }
      });

      // Hours
      for (const day of days) {
        await prisma.workingHour.create({
          data: {
            hospitalId: hospital.id,
            day: day,
            openTime: '00:00',
            closeTime: '23:59',
            isClosed: false
          }
        });
      }
      
      count++;
    }
  }

  console.log(`Seeded ${count} additional hospitals.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
