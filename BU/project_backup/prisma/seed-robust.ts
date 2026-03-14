import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitalTypes = [
  { nameAr: 'مستشفى عام', nameEn: 'General Hospital', slug: 'general', icon: 'building-office-2' },
  { nameAr: 'مستشفى تخصصي', nameEn: 'Specialized Hospital', slug: 'specialized', icon: 'star' },
  { nameAr: 'مستشفى جامعي', nameEn: 'University Hospital', slug: 'university', icon: 'academic-cap' },
  { nameAr: 'مستشفى عسكري', nameEn: 'Military Hospital', slug: 'military', icon: 'shield-check' },
  { nameAr: 'مستشفى خاص', nameEn: 'Private Hospital', slug: 'private', icon: 'currency-dollar' },
  { nameAr: 'مركز طبي', nameEn: 'Medical Center', slug: 'center', icon: 'building-storefront' },
  { nameAr: 'مستشفى خيري', nameEn: 'Charity Hospital', slug: 'charity', icon: 'heart' },
  { nameAr: 'مستشفى تعليمي', nameEn: 'Teaching Hospital', slug: 'teaching', icon: 'book-open' },
];

const specialties = [
  { nameAr: 'قلب وأوعية دموية', nameEn: 'Cardiology', slug: 'cardiology' },
  { nameAr: 'عظام', nameEn: 'Orthopedics', slug: 'orthopedics' },
  { nameAr: 'أطفال', nameEn: 'Pediatrics', slug: 'pediatrics' },
  { nameAr: 'نساء وتوليد', nameEn: 'Gynecology', slug: 'gynecology' },
  { nameAr: 'عيون', nameEn: 'Ophthalmology', slug: 'ophthalmology' },
  { nameAr: 'أسنان', nameEn: 'Dentistry', slug: 'dentistry' },
  { nameAr: 'جلدية', nameEn: 'Dermatology', slug: 'dermatology' },
  { nameAr: 'أورام', nameEn: 'Oncology', slug: 'oncology' },
  { nameAr: 'جراحة عامة', nameEn: 'General Surgery', slug: 'surgery' },
  { nameAr: 'مخ وأعصاب', nameEn: 'Neurology', slug: 'neurology' },
];

const governorates = [
  { nameAr: 'القاهرة', nameEn: 'Cairo', cities: ['مدينة نصر', 'المعادي', 'مصر الجديدة', 'التجمع الخامس', 'الزمالك', 'المنيل', 'شبرا'] },
  { nameAr: 'الجيزة', nameEn: 'Giza', cities: ['الدقي', 'المهندسين', '6 أكتوبر', 'الشيخ زايد', 'الهرم', 'العجوزة'] },
  { nameAr: 'الإسكندرية', nameEn: 'Alexandria', cities: ['سموحة', 'ميامي', 'المنشية', 'الشاطبي'] },
];

