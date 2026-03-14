
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realClinics = [
  {
    nameAr: 'عيادات كليوباترا التخصصية - الشيخ زايد',
    nameEn: 'Cleopatra Poly-Clinic - Sheikh Zayed',
    slug: 'cleopatra-poly-clinic-sheikh-zayed',
    descriptionAr: 'عيادات شاملة تقدم خدمات طبية كاملة تشمل 42 تخصص من خلال 18 عيادة مجهزة بالإضافة إلى معمل للتحاليل والأشعة وصيدلية متكاملة.',
    phone: '19668',
    whatsapp: '01000019668',
    website: 'https://www.cleopatrahospitals.com',
    facebook: 'https://facebook.com/CleopatraHospitalsGroup',
    instagram: 'https://instagram.com/cleopatrahospitals',
    gov: 'الجيزة',
    city: 'الشيخ زايد',
    addressAr: 'الشيخ زايد، المحور المركزي، بجوار سعودي ماركت',
    lat: 30.0435,
    lng: 30.9822,
    logo: 'https://www.cleopatrahospitals.com/Content/images/logo.png',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80',
      'https://images.unsplash.com/photo-1504813184591-01592fd03cfd?w=800&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80'
    ],
    services: ['عيادات تخصصية', 'معمل تحاليل', 'مركز أشعة', 'صيدلية', 'توصيل منزلي'],
    insuranceCompanies: ['Bupa', 'AXA', 'MetLife', 'Allianz', 'GlobeMed'],
    amenities: ['واي فاي مجاني', 'جراج سيارات', 'مصعد', 'منطقة انتظار أطفال', 'دفع إلكتروني'],
    workingHours: {
      'Saturday': '09:00 AM - 10:00 PM',
      'Sunday': '09:00 AM - 10:00 PM',
      'Monday': '09:00 AM - 10:00 PM',
      'Tuesday': '09:00 AM - 10:00 PM',
      'Wednesday': '09:00 AM - 10:00 PM',
      'Thursday': '09:00 AM - 10:00 PM',
      'Friday': '02:00 PM - 10:00 PM'
    },
    emergencyPhone: '19668',
    consultationFee: 450,
    waitingTime: '15-30 دقيقة',
    parkingAvailable: true,
    wifiAvailable: true,
    isFeatured: true,
    ratingAvg: 4.8,
    ratingCount: 1250,
    specialties: ['dentistry', 'dermatology', 'cardiology', 'pediatrics', 'orthopedics']
  },
  {
    nameAr: 'عيادات كليوباترا التخصصية - التجمع الخامس',
    nameEn: 'Cleopatra Poly-Clinic - Fifth Settlement',
    slug: 'cleopatra-poly-clinic-fifth-settlement',
    descriptionAr: 'عيادات شاملة تقدم خدمات طبية كاملة تشمل 42 تخصص من خلال 11 عيادة مجهزة في قلب القاهرة الجديدة.',
    phone: '19668',
    whatsapp: '01000019668',
    website: 'https://www.cleopatrahospitals.com',
    gov: 'القاهرة',
    city: 'التجمع الخامس',
    addressAr: 'التجمع الخامس، شارع التسعين الشمالي، مجمع عيادات كليوباترا',
    lat: 30.0055,
    lng: 31.4779,
    logo: 'https://www.cleopatrahospitals.com/Content/images/logo.png',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538108149393-fdfd81895907?w=800&q=80',
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80'
    ],
    services: ['عيادات تخصصية', 'معمل تحاليل', 'مركز أشعة'],
    insuranceCompanies: ['Bupa', 'AXA', 'MetLife', 'NextCare'],
    amenities: ['واي فاي مجاني', 'جراج سيارات', 'تكييف مركزي'],
    workingHours: {
      'Saturday': '10:00 AM - 09:00 PM',
      'Sunday': '10:00 AM - 09:00 PM',
      'Monday': '10:00 AM - 09:00 PM',
      'Tuesday': '10:00 AM - 09:00 PM',
      'Wednesday': '10:00 AM - 09:00 PM',
      'Thursday': '10:00 AM - 09:00 PM',
      'Friday': 'Closed'
    },
    consultationFee: 500,
    waitingTime: '20-40 دقيقة',
    parkingAvailable: true,
    wifiAvailable: true,
    isFeatured: true,
    ratingAvg: 4.6,
    ratingCount: 850,
    specialties: ['internal-medicine', 'ophthalmology', 'neurology', 'ent']
  },
  {
    nameAr: 'عيادات CMC - الجيزة',
    nameEn: 'CMC Clinics - Giza',
    slug: 'cmc-clinics-giza',
    descriptionAr: 'منظومة طبية متكاملة تقدم خدمات رعاية صحية احترافية في قلب الجيزة بجوار جامعة القاهرة.',
    phone: '0235722222',
    gov: 'الجيزة',
    city: 'ميدان الجيزة',
    addressAr: '1 شارع جامعة القاهرة، ميدان الجيزة',
    lat: 30.0131,
    lng: 31.2089,
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    services: ['كشف تخصصي', 'سونار', 'رسم قلب'],
    amenities: ['سهولة الوصول', 'قرب من المواصلات'],
    workingHours: {
      'Daily': '09:00 AM - 11:00 PM'
    },
    consultationFee: 300,
    waitingTime: '30-60 دقيقة',
    ratingAvg: 4.2,
    ratingCount: 420,
    specialties: ['general-surgery', 'internal-medicine', 'obstetrics-gynecology']
  },
  {
    nameAr: 'تكنوكلينيك - المعادي',
    nameEn: 'Technoclinic - Maadi',
    slug: 'technoclinic-maadi',
    descriptionAr: 'عيادة متخصصة تأسست لتقديم خدمات طبية شاملة وآمنة لضمان أعلى مستويات الجودة.',
    phone: '01224195585',
    gov: 'القاهرة',
    city: 'المعادي',
    addressAr: 'المعادي، شارع 9، برج تكنوكلينيك الطبية',
    lat: 29.9602,
    lng: 31.2569,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?w=800&q=80',
    services: ['جراحة تجميل', 'جلدية وليزر', 'تخسيس ونحافة'],
    amenities: ['خصوصية تامة', 'أحدث الأجهزة'],
    workingHours: {
      'Daily': '12:00 PM - 10:00 PM'
    },
    consultationFee: 600,
    waitingTime: '10-20 دقيقة',
    isFeatured: true,
    ratingAvg: 4.9,
    ratingCount: 310,
    specialties: ['dermatology', 'surgery']
  }
];

