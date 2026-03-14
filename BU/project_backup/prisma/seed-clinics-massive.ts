
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const TARGET_COUNT = 5000;
const BATCH_SIZE = 100;

// Templates for data generation
const clinicNames = [
  'عيادات الشروق', 'مركز النور الطبي', 'عيادة الشفاء', 'مجمع الحكمة الطبي', 'عيادات الحياة',
  'مركز تبارك', 'عيادة الياسمين', 'مجمع الصفوة', 'عيادات النخبة', 'مركز الأمل',
  'عيادة الفيروز', 'مجمع مكة الطبي', 'مركز السلام', 'عيادات كايرو سكان', 'مركز ألفا',
  'عيادات رويال', 'مجمع طيبة', 'مركز هليوبوليس', 'عيادات المعادي', 'مركز الدقي التخصصي',
  'عيادات كليوباترا', 'مركز النيل', 'مجمع الرواد', 'عيادة الصفا', 'مركز الرحمة',
  'عيادات بيور', 'مركز أندلسية', 'مجمع عيادات العرب', 'عيادة العائلة', 'مركز صحتي',
  'عيادات سمارت', 'مركز جلوبال', 'مجمع عيادات المستقبل', 'عيادة الرعاية المركزية', 'مركز دار العلاج'
];

const doctorNames = [
  'د. محمد أحمد', 'د. أحمد محمود', 'د. سارة علي', 'د. محمود حسن', 'د. منى ابراهيم',
  'د. هاني شاكر', 'د. نادية الجندي', 'د. عصام كاريكا', 'د. تامر حسني', 'د. عمرو دياب',
  'د. شريف منير', 'د. منى زكي', 'د. ياسمين عبدالعزيز', 'د. كريم عبدالعزيز', 'د. أحمد عز',
  'د. ليلى علوي', 'د. يسرا', 'د. عادل امام', 'د. سمير غانم', 'د. دلال عبدالعزيز',
  'د. مجدي يعقوب', 'د. هاني الناظر', 'د. حسام موافي', 'د. مبروك عطية', 'د. خالد منتصر'
];

const specialtiesMapping = [
  { slug: 'dentistry', names: ['الأسنان', 'طب الأسنان', 'جراحة الفم والأسنان'] },
  { slug: 'dermatology', names: ['الجلدية', 'الأمراض الجلدية والتجميل', 'الليزر'] },
  { slug: 'cardiology', names: ['القلب', 'أمراض القلب والأوعية الدموية', 'القسطرة'] },
  { slug: 'pediatrics', names: ['الأطفال', 'طب الأطفال وحديثي الولادة', 'المبتسرين'] },
  { slug: 'orthopedics', names: ['العظام', 'جراحة العظام والمفاصل', 'العمود الفقري'] },
  { slug: 'ophthalmology', names: ['العيون', 'طب وجراحة العيون', 'الليزك'] },
  { slug: 'neurology', names: ['المخ والأعصاب', 'أمراض المخ والأعصاب', 'الطب النفسي'] },
  { slug: 'obstetrics-gynecology', names: ['النساء والتوليد', 'تأخر الإنجاب', 'الحقن المجهري'] },
  { slug: 'internal-medicine', names: ['الباطنة', 'الأمراض الباطنة والجهاز الهضمي', 'السكر والكلى'] },
  { slug: 'ent', names: ['الأنف والأذن والحنجرة', 'جراحة الأنف والأذن'] },
  { slug: 'urology', names: ['المسالك البولية', 'جراحة المسالك البولية والتناسلية'] },
  { slug: 'general-surgery', names: ['الجراحة العامة', 'جراحة المناظير', 'جراحة السمنة'] },
  { slug: 'psychiatry', names: ['الطب النفسي', 'علاج الإدمان', 'الصحة النفسية'] },
  { slug: 'nutrition', names: ['التغذية', 'التغذية العلاجية', 'علاج السمنة والنحافة'] },
  { slug: 'physiotherapy', names: ['العلاج الطبيعي', 'التأهيل الحركي', 'إصابات الملاعب'] }
];