const realHospitals = [
  {
    nameAr: 'مستشفى دار الفؤاد',
    nameEn: 'Dar Al Fouad Hospital',
    type: 'private',
    gov: 'الجيزة',
    city: '6 أكتوبر',
    address: 'محور 26 يوليو، المنطقة السياحية',
    phone: '16370',
    website: 'https://daralfouad.org',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b9af92c?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.8,
    lat: 30.0074,
    lng: 30.9756,
    desc: 'صرح طبي متميز يقدم خدمات صحية عالمية المستوى، معتمد من اللجنة الدولية المشتركة JCI. يضم نخبة من أفضل الأطباء والاستشاريين في مصر.'
  },
  {
    nameAr: 'مستشفى السلام الدولي',
    nameEn: 'As-Salam International Hospital',
    type: 'private',
    gov: 'القاهرة',
    city: 'المعادي',
    address: 'كورنيش النيل، المعادي',
    phone: '19885',
    website: 'https://assalamhospital.com',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.7,
    lat: 29.9833,
    lng: 31.2333,
    desc: 'مستشفى رائد يقدم رعاية طبية شاملة بأحدث التقنيات. يتميز بموقع استراتيجي على النيل وخدمات فندقية راقية للمرضى.'
  },
  {
    nameAr: 'مستشفى كليوباترا',
    nameEn: 'Cleopatra Hospital',
    type: 'private',
    gov: 'القاهرة',
    city: 'مصر الجديدة',
    address: '39 شارع كليوباترا، ميدان صلاح الدين',
    phone: '19662',
    website: 'https://www.cleopatrahospitals.com',
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.6,
    lat: 30.0898,
    lng: 31.3287,
    desc: 'جزء من مجموعة كليوباترا، أكبر مجموعة مستشفيات خاصة في مصر. تاريخ طويل من التميز الطبي والخدمة الموثوقة.'
  },
  {
    nameAr: 'مستشفى 57357',
    nameEn: 'Children\'s Cancer Hospital 57357',
    type: 'charity',
    gov: 'القاهرة',
    city: 'المنيل',
    address: '1 شارع سكة الإمام، السيدة زينب',
    phone: '19057',
    website: 'https://www.57357.org',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd8189718c?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.9,
    lat: 30.0234,
    lng: 31.2356,
    desc: 'أكبر مستشفى لعلاج سرطان الأطفال في العالم من حيث السعة. يقدم العلاج بالمجان تماماً للأطفال بتمويل من التبرعات.'
  },
  {
    nameAr: 'مستشفى القصر العيني',
    nameEn: 'Kasr Al Ainy Hospital',
    type: 'university',
    gov: 'القاهرة',
    city: 'المنيل',
    address: 'شارع القصر العيني',
    phone: '0223646394',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
    hasEmergency: true,
    isFeatured: false,
    rating: 4.2,
    lat: 30.0333,
    lng: 31.2333,
    desc: 'أعرق وأقدم مستشفى تعليمي في مصر والشرق الأوسط، تابع لجامعة القاهرة. يضم جميع التخصصات الطبية ويستقبل آلاف المرضى يومياً.'
  },
  {
    nameAr: 'مستشفى السعودي الألماني',
    nameEn: 'Saudi German Hospital',
    type: 'private',
    gov: 'القاهرة',
    city: 'مصر الجديدة',
    address: 'طريق جوزيف تيتو، النزهة',
    phone: '16259',
    website: 'https://sghcairo.com',
    image: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.5,
    lat: 30.1333,
    lng: 31.3833,
    desc: 'جزء من مجموعة مستشفيات السعودي الألماني الرائدة في المنطقة. تصميم حديث وتجهيزات طبية متطورة.'
  },
  {
    nameAr: 'مستشفى القوات الجوية',
    nameEn: 'Air Force Hospital',
    type: 'military',
    gov: 'القاهرة',
    city: 'التجمع الخامس',
    address: 'شارع التسعين',
    phone: '19448',
    image: 'https://images.unsplash.com/photo-1516574187841-69301976e499?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.6,
    lat: 30.0264,
    lng: 31.4542,
    desc: 'صرح طبي عسكري متميز يخدم العسكريين والمدنيين. يشتهر بقسم القلب وجراحات العظام المتقدمة.'
  },
  {
    nameAr: 'مستشفى عين شمس التخصصي',
    nameEn: 'Ain Shams Specialized Hospital',
    type: 'university',
    gov: 'القاهرة',
    city: 'مدينة نصر',
    address: 'شارع الخليفة المأمون',
    phone: '0224024163',
    image: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&q=80',
    hasEmergency: true,
    isFeatured: false,
    rating: 4.1,
    lat: 30.0765,
    lng: 31.2856,
    desc: 'مستشفى جامعي تخصصي يقدم خدمات طبية متميزة بأسعار اقتصادية. يضم نخبة من أساتذة كلية الطب بجامعة عين شمس.'
  },
  {
    nameAr: 'مستشفى النيل بدراوي',
    nameEn: 'Nile Badrawi Hospital',
    type: 'private',
    gov: 'القاهرة',
    city: 'المعادي',
    address: 'كورنيش النيل',
    phone: '0225240022',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    hasEmergency: true,
    isFeatured: false,
    rating: 4.3,
    lat: 29.9667,
    lng: 31.2500,
    desc: 'مستشفى خاص عريق يطل على النيل، معروف بتميزه في الجراحات الدقيقة والرعاية المركزة.'
  },
  {
    nameAr: 'مستشفى الشرطة',
    nameEn: 'Police Hospital',
    type: 'military',
    gov: 'الجيزة',
    city: 'العجوزة',
    address: 'شارع النيل',
    phone: '0233044444',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    hasEmergency: true,
    isFeatured: false,
    rating: 4.4,
    lat: 30.0500,
    lng: 31.2167,
    desc: 'مستشفى مجهز بأحدث الأجهزة لخدمة ضباط الشرطة والمواطنين. يضم أقسام متخصصة للحروق والطوارئ.'
  },
  {
    nameAr: 'مستشفى بهية',
    nameEn: 'Baheya Hospital',
    type: 'charity',
    gov: 'الجيزة',
    city: 'الهرم',
    address: 'شارع الهرم',
    phone: '16602',
    website: 'https://baheya.org',
    image: 'https://images.unsplash.com/photo-1579684385136-137af75461bb?w=800&q=80',
    hasEmergency: false,
    isFeatured: true,
    rating: 4.8,
    lat: 29.9950,
    lng: 31.1550,
    desc: 'أول مستشفى خيري متخصص في الكشف المبكر وعلاج سرطان الثدي بالمجان في مصر.'
  },
  {
    nameAr: 'مستشفى أندلسية المعادي',
    nameEn: 'Andalusia Hospital Maadi',
    type: 'private',
    gov: 'القاهرة',
    city: 'المعادي',
    address: 'شارع النصر، المعادي الجديدة',
    phone: '16781',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.5,
    lat: 29.9750,
    lng: 31.2850,
    desc: 'جزء من مجموعة أندلسية للخدمات الطبية. يقدم خدمات طبية متكاملة بلمسة إنسانية.'
  },
  {
    nameAr: 'مستشفى دار الشفاء',
    nameEn: 'Dar El Shefa Hospital',
    type: 'general',
    gov: 'القاهرة',
    city: 'العباسية',
    address: 'شارع صلاح سالم',
    phone: '16474',
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    hasEmergency: true,
    isFeatured: false,
    rating: 4.0,
    lat: 30.0650,
    lng: 31.2950,
    desc: 'مستشفى حكومي متطور يقدم خدمات طبية عالية الجودة، تم تجديده مؤخراً ليشمل أحدث الأجهزة.'
  },
  {
    nameAr: 'مستشفى المبرة',
    nameEn: 'El Mabarra Hospital',
    type: 'private',
    gov: 'الإسكندرية',
    city: 'العصافرة',
    address: 'طريق الجيش',
    phone: '035555555',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    hasEmergency: true,
    isFeatured: true,
    rating: 4.3,
    lat: 31.2750,
    lng: 30.0150,
    desc: 'من أعرق المستشفيات الخاصة في الإسكندرية، يقدم رعاية صحية متميزة لسكان الثغر.'
  }
];

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function seed() {
  console.log('Starting robust seeding...');

  // 1. Seed Hospital Types
  console.log('Seeding types...');
  const typeMap = new Map();
  for (const t of hospitalTypes) {
    const type = await prisma.hospitalType.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
    typeMap.set(t.slug, type.id);
  }

  // 2. Seed Specialties
  console.log('Seeding specialties...');
  const specialtyIds = [];
  for (const s of specialties) {
    const spec = await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    specialtyIds.push(spec.id);
  }

  // 3. Seed Locations (Govs & Cities)
  console.log('Seeding locations...');
  const cityMap = new Map(); // "GovName-CityName" -> CityID
  const govMap = new Map(); // "GovName" -> GovID

  for (const g of governorates) {
    const gov = await prisma.governorate.upsert({
      where: { nameAr: g.nameAr },
      update: { nameEn: g.nameEn },
      create: { nameAr: g.nameAr, nameEn: g.nameEn },
    });
    govMap.set(g.nameAr, gov.id);

    for (const cName of g.cities) {
      const city = await prisma.city.upsert({
        where: {
            governorateId_nameAr: {
                governorateId: gov.id,
                nameAr: cName
            }
        },
        update: {},
        create: {
          nameAr: cName,
          nameEn: cName, // Placeholder translation
          governorateId: gov.id,
        },
      });
      cityMap.set(`${g.nameAr}-${cName}`, city.id);
    }
  }

  // 4. Seed Hospitals
  console.log('Seeding hospitals...');
  for (const h of realHospitals) {
    const typeId = typeMap.get(h.type) || typeMap.get('private');
    const govId = govMap.get(h.gov);
    const cityId = cityMap.get(`${h.gov}-${h.city}`);

    const slug = h.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const uniqueSlug = `${slug}-${Date.now()}`; // Ensure uniqueness if running multiple times

    // Select 3-5 random specialties
    const shuffledSpecs = specialtyIds.sort(() => 0.5 - Math.random());
    const selectedSpecs = shuffledSpecs.slice(0, Math.floor(Math.random() * 3) + 3);

    const hospital = await prisma.hospital.create({
      data: {
        nameAr: h.nameAr,
        nameEn: h.nameEn,
        slug: uniqueSlug,
        address: h.address,
        phone: h.phone,
        website: h.website,
        logo: h.image, // Using Unsplash images as logos/covers
        description: h.desc,
        hasEmergency: h.hasEmergency,
        isFeatured: h.isFeatured,
        ratingAvg: h.rating,
        ratingCount: Math.floor(Math.random() * 500) + 50,
        lat: h.lat,
        lng: h.lng,
        typeId: typeId,
        governorateId: govId,
        cityId: cityId,
        workingHours: JSON.stringify({ note: 'Open 24/7' }), // Fallback string
        specialties: {
          connect: selectedSpecs.map(id => ({ id }))
        }
      }
    });

    // Create Working Hours Relations
    if (h.hasEmergency) {
      // 24/7
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
    } else {
      // 9 to 5
      for (const day of days) {
        const isFri = day === 'Friday';
        await prisma.workingHour.create({
          data: {
            hospitalId: hospital.id,
            day: day,
            openTime: '09:00',
            closeTime: '17:00',
            isClosed: isFri
          }
        });
      }
    }

    console.log(`Created: ${h.nameAr}`);
  }

  console.log('Robust seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
