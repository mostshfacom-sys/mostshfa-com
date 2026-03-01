
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Function to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

async function main() {
  console.log('Fetching hospitals from Overpass API...');

  const query = `
    [out:json][timeout:180];
    area["name:en"="Egypt"]->.searchArea;
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;
    const elements = data.elements;

    console.log(`Found ${elements.length} hospitals from OSM.`);

    // Pre-load cities and governorates for mapping
    const cities = await prisma.city.findMany({
      include: { governorate: true }
    });
    
    // Cache for city coordinates (approximate center if not in DB, but DB doesn't have lat/lon for cities yet? Let's check schema)
    // Schema has City but no lat/lon. I'll need to add lat/lon to City if I want to map by distance accurately, 
    // OR I can just map to the nearest hospital if I had city coords.
    // For now, I'll rely on the address tags if available, otherwise I'll leave city null or try to match string.
    
    // Wait, I can't easily map to City ID without City coordinates. 
    // Let's check if City has lat/lon.
    // The schema shows City has no lat/lon.
    // However, I can try to match by name if `addr:city` exists.

    let count = 0;
    
    // Helper to find nearest city if we can't match by name
    // Since we don't have city coordinates in DB, we can't do distance-based mapping easily.
    // We will rely on name matching.

    for (const element of elements) {
      const tags = element.tags || {};
      
      // Filter out non-hospitals or very incomplete data
      if (!tags.name && !tags['name:ar'] && !tags['name:en']) continue;

      const nameAr = tags['name:ar'] || tags['name'] || tags['name:en'];
      const nameEn = tags['name:en'] || tags['name:int_name'] || tags['name:fr'] || null;

      // Skip if name is just "Hospital" or generic
      if (nameAr === 'Hospital' || nameAr === 'مستشفى') continue;

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) continue;

      // Determine Type (Hospitals only)
      let typeSlug = 'general'; // Default
      if (tags.healthcare === 'specialised') typeSlug = 'specialized';
      else if (tags.operator_type === 'private') typeSlug = 'private';
      else if (tags.operator_type === 'public' || tags.operator_type === 'government') typeSlug = 'general';
      else if (tags.university === 'yes') typeSlug = 'university';
      else if (tags.military === 'yes') typeSlug = 'military';
      else if (tags.healthcare === 'centre') typeSlug = 'center';

      // Find Type ID
      const type = await prisma.hospitalType.findFirst({
        where: { slug: typeSlug }
      });

      // Find City/Governorate by name match
      let cityId: number | null = null;
      let governorateId: number | null = null;

      const addrCity = tags['addr:city'] || tags['addr:city:ar'] || tags['addr:city:en'];
      const addrGov = tags['addr:state'] || tags['addr:province']; // OSM often uses state for governorate

      if (addrCity) {
        // Try to find city in DB
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

      // Prepare detailed fields
      const hasEmergency = tags.emergency === 'yes';
      const wheelchairAccessible = tags.wheelchair === 'yes';
      const hasAmbulance = tags.ambulance === 'yes' || tags.emergency === 'yes'; // Assume emergency implies ambulance often
      const beds = tags['capacity:beds'] ? parseInt(tags['capacity:beds']) : 0;
      const operator = tags.operator || tags['operator:ar'] || tags['operator:en'];
      
      const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'];
      const website = tags.website || tags['contact:website'] || tags.url;
      const email = tags.email || tags['contact:email'];
      
      // Images
      let image = tags.image || tags.image_url;
      if (!image && tags.wikimedia_commons) {
        // Construct wikimedia image (simplified, might need API to get real URL)
        // e.g. "Category:Hospital X" -> hard to get direct image without API
        // If it's a file "File:Image.jpg", we can use it
        if (tags.wikimedia_commons.startsWith('File:')) {
            const filename = tags.wikimedia_commons.replace('File:', '').replace(/ /g, '_');
            // simpler: use a proxy or special url
            image = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
        }
      }

      // Generate Slug
      const slug = (nameEn || nameAr).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + `-${count}`;

      try {
        await prisma.hospital.upsert({
          where: { slug: slug },
          update: {
            nameAr,
            nameEn,
            lat,
            lng: lon,
            address: tags['addr:street'] ? `${tags['addr:street']}, ${addrCity || ''}` : addrCity,
            phone,
            website,
            email,
            hasEmergency,
            wheelchairAccessible,
            hasAmbulance,
            beds,
            operator,
            typeId: type?.id,
            cityId,
            governorateId,
            logo: image // Use logo field for main image
          },
          create: {
            nameAr,
            nameEn,
            slug,
            lat,
            lng: lon,
            address: tags['addr:street'] ? `${tags['addr:street']}, ${addrCity || ''}` : addrCity,
            phone,
            website,
            email,
            hasEmergency,
            wheelchairAccessible,
            hasAmbulance,
            beds,
            operator,
            typeId: type?.id,
            cityId,
            governorateId,
            logo: image
          }
        });
        count++;
        if (count % 50 === 0) console.log(`Processed ${count} hospitals...`);
      } catch (e) {
        console.error(`Error saving ${nameAr}:`, e);
      }
    }

    console.log(`Successfully imported ${count} hospitals.`);

  } catch (error) {
    console.error('Error fetching from Overpass:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Dummy MD5 for wikimedia (actually we can't easily implement this in browser env, 
// but in node we can using crypto. However, Wikimedia FilePath URL usually works directly without hash structure if using Special:FilePath)
// So I used Special:FilePath above.

main();
