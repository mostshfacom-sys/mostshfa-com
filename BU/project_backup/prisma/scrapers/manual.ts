
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MANUAL_HOSPITALS = [
  // --- Cairo ---
  {
    nameAr: 'مستشفى 57357 لعلاج سرطان الأطفال',
    nameEn: 'Children\'s Cancer Hospital 57357',
    type: 'specialized',
    city: 'السيدة زينب',
    gov: 'القاهرة',
    phone: '19057',
    address: '1 Sekat Al-Emam Street, El-Madabegh, Sayeda Zeinab, Cairo'
  },
  {
    nameAr: 'مستشفى دار الفؤاد - مدينة نصر',
    nameEn: 'Dar Al Fouad Hospital - Nasr City',
    type: 'private',
    city: 'مدينة نصر',
    gov: 'القاهرة',
    phone: '16370',
    address: 'Nasr City, Cairo'
  },
  {
    nameAr: 'مستشفى السلام الدولي - المعادي',
    nameEn: 'As-Salam International Hospital - Maadi',
    type: 'private',
    city: 'المعادي',
    gov: 'القاهرة',
    phone: '19885',
    address: 'Corniche El Nile, Maadi, Cairo'
  },
  {
    nameAr: 'مستشفى السعودي الألماني',
    nameEn: 'Saudi German Hospital',
    type: 'private',
    city: 'مصر الجديدة',
    gov: 'القاهرة',
    phone: '16259',
    address: 'Joseph Tito St, El-Nozha, Cairo'
  },
  {
    nameAr: 'مستشفى كليوباترا',
    nameEn: 'Cleopatra Hospital',
    type: 'private',
    city: 'مصر الجديدة',
    gov: 'القاهرة',
    phone: '19662',
    address: '39 Cleopatra St, Heliopolis, Cairo'
  },
  {
    nameAr: 'مستشفى القاهرة التخصصي',
    nameEn: 'Cairo Specialized Hospital',
    type: 'private',
    city: 'مصر الجديدة',
    gov: 'القاهرة',
    phone: '19662',
    address: '4 Al-Orouba St, Heliopolis, Cairo'
  },
  {
    nameAr: 'مستشفى النزهة الدولي',
    nameEn: 'Nozha International Hospital',
    type: 'private',
    city: 'مصر الجديدة',
    gov: 'القاهرة',
    phone: '19662',
    address: 'Masaken Sheraton, Heliopolis, Cairo'
  },
  {
    nameAr: 'مستشفى الجوي التخصصي',
    nameEn: 'Air Force Specialized Hospital',
    type: 'military',
    city: 'التجمع الخامس',
    gov: 'القاهرة',
    phone: '15888',
    address: '90th St, Fifth Settlement, New Cairo'
  },
  {
    nameAr: 'مستشفى الشرطة بمدينة نصر',
    nameEn: 'Police Hospital Nasr City',
    type: 'military',
    city: 'مدينة نصر',
    gov: 'القاهرة',
    phone: '0222616181',
    address: 'Nasr City, Cairo'
  },
  {
    nameAr: 'مستشفى عين شمس التخصصي',
    nameEn: 'Ain Shams Specialized Hospital',
    type: 'university',
    city: 'عين شمس', // Should map to Abbasiya or similar if not exists
    gov: 'القاهرة',
    phone: '0224024163',
    address: 'Khalifa El-Maamon St, Abbasiya, Cairo'
  },
  {
    nameAr: 'مستشفى القصر العيني',
    nameEn: 'Kasr Al Ainy Hospital',
    type: 'university',
    city: 'وسط البلد',
    gov: 'القاهرة',
    phone: '0223646394',
    address: 'Kasr Al Ainy St, Cairo'
  },
  {
    nameAr: 'مستشفى معهد ناصر',
    nameEn: 'Nasser Institute Hospital',
    type: 'specialized',
    city: 'شبرا',
    gov: 'القاهرة',
    phone: '0222039164',
    address: 'Corniche El Nile, Shoubra, Cairo'
  },
  {
    nameAr: 'مستشفى المقاولون العرب',
    nameEn: 'Arab Contractors Hospital',
    type: 'private',
    city: 'مدينة نصر',
    gov: 'القاهرة',
    phone: '0223426000',
    address: 'Nasr City, Cairo'
  },
  {
    nameAr: 'مستشفى وادي النيل',
    nameEn: 'Wadi El Neel Hospital',
    type: 'military',
    city: 'حدائق القبة',
    gov: 'القاهرة',
    phone: '0224562700',
    address: 'Hadaeq El Qobbah, Cairo'
  },

  // --- Giza ---
  {
    nameAr: 'مستشفى دار الفؤاد - 6 أكتوبر',
    nameEn: 'Dar Al Fouad Hospital - 6th of October',
    type: 'private',
    city: '6 أكتوبر',
    gov: 'الجيزة',
    phone: '16370',
    address: '26th of July Axis, 6th of October City'
  },
  {
    nameAr: 'مستشفى سعاد كفافي الجامعي',
    nameEn: 'Souad Kafafi University Hospital',
    type: 'university',
    city: '6 أكتوبر',
    gov: 'الجيزة',
    phone: '0238362470',
    address: 'Misr University for Science and Technology, 6th of October'
  },
  {
    nameAr: 'مستشفى الشيخ زايد التخصصي',
    nameEn: 'Sheikh Zayed Specialized Hospital',
    type: 'specialized',
    city: 'الشيخ زايد',
    gov: 'الجيزة',
    phone: '0238500921',
    address: 'Sheikh Zayed City, Giza'
  },
  {
    nameAr: 'مستشفى بهية للكشف المبكر عن سرطان الثدي',
    nameEn: 'Baheya Hospital',
    type: 'specialized',
    city: 'الهرم',
    gov: 'الجيزة',
    phone: '16602',
    address: 'Haram St, Giza'
  },
  {
    nameAr: 'مستشفى الشرطة بالعجوزة',
    nameEn: 'Police Hospital Agouza',
    type: 'military',
    city: 'العجوزة',
    gov: 'الجيزة',
    phone: '0233047240',
    address: 'Agouza, Giza'
  },

  // --- Alexandria ---
  {
    nameAr: 'مستشفى أندلسية سموحة',
    nameEn: 'Andalusia Hospital Smouha',
    type: 'private',
    city: 'سموحة',
    gov: 'الإسكندرية',
    phone: '16781',
    address: 'Smouha, Alexandria'
  },
  {
    nameAr: 'مستشفى لوران',
    nameEn: 'Loran Hospital',
    type: 'private',
    city: 'الرمل', // Map to nearest
    gov: 'الإسكندرية',
    phone: '035868686',
    address: 'Loran, Alexandria'
  },
  {
    nameAr: 'مستشفى السلامة',
    nameEn: 'Salama Hospital',
    type: 'private',
    city: 'الشلالات', // Need check
    gov: 'الإسكندرية',
    phone: '034879999',
    address: 'Alexandria'
  },
  {
    nameAr: 'المستشفى الأميري الجامعي',
    nameEn: 'Main University Hospital',
    type: 'university',
    city: 'محرم بك', // Approx
    gov: 'الإسكندرية',
    phone: '034862506',
    address: 'Al Azaritah, Alexandria'
  },

  // --- Aswan ---
  {
    nameAr: 'مستشفى مجدي يعقوب للقلب',
    nameEn: 'Magdi Yacoub Heart Foundation',
    type: 'specialized',
    city: 'أسوان',
    gov: 'أسوان',
    phone: '19731',
    address: 'Aswan, Egypt'
  },
  {
    nameAr: 'مستشفى أسوان الجامعي',
    nameEn: 'Aswan University Hospital',
    type: 'university',
    city: 'أسوان',
    gov: 'أسوان',
    phone: '0972433888',
    address: 'Aswan'
  },

  // --- Dakahlia ---
  {
    nameAr: 'مركز الكلى والمسالك البولية (غنيم)',
    nameEn: 'Urology and Nephrology Center',
    type: 'specialized',
    city: 'المنصورة',
    gov: 'الدقهلية',
    phone: '0502202222',
    address: 'Mansoura University, Mansoura'
  },
  {
    nameAr: 'مستشفى المنصورة الدولي',
    nameEn: 'Mansoura International Hospital',
    type: 'general',
    city: 'المنصورة',
    gov: 'الدقهلية',
    phone: '0502264893',
    address: 'Mansoura'
  }
];