async function seed() {
  console.log('🚀 Starting real clinics seeding...');

  // Get mappings
  const specialties = await prisma.specialty.findMany();
  const specMap = new Map(specialties.map(s => [s.slug, s.id]));

  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const cityMap = new Map(cities.map(c => [`${c.governorate.nameAr}-${c.nameAr}`, c]));

  let count = 0;

  for (const cData of realClinics) {
    const city = cityMap.get(`${cData.gov}-${cData.city}`);
    
    // Fallback if city doesn't exist in our basic seed
    let cityId = city?.id;
    let govId = city?.governorateId;

    if (!cityId) {
      // Find gov
      let gov = await prisma.governorate.findFirst({ where: { nameAr: cData.gov } });
      if (!gov) {
          gov = await prisma.governorate.create({ data: { nameAr: cData.gov, nameEn: cData.gov } });
      }
      govId = gov.id;

      // Find or create city
      let cityRecord = await prisma.city.findFirst({ 
          where: { nameAr: cData.city, governorateId: govId } 
      });
      if (!cityRecord) {
          cityRecord = await prisma.city.create({ 
              data: { nameAr: cData.city, nameEn: cData.city, governorateId: govId } 
          });
      }
      cityId = cityRecord.id;
    }

    const { specialties: specSlugs, gov, city: cityName, ...clinicData } = cData;

    await prisma.clinic.upsert({
      where: { slug: clinicData.slug },
      update: {
        ...clinicData,
        governorateId: govId,
        cityId: cityId,
        workingHours: JSON.stringify(clinicData.workingHours),
        services: JSON.stringify(clinicData.services),
        insuranceCompanies: JSON.stringify(clinicData.insuranceCompanies || []),
        amenities: JSON.stringify(clinicData.amenities || []),
        gallery: JSON.stringify(clinicData.gallery || []),
        specialties: {
          set: specSlugs.map(slug => ({ id: specMap.get(slug) })).filter(s => s.id)
        }
      },
      create: {
        ...clinicData,
        governorateId: govId,
        cityId: cityId,
        workingHours: JSON.stringify(clinicData.workingHours),
        services: JSON.stringify(clinicData.services),
        insuranceCompanies: JSON.stringify(clinicData.insuranceCompanies || []),
        amenities: JSON.stringify(clinicData.amenities || []),
        gallery: JSON.stringify(clinicData.gallery || []),
        specialties: {
          connect: specSlugs.map(slug => ({ id: specMap.get(slug) })).filter(s => s.id)
        }
      }
    });

    count++;
    console.log(`✅ Seeded clinic: ${cData.nameAr}`);
  }

  console.log(`\n✨ Finished seeding ${count} real clinics.`);
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