const insuranceCompaniesList = [
  'Bupa', 'AXA', 'MetLife', 'Allianz', 'GlobeMed', 'NextCare', 'Misr Insurance', 
  'Gig Egypt', 'Libyan Insurance', 'Wadi El Nile', 'Prime Health', 'MedNet'
];

const amenitiesList = [
  'واي فاي مجاني', 'جراج سيارات', 'مصعد', 'منطقة انتظار أطفال', 'دفع إلكتروني', 
  'تكييف مركزي', 'صيدلية داخلية', 'كافيتريا', 'شاشات عرض', 'خدمة استقبال 24 ساعة'
];

const servicesList = [
  'كشف تخصصي', 'سونار', 'رسم قلب', 'تحاليل مخبرية', 'أشعة سينية', 
  'عمليات صغرى', 'متابعة دورية', 'استشارات أونلاين', 'زيارة منزلية', 'تطعيمات'
];

const galleryImages = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
  'https://images.unsplash.com/photo-1538108149393-fdfd81895907?w=800&q=80',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
  'https://images.unsplash.com/photo-1579684385136-137af75461bb?w=800&q=80',
  'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80',
  'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
  'https://images.unsplash.com/photo-1504813184591-01592fd03cfd?w=800&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dad99901?w=800&q=80'
];

