
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clinicTemplates = [
  {
    nameAr: 'عيادات كليوباترا التخصصية',
    nameEn: 'Cleopatra Polyclinics',
    specialties: ['Bones', 'Cardiology', 'Dental'],
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/hospital-2.png',
    desc: 'عيادات تخصصية متكاملة تابعة لمجموعة مستشفيات كليوباترا، تقدم خدمات طبية متميزة في مختلف التخصصات.',
    phone: '19199',
    services: ['أشعة', 'تحاليل', 'عيادات خارجية', 'طوارئ 24 ساعة']
  },
  {
    nameAr: 'عيادات ألفا',
    nameEn: 'Alpha Clinics',
    specialties: ['Internal', 'Pediatrics', 'Derma'],
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/clinic.png',
    desc: 'شبكة عيادات متطورة توفر رعاية صحية شاملة للأسرة بأحدث التقنيات الطبية.',
    phone: '16166',
    services: ['موجات صوتية', 'رسم قلب', 'عيادة أسنان']
  },
  {
    nameAr: 'عيادات النخبة',
    nameEn: 'Elite Clinics',
    specialties: ['Dental', 'Eyes', 'Plastic'],
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/dentist.png',
    desc: 'مركز طبي متميز يضم نخبة من الاستشاريين وأساتذة الجامعات في جميع التخصصات.',
    phone: '01000000001',
    services: ['تجميل', 'ليزر', 'زراعة أسنان']
  },
  {
    nameAr: 'عيادات شفاء',
    nameEn: 'Shifa Clinics',
    specialties: ['Gynecology', 'Urology', 'ENT'],
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd8189718c?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/medical-doctor.png',
    desc: 'عيادات متخصصة تقدم خدمات طبية عالية الجودة بأسعار مناسبة.',
    phone: '01222222222',
    services: ['متابعة حمل', 'سونار رباعي', 'علاج عقم']
  },
  {
    nameAr: 'عيادات صحتي',
    nameEn: 'Sehaty Clinics',
    specialties: ['Nutrition', 'Physiotherapy', 'Psychiatry'],
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/yoga.png',
    desc: 'مركز متكامل للصحة النفسية والبدنية والعلاج الطبيعي والتغذية العلاجية.',
    phone: '01111111111',
    services: ['جيم علاجي', 'تغذية أطفال', 'علاج سمنة']
  },
  {
    nameAr: 'عيادات د. مجدي يعقوب للقلب',
    nameEn: 'Magdi Yacoub Heart Clinics',
    specialties: ['Cardiology'],
    image: 'https://images.unsplash.com/photo-1579684385136-137af75461bb?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/heart-with-pulse.png',
    desc: 'عيادات متخصصة في أمراض القلب والأوعية الدموية تحت إشراف نخبة من الأطباء.',
    phone: '19731',
    services: ['قسطرة', 'رسم قلب مجهود', 'إيكو']
  },
  {
    nameAr: 'عيادات مغربي للعيون',
    nameEn: 'Magrabi Eye Clinics',
    specialties: ['Eyes'],
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/visible.png',
    desc: 'الرائد في طب وجراحة العيون في الشرق الأوسط وأفريقيا.',
    phone: '19303',
    services: ['ليزك', 'كتاركت', 'شبكية']
  },
  {
    nameAr: 'عيادات أندلسية',
    nameEn: 'Andalusia Clinics',
    specialties: ['Pediatrics', 'Dental', 'Internal'],
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    logo: 'https://img.icons8.com/color/96/steth.png',
    desc: 'جزء من مجموعة أندلسية للخدمات الطبية، تقدم رعاية صحية متكاملة.',
    phone: '16781',
    services: ['طوارئ أطفال', 'تطعيمات', 'فحوصات شاملة']
  }
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
];

async function seed() {
  console.log('Starting rich clinics seeding...');

  // Get Specialties
  const specialties = await prisma.specialty.findMany();
  const specMap = new Map(specialties.map(s => [s.slug, s.id])); // Assuming slug maps to English name roughly or we use partial match

  // Helper to find specialty ID
  const getSpecIds = (names: string[]) => {
    return names.map(n => {
      // Simple mapping logic - improve as needed
      const found = specialties.find(s => 
        s.nameEn?.toLowerCase().includes(n.toLowerCase()) || 
        s.slug.toLowerCase().includes(n.toLowerCase())
      );
      return found ? found.id : null;
    }).filter(id => id !== null) as number[];
  };

  const cities = await prisma.city.findMany({ include: { governorate: true } });
  const cityMap = new Map(cities.map(c => [`${c.governorate.nameAr}-${c.nameAr}`, c]));

  let count = 0;

  for (const loc of locations) {
    const city = cityMap.get(`${loc.gov}-${loc.city}`);
    if (!city) continue;

    // Create 2-3 clinics per location
    for (let i = 0; i < 3; i++) {
      const template = clinicTemplates[Math.floor(Math.random() * clinicTemplates.length)];
      
      const suffixAr = ['فرع ' + loc.city, 'التخصصي', 'للطب المتطور'][Math.floor(Math.random() * 3)];
      const nameAr = `${template.nameAr} - ${suffixAr}`;
      const nameEn = `${template.nameEn} - ${loc.city} Branch`;
      
      const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now() + Math.floor(Math.random()*1000);
      
      // Jitter location
      const lat = loc.lat + (Math.random() - 0.5) * 0.02;
      const lng = loc.lng + (Math.random() - 0.5) * 0.02;

      const specIds = getSpecIds(template.specialties);
      if (specIds.length === 0 && specialties.length > 0) specIds.push(specialties[0].id);

      try {
        await prisma.clinic.create({
          data: {
            nameAr,
            nameEn,
            slug,
            descriptionAr: template.desc,
            phone: template.phone,
            image: template.image,
            logo: template.logo || template.image, // Use logo if available
            governorateId: city.governorateId,
            cityId: city.id,
            addressAr: `${loc.city}، ${loc.gov}، بجوار مسجد النور`,
            lat,
            lng,
            isOpen: true,
            isFeatured: Math.random() > 0.7,
            ratingAvg: 4.0 + Math.random(),
            ratingCount: Math.floor(Math.random() * 50) + 10,
            status: 'published',
            workingHours: JSON.stringify({ note: 'يومياً من 10 صباحاً إلى 10 مساءً' }),
            services: JSON.stringify(template.services),
            specialties: {
              connect: specIds.map(id => ({ id }))
            }
          }
        });
        count++;
        process.stdout.write('.');
      } catch (e) {
        console.error('Error creating clinic:', e);
      }
    }
  }
  
  console.log(`\nSeeded ${count} clinics successfully.`);
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
