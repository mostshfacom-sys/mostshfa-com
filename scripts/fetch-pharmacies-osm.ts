import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of major governorates to query
const GOVERNORATES = [
  { en: 'Cairo', ar: 'القاهرة' },
  { en: 'Giza', ar: 'الجيزة' },
  { en: 'Alexandria', ar: 'الإسكندرية' },
  { en: 'Dakahlia', ar: 'الدقهلية' },
  { en: 'Red Sea', ar: 'البحر الأحمر' },
  { en: 'Beheira', ar: 'البحيرة' },
  { en: 'Fayoum', ar: 'الفيوم' },
  { en: 'Gharbia', ar: 'الغربية' },
  { en: 'Ismailia', ar: 'الإسماعيلية' },
  { en: 'Menofia', ar: 'المنوفية' },
  { en: 'Minya', ar: 'المنيا' },
  { en: 'Qalyubia', ar: 'القليوبية' },
  { en: 'New Valley', ar: 'الوادي الجديد' },
  { en: 'Suez', ar: 'السويس' },
  { en: 'Aswan', ar: 'أسوان' },
  { en: 'Assiut', ar: 'أسيوط' },
  { en: 'Beni Suef', ar: 'بني سويف' },
  { en: 'Port Said', ar: 'بورسعيد' },
  { en: 'Damietta', ar: 'دمياط' },
  { en: 'Sharqia', ar: 'الشرقية' },
  { en: 'South Sinai', ar: 'جنوب سيناء' },
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  { en: 'Matrouh', ar: 'مطروح' },
  { en: 'Luxor', ar: 'الأقصر' },
  { en: 'Qena', ar: 'قنا' },
  { en: 'North Sinai', ar: 'شمال سيناء' },
  { en: 'Sohag', ar: 'سوهاج' }
];

async function main() {
  console.log('Starting Pharmacy OSM fetcher...');

  // Get all cities for mapping
  const cities = await prisma.city.findMany();
  const govs = await prisma.governorate.findMany();

  let totalImported = 0;

  for (const govData of GOVERNORATES) {
    const govName = govData.en;
    console.log(`\n--- Processing Governorate: ${govName} ---`);
    try {
      // Find gov ID
      const gov = govs.find(g => 
        (g.nameEn && g.nameEn.toLowerCase().includes(govName.toLowerCase())) || 
        (g.nameAr && g.nameAr.includes(govData.ar))
      );
      
      const count = await fetchPharmaciesForGovernorate(govData, gov?.id, cities);
      totalImported += count;
    } catch (e) {
      console.error(`Failed to process ${govName}:`, e);
    }
    // Wait to respect API limits
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\nTotal imported pharmacies: ${totalImported}`);
  await prisma.$disconnect();
}

async function fetchPharmaciesForGovernorate(govData: { en: string, ar: string }, govId: number | undefined, cities: any[]) {
  // Query for pharmacies in the area using multiple name variations
  const query = `
    [out:json][timeout:180];
    (
      area["name:en"="${govData.en}"]["admin_level"~"4|5"];
      area["name:ar"="${govData.ar}"]["admin_level"~"4|5"];
    )->.searchArea;
    (
      node["amenity"="pharmacy"](area.searchArea);
      way["amenity"="pharmacy"](area.searchArea);
    );
    out center body;
  `;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 180000 
      });

      const elements = response.data.elements;
      console.log(`Found ${elements.length} items in ${govData.en}`);

      if (elements.length === 0) return 0;

      let count = 0;
      for (const element of elements) {
        const saved = await savePharmacy(element, govId, cities);
        if (saved) count++;
      }
      console.log(`Saved ${count} pharmacies in ${govData.en}`);
      return count;

    } catch (error: any) {
      console.error(`Error fetching ${govData.en} (Attempt ${4 - retries}):`, error.message);
      if (error.response?.status === 429) {
        console.log('Rate limited (429). Waiting 30s before retry...');
        await new Promise(r => setTimeout(r, 30000));
      } else if (error.response?.status === 504) {
        console.log('Gateway Timeout (504). Waiting 10s before retry...');
        await new Promise(r => setTimeout(r, 10000));
      } else {
        // Other errors, wait a bit and retry
        await new Promise(r => setTimeout(r, 5000));
      }
      retries--;
    }
  }
  return 0;
}

async function savePharmacy(element: any, govId: number | undefined, cities: any[]) {
  const tags = element.tags || {};
  const nameAr = tags['name:ar'] || tags['name'] || tags['name:en'];
  const nameEn = tags['name:en'] || tags['name:int_name'] || null;

  if (!nameAr) return false; // Must have a name

  // Skip generics
  if (['Pharmacy', 'صيدلية', 'Drugstore'].includes(nameAr)) return false;

  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;
  if (!lat || !lon) return false;

  // Detect nursing/delivery
  // Nursing is rarely explicit in OSM, we check for "clinic" or "nursing" in name/tags
  // Delivery: delivery=yes
  const hasDelivery = tags.delivery === 'yes';
  
  // Check for nursing keywords in name or description
  const combinedText = `${nameAr} ${nameEn || ''} ${tags.description || ''} ${tags['description:ar'] || ''}`;
  const hasNursing = /nursing|تمريض|حقن|قياس ضغط|سكر/i.test(combinedText);

  // Address & City
  const addrCity = tags['addr:city'] || tags['addr:city:ar'] || tags['addr:city:en'];
  let cityId: number | null = null;
  
  if (addrCity) {
    const c = cities.find(ct => 
      ct.nameAr === addrCity || 
      (ct.nameEn && ct.nameEn.toLowerCase() === addrCity.toLowerCase())
    );
    if (c) cityId = c.id;
  }
  
  // Opening Hours
  const hours = tags.opening_hours;
  const is24h = hours === '24/7' || hours === '00:00-24:00';

  // Slug
  const slugBase = (nameEn || nameAr).toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${slugBase}-${element.id}`;

  const data = {
    nameAr,
    nameEn,
    slug,
    address: tags['addr:street'] ? `${tags['addr:street']}, ${addrCity || ''}` : addrCity,
    phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'],
    hotline: tags['contact:hotline'],
    website: tags.website || tags['contact:website'] || tags.url,
    lat,
    lng: lon,
    logo: null,
    hasDeliveryService: hasDelivery,
    hasNursingService: hasNursing,
    hours: hours || undefined,
    is24h,
    cityId,
    governorateId: govId,
    isOpen: true
  };

  try {
    await prisma.pharmacy.upsert({
      where: { slug },
      update: data,
      create: data
    });
    return true;
  } catch (e) {
    return false;
  }
}

main();