const cityGPSData: Record<string, { lat: number, lng: number }> = {
  'القاهرة-مدينة نصر': { lat: 30.0444, lng: 31.2357 },
  'القاهرة-المعادي': { lat: 29.9602, lng: 31.2569 },
  'القاهرة-مصر الجديدة': { lat: 30.0898, lng: 31.3287 },
  'القاهرة-التجمع الخامس': { lat: 30.0055, lng: 31.4779 },
  'القاهرة-الزمالك': { lat: 30.0633, lng: 31.2167 },
  'الجيزة-الدقي': { lat: 30.0385, lng: 31.2127 },
  'الجيزة-المهندسين': { lat: 30.0511, lng: 31.2045 },
  'الجيزة-6 أكتوبر': { lat: 29.9737, lng: 30.9511 },
  'الجيزة-الشيخ زايد': { lat: 30.0435, lng: 30.9822 },
  'الإسكندرية-سموحة': { lat: 31.2156, lng: 29.9553 },
  'الإسكندرية-ميامي': { lat: 31.2675, lng: 30.0058 },
  'الإسكندرية-المنشية': { lat: 31.2001, lng: 29.8999 },
  'الغربية-طنطا': { lat: 30.7865, lng: 31.0004 },
  'الدقهلية-المنصورة': { lat: 31.0409, lng: 31.3785 },
  'الشرقية-الزقازيق': { lat: 30.5877, lng: 31.5020 },
  'القليوبية-بنها': { lat: 30.4659, lng: 31.1853 },
  'المنوفية-شبين الكوم': { lat: 30.5503, lng: 31.0106 }
};

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhone(): string {
  const prefixes = ['010', '011', '012', '015'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${num}`;
}

async function seed() {
  console.log(`🚀 Starting massive clinics seeding for ${TARGET_COUNT} records...`);

  // 1. Get all data for mapping
  const specialties = await prisma.specialty.findMany();
  const specMap = new Map(specialties.map(s => [s.slug, s.id]));
  
  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const cityList = cities.filter(c => cityGPSData[`${c.governorate.nameAr}-${c.nameAr}`]);
  
  if (cityList.length === 0) {
    console.error('❌ No cities found in database that match GPS data mapping. Please seed basic data first.');
    return;
  }

  let totalSeeded = 0;

  for (let b = 0; b < Math.ceil(TARGET_COUNT / BATCH_SIZE); b++) {
    const clinicsToCreate = [];
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      const city = cityList[Math.floor(Math.random() * cityList.length)];
      const gpsBase = cityGPSData[`${city.governorate.nameAr}-${city.nameAr}`];
      
      const templateName = clinicNames[Math.floor(Math.random() * clinicNames.length)];
      const doctor = doctorNames[Math.floor(Math.random() * doctorNames.length)];
      const specTemplate = specialtiesMapping[Math.floor(Math.random() * specialtiesMapping.length)];
      const specName = specTemplate.names[Math.floor(Math.random() * specTemplate.names.length)];
      
      const cityEnName = city.nameEn || 'city';
      const nameAr = `${templateName} - ${specName} - ${doctor}`;
      const nameEn = `${cityEnName} ${specTemplate.slug} Clinic - ${i + totalSeeded}`;
      const slug = `${specTemplate.slug}-${cityEnName.toLowerCase().replace(/\s+/g, '-')}-${i + totalSeeded}-${Date.now()}`;
      
      // GPS Jitter
      const lat = gpsBase.lat + (Math.random() - 0.5) * 0.015;
      const lng = gpsBase.lng + (Math.random() - 0.5) * 0.015;

      const workingHours = {
        'Saturday': '10:00 AM - 10:00 PM',
        'Sunday': '10:00 AM - 10:00 PM',
        'Monday': '10:00 AM - 10:00 PM',
        'Tuesday': '10:00 AM - 10:00 PM',
        'Wednesday': '10:00 AM - 10:00 PM',
        'Thursday': '10:00 AM - 10:00 PM',
        'Friday': Math.random() > 0.5 ? 'Closed' : '02:00 PM - 09:00 PM'
      };

      const selectedSpecs = [specMap.get(specTemplate.slug)].filter(Boolean) as number[];
      if (Math.random() > 0.8) {
          const extraSpec = specialties[Math.floor(Math.random() * specialties.length)];
          if (!selectedSpecs.includes(extraSpec.id)) selectedSpecs.push(extraSpec.id);
      }

      clinicsToCreate.push({
        nameAr,
        nameEn,
        slug,
        descriptionAr: `تقدم عيادة ${nameAr} في ${city.nameAr} أفضل الخدمات الطبية في تخصص ${specName} تحت إشراف ${doctor}. العيادة مجهزة بأحدث التقنيات لضمان راحة وسلامة المرضى.`,
        phone: generatePhone(),
        whatsapp: generatePhone(),
        website: `https://${slug}.com`,
        facebook: `https://facebook.com/${slug}`,
        instagram: `https://instagram.com/${slug}`,
        image: galleryImages[Math.floor(Math.random() * galleryImages.length)],
        logo: 'https://img.icons8.com/color/96/hospital-2.png',
        gallery: JSON.stringify(getRandomItems(galleryImages, 3)),
        services: JSON.stringify(getRandomItems(servicesList, 4)),
        insuranceCompanies: JSON.stringify(getRandomItems(insuranceCompaniesList, 3)),
        amenities: JSON.stringify(getRandomItems(amenitiesList, 4)),
        governorateId: city.governorateId,
        cityId: city.id,
        addressAr: `${city.nameAr}، شارع ${Math.floor(Math.random() * 100) + 1}، بجوار المركز التجاري`,
        lat,
        lng,
        consultationFee: Math.floor(Math.random() * 400) + 100,
        waitingTime: `${Math.floor(Math.random() * 45) + 10} دقيقة`,
        parkingAvailable: Math.random() > 0.3,
        wifiAvailable: Math.random() > 0.4,
        isOpen: true,
        isFeatured: Math.random() > 0.9,
        ratingAvg: 3.5 + Math.random() * 1.5,
        ratingCount: Math.floor(Math.random() * 200) + 5,
        status: 'published',
        workingHours: JSON.stringify(workingHours),
        specialtyIds: selectedSpecs
      });
    }

    // Insert in batch
    for (const clinicData of clinicsToCreate) {
        const { specialtyIds, ...rest } = clinicData;
        await prisma.clinic.create({
            data: {
                ...rest,
                specialties: {
                    connect: specialtyIds.map(id => ({ id }))
                }
            }
        });
    }

    totalSeeded += clinicsToCreate.length;
    process.stdout.write(`\r✅ Progress: ${totalSeeded} / ${TARGET_COUNT}`);
  }

  console.log(`\n\n✨ Successfully seeded ${totalSeeded} clinics with rich details.`);
}

seed()
  .catch(e => {
    console.error('\n❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
