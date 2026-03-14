import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import { OpenLocationCode } from 'open-location-code';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const WAIT = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GOV_REFS: Record<string, { id: number, lat: number, lng: number }> = {
  'القاهرة': { id: 1, lat: 30.0444, lng: 31.2357 },
  'الجيزة': { id: 2, lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { id: 3, lat: 31.2001, lng: 29.9187 },
  'الدقهلية': { id: 4, lat: 31.0409, lng: 31.3785 },
  'الغربية': { id: 9, lat: 30.7865, lng: 31.0004 },
  'الشرقية': { id: 7, lat: 30.5765, lng: 31.5041 },
  'المنوفية': { id: 6, lat: 30.5526, lng: 31.0101 },
  'سوهاج': { id: 19, lat: 26.5570, lng: 31.6948 },
  'أسيوط': { id: 18, lat: 27.1783, lng: 31.1859 },
  'المنيا': { id: 17, lat: 28.1099, lng: 30.7503 },
};

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function scrapeEgyptianClinics() {
  console.log('🚀 Starting Robust Egyptian Clinic Scraper (Universal Coverage)...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ar'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

  // Focus on missing or under-represented governorates first
  const targetGovNames = ['الدقهلية', 'الغربية', 'سوهاج', 'أسيوط', 'المنوفية', 'الشرقية'];
  
  const cities = await prisma.city.findMany({
    where: {
      governorate: {
        nameAr: { in: targetGovNames }
      }
    },
    include: { governorate: true },
    take: 50 // Limit per run for safety
  });

  const specialties = await prisma.specialty.findMany({ take: 10 });

  for (const city of cities) {
    const govRef = GOV_REFS[city.governorate.nameAr];
    if (!govRef) continue;

    for (const spec of specialties) {
      const query = `عيادة ${spec.nameAr} في ${city.nameAr} ${city.governorate.nameAr}`;
      console.log(`\n🔍 Searching: ${query}`);

      try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        // Scroll to load results
        await page.evaluate(async () => {
          const container = document.querySelector('div[role="feed"]');
          if (container) {
            for (let i = 0; i < 3; i++) {
              container.scrollBy(0, 1000);
              await new Promise(r => setTimeout(r, 800));
            }
          }
        });

        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href*="/maps/place/"]'))
            .map((a: any) => a.href)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 10);
        });

        for (const link of links) {
          try {
            await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
            await WAIT(1000);

            const data = await page.evaluate(() => {
              const name = document.querySelector('h1')?.textContent?.trim() || '';
              const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
              const phone = document.querySelector('button[data-item-id*="phone"]')?.textContent?.trim() || '';
              const rating = document.querySelector('span.ceNzR')?.textContent?.trim() || '0';
              const reviews = document.querySelector('span.F7nice')?.textContent?.replace(/[()]/g, '').trim() || '0';
              
              let img = '';
              const imgEl = document.querySelector('img[src*="googleusercontent.com"]') as HTMLImageElement;
              if (imgEl) img = imgEl.src;

              const hours: any = {};
              const rows = Array.from(document.querySelectorAll('table tr'));
              rows.forEach(row => {
                const day = row.querySelector('td:first-child')?.textContent?.trim();
                const time = row.querySelector('td:last-child')?.textContent?.trim();
                if (day && time && day.length < 20) hours[day] = time;
              });

              return { name, address, phone, rating, reviews, img, hours };
            });

            if (!data.name || data.name.length < 3) continue;

            // Strict Validation: Ensure the result actually belongs to the target city/gov
            if (!data.address.includes(city.nameAr) && !data.address.includes(city.governorate.nameAr)) {
              console.log(`⚠️ Skipping ${data.name} - address mismatch: ${data.address}`);
              continue;
            }

            // Deduplication Check
            const existing = await prisma.clinic.findFirst({
              where: {
                OR: [
                  { nameAr: data.name, cityId: city.id },
                  { phone: data.phone !== '' ? data.phone : undefined }
                ]
              }
            });

            if (existing) {
              console.log(`♻️ Skipping ${data.name} - already exists.`);
              continue;
            }

            // Plus Code & Coordinates
            let lat = null, lng = null;
            const plusCodeMatch = data.address.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
            if (plusCodeMatch) {
              try {
                const code = plusCodeMatch[0].toUpperCase();
                const recovered = olc.recoverNearest(code, govRef.lat, govRef.lng);
                const decoded = olc.decode(recovered);
                lat = decoded.latitudeCenter;
                lng = decoded.longitudeCenter;
              } catch (e) {}
            }

            const slug = normalizeSlug(data.name) + '-' + Math.random().toString(36).slice(-4);

            await prisma.clinic.create({
              data: {
                nameAr: data.name,
                slug,
                addressAr: data.address,
                phone: data.phone || '16676',
                image: data.img || '',
                ratingAvg: parseFloat(data.rating.replace(',', '.')) || 0,
                ratingCount: parseInt(data.reviews.replace(/[^0-9]/g, '')) || 0,
                workingHours: JSON.stringify(data.hours),
                governorateId: city.governorateId,
                cityId: city.id,
                isOpen: true,
                status: 'published',
                specialties: { connect: [{ id: spec.id }] },
                lat,
                lng
              }
            });

            console.log(`✅ Saved: ${data.name} (${city.nameAr})`);

          } catch (err) {
            console.error(`❌ Error detail page:`, err);
          }
        }
      } catch (err) {
        console.error(`❌ Error search:`, err);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('✨ Universal Scraper Finished!');
}

scrapeEgyptianClinics().catch(console.error);