export async function run() {
  console.log('Starting Manual Hospital Entry...');
  
  for (const h of MANUAL_HOSPITALS) {
    try {
      // Find Gov
      const gov = await prisma.governorate.findFirst({
        where: { OR: [{ nameAr: h.gov }, { nameEn: h.gov }] }
      });
      
      let cityId = null;
      if (gov) {
        // Try to find city
        let city = await prisma.city.findFirst({
          where: { 
            governorateId: gov.id,
            OR: [{ nameAr: h.city }, { nameEn: h.city }]
          }
        });

        // If city not found, try to find *any* city in that gov or create a default?
        // For now, if city not found, we might skip connecting city or connect to first city
        if (!city) {
            console.warn(`City ${h.city} not found for ${h.gov}.`);
            // Optional: fallback to first city in gov
            city = await prisma.city.findFirst({ where: { governorateId: gov.id } });
        }
        
        if (city) cityId = city.id;
      } else {
        console.warn(`Governorate ${h.gov} not found.`);
      }

      // Slug
      let slug = h.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'hospital';
      let uniqueSlug = slug;
      let count = 0;
      while (await prisma.hospital.findUnique({ where: { slug: uniqueSlug } })) {
        count++;
        uniqueSlug = `${slug}-${count}`;
      }

      await prisma.hospital.upsert({
        where: { slug: uniqueSlug },
        update: {
             // Update basic fields if they changed
             nameAr: h.nameAr,
             nameEn: h.nameEn,
             address: h.address,
             phone: h.phone,
        },
        create: {
          nameAr: h.nameAr,
          nameEn: h.nameEn,
          slug: uniqueSlug,
          type: {
             connectOrCreate: {
                where: { slug: h.type },
                create: { slug: h.type, nameEn: h.type, nameAr: h.type, icon: 'hospital' }
             }
          },
          address: h.address,
          phone: h.phone,
          ratingAvg: 4.5 + Math.random() * 0.5, // Fake high rating for top hospitals
          ratingCount: Math.floor(Math.random() * 500) + 50,
          ...(gov && { governorate: { connect: { id: gov.id } } }),
          ...(cityId && { city: { connect: { id: cityId } } })
        }
      });
      console.log(`Added/Updated manual hospital: ${h.nameEn}`);
    } catch (e) {
      console.error(`Failed to add ${h.nameEn}:`, e);
    }
  }
  
  console.log('Manual Entry Finished.');
}

if (require.main === module) {
  run().catch(console.error);
}
