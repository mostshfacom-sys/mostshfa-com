
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum', 
  'Gharbia', 'Ismailia', 'Menofia', 'Minya', 'Qalyubia', 'New Valley', 'Suez', 
  'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharqia', 
  'South Sinai', 'Kafr El Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag'
];

// Map alternative spellings if needed
const GOV_MAPPING: Record<string, string> = {
  'Gharbiya': 'Gharbia',
  'Sharkia': 'Sharqia',
  'Kafr Al Sheikh': 'Kafr El Sheikh',
  'Monufia': 'Menofia',
  'Qaliubiya': 'Qalyubia'
};

async function main() {
  console.log('Starting robust OSM fetcher...');

  // Pre-load cities
  const cities = await prisma.city.findMany({
    include: { governorate: true }
  });

  let totalImported = 0;

  for (const gov of GOVERNORATES) {
    console.log(`\n--- Processing Governorate: ${gov} ---`);
    try {
      const count = await fetchForGovernorate(gov, cities);
      totalImported += count;
    } catch (e) {
      console.error(`Failed to process ${gov}:`, e);
    }
    // Wait a bit to be nice to Overpass API
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nTotal imported hospitals/clinics: ${totalImported}`);
  await prisma.$disconnect();
}

async function fetchForGovernorate(govName: string, cities: any[]) {
  // Query for area by name
  // Then search within that area
  const query = `
    [out:json][timeout:60];
    area["name:en"="${govName}"]["admin_level"="4"]->.searchArea;
    (
      node["amenity"="hospital"](area.searchArea);
      way["amenity"="hospital"](area.searchArea);
      relation["amenity"="hospital"](area.searchArea);
      
      node["healthcare"="hospital"](area.searchArea);
      node["healthcare"="centre"](area.searchArea);
    );
    out center body;
  `;

  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 120000 // 2 mins axios timeout
    });

    const elements = response.data.elements;
    console.log(`Found ${elements.length} items in ${govName}`);

    if (elements.length === 0) {
        // Retry with Arabic name if English fails or yields nothing? 
        // Or maybe just "Egypt" bounding box if gov fails?
        // For now just continue.
        return 0;
    }

    let count = 0;
    for (const element of elements) {
      const saved = await saveElement(element, cities, govName);
      if (saved) count++;
    }
    console.log(`Saved ${count} items for ${govName}`);
    return count;

  } catch (error: any) {
    if (error.response && error.response.status === 400) {
        console.error(`Bad Request for ${govName} (maybe area not found)`);
    } else if (error.code === 'ECONNABORTED') {
        console.error(`Timeout fetching ${govName}`);
    } else {
        console.error(`Error fetching ${govName}:`, error.message);
    }
    return 0;
  }
}

async function saveElement(element: any, cities: any[], govContext: string) {
  const tags = element.tags || {};
  if (!tags.name && !tags['name:ar'] && !tags['name:en']) return false;

  const nameAr = tags['name:ar'] || tags['name'] || tags['name:en'];
  const nameEn = tags['name:en'] || tags['name:int_name'] || null;

  // Skip generics
  if (['Hospital', 'مستشفى', 'عيادة', 'Clinic', 'Pharmacy'].includes(nameAr)) return false;

  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;
  if (!lat || !lon) return false;

  // Determine Type
  let typeSlug = 'general';
  // تخصيص نوع المستشفى فقط
  if (tags.healthcare === 'specialised') typeSlug = 'specialized';
  else if (tags.operator_type === 'private') typeSlug = 'private';
  else if (tags.university === 'yes') typeSlug = 'university';
  else if (tags.military === 'yes') typeSlug = 'military';
  else if (tags.healthcare === 'centre') typeSlug = 'center';

  const type = await prisma.hospitalType.findFirst({ where: { slug: typeSlug } });

  // Location Mapping
  let cityId: number | null = null;
  let governorateId: number | null = null;

  const addrCity = tags['addr:city'] || tags['addr:city:ar'] || tags['addr:city:en'];
  
  // Try to find city
  if (addrCity) {
    const city = cities.find(c => 
      c.nameAr === addrCity || 
      c.nameEn?.toLowerCase() === addrCity.toLowerCase() ||
      c.nameAr.includes(addrCity)
    );
    if (city) {
      cityId = city.id;
      governorateId = city.governorateId;
    }
  }

  // If no city found, try to map based on governorate context
  if (!governorateId) {
    // Find governorate ID by name
    const gov = await prisma.governorate.findFirst({
        where: {
            OR: [
                { nameEn: { contains: govContext } },
                { nameAr: { contains: govContext } } // unlikely but possible
            ]
        }
    });
    if (gov) governorateId = gov.id;
  }

  // Details
  const hasEmergency = tags.emergency === 'yes';
  const wheelchairAccessible = tags.wheelchair === 'yes';
  const hasAmbulance = tags.ambulance === 'yes' || tags.emergency === 'yes';
  const beds = tags['capacity:beds'] ? parseInt(tags['capacity:beds']) : 0;
  const operator = tags.operator || tags['operator:ar'];
  const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'];
  const website = tags.website || tags['contact:website'] || tags.url;
  
  // Basic Image Handling (Wiki)
  let image = tags.image;
  if (!image && tags.wikimedia_commons && tags.wikimedia_commons.startsWith('File:')) {
    const filename = tags.wikimedia_commons.replace('File:', '').trim();
    image = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
  }

  // Unique Slug
  const slugBase = (nameEn || nameAr).toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const slug = `${slugBase}-${element.id}`; // Use OSM ID to ensure uniqueness

  try {
    await prisma.hospital.upsert({
      where: { slug },
      update: {
        nameAr, nameEn, lat, lng: lon,
        address: tags['addr:street'] ? `${tags['addr:street']}, ${addrCity || ''}` : addrCity,
        phone, website, hasEmergency, wheelchairAccessible, hasAmbulance, beds, operator,
        typeId: type?.id, cityId, governorateId, logo: image
      },
      create: {
        nameAr, nameEn, slug, lat, lng: lon,
        address: tags['addr:street'] ? `${tags['addr:street']}, ${addrCity || ''}` : addrCity,
        phone, website, hasEmergency, wheelchairAccessible, hasAmbulance, beds, operator,
        typeId: type?.id, cityId, governorateId, logo: image
      }
    });
    return true;
  } catch (e) {
    // Ignore unique constraint errors if any (shouldn't happen with upsert + unique slug)
    return false;
  }
}

main();
