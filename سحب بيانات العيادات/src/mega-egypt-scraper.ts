import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import { OpenLocationCode } from 'open-location-code';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();
const olc = new OpenLocationCode();

const WAIT = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Accurate Governorate references for Plus Code decoding
const GOV_REFS: Record<string, { id: number, lat: number, lng: number }> = {
  'القاهرة': { id: 1, lat: 30.0444, lng: 31.2357 },
  'الجيزة': { id: 2, lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { id: 3, lat: 31.2001, lng: 29.9187 },
  'الدقهلية': { id: 4, lat: 31.0409, lng: 31.3785 },
  'الشرقية': { id: 7, lat: 30.5765, lng: 31.5041 },
  'القليوبية': { id: 8, lat: 30.4591, lng: 31.1786 },
  'الغربية': { id: 9, lat: 30.7865, lng: 31.0004 },
  'البحيرة': { id: 10, lat: 31.0379, lng: 30.4726 },
  'المنوفية': { id: 6, lat: 30.5526, lng: 31.0101 },
  'سوهاج': { id: 19, lat: 26.5570, lng: 31.6948 },
  'أسيوط': { id: 18, lat: 27.1783, lng: 31.1859 },
  'المنيا': { id: 17, lat: 28.1099, lng: 30.7503 },
  'قنا': { id: 20, lat: 26.1551, lng: 32.7160 },
  'الأقصر': { id: 21, lat: 25.6872, lng: 32.6396 },
  'أسوان': { id: 22, lat: 24.0889, lng: 32.8998 },
  'كفر الشيخ': { id: 11, lat: 31.1107, lng: 30.9388 },
  'دمياط': { id: 12, lat: 31.4175, lng: 31.8144 },
  'بورسعيد': { id: 13, lat: 31.2653, lng: 32.3019 },
  'الإسماعيلية': { id: 14, lat: 30.5965, lng: 32.2715 },
  'السويس': { id: 15, lat: 29.9668, lng: 32.5498 },
  'الفيوم': { id: 16, lat: 29.3084, lng: 30.8428 },
  'بني سويف': { id: 23, lat: 29.0661, lng: 31.0994 },
};

function normalizeText(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

function generateUniqueSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 6)}`;
}

async function scrapeMegaEgypt() {
  console.log('🌟 Starting MEGA Egypt Clinic Scraper v2.0...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ar'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

  // Load target regions (Filter to maximize coverage)
  const cities = await prisma.city.findMany({
    include: { governorate: true },
    where: {
      governorate: {
        nameAr: { in: Object.keys(GOV_REFS) }
      }
    },
    orderBy: { id: 'asc' }
  });

  const specialties = await prisma.specialty.findMany({
    where: {
      id: { in: [1, 2, 3, 5, 6, 7, 8, 9, 10, 22, 23, 25, 26, 27] } // Primary specialties
    }
  });

  console.log(`📊 Target: ${cities.length} cities, ${specialties.length} specialties.`);

  for (const city of cities) {
    const govRef = GOV_REFS[city.governorate.nameAr];
    if (!govRef) continue;

    for (const spec of specialties) {
      const searchQuery = `عيادة ${spec.nameAr} في ${city.nameAr} ${city.governorate.nameAr}`;
      console.log(`\n🔍 [City: ${city.nameAr}] [Spec: ${spec.nameAr}] -> ${searchQuery}`);

      try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=ar`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        // Scroll to load more results
        await page.evaluate(async () => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) {
            for (let i = 0; i < 3; i++) {
              feed.scrollBy(0, 1000);
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        });

        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href*="/maps/place/"]'))
            .map((a: any) => a.href)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 15);
        });

        for (const link of links) {
          try {
            await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
            await WAIT(1500);

            const details = await page.evaluate(() => {
              const name = document.querySelector('h1')?.textContent?.trim() || '';
              const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
              const phone = document.querySelector('button[data-item-id*="phone"]')?.textContent?.trim() || '';
              const rating = document.querySelector('span.ceNzR')?.textContent?.trim() || '0';
              const reviews = document.querySelector('span.F7nice')?.textContent?.replace(/[()]/g, '').trim() || '0';
              
              let image = '';
              const imgEl = document.querySelector('img[src*="googleusercontent.com/p/"]') as HTMLImageElement;
              if (imgEl) image = imgEl.src;

              const hours: Record<string, string> = {};
              const hourRows = Array.from(document.querySelectorAll('table.eK6uCc tr'));
              hourRows.forEach(row => {
                const day = row.querySelector('td:first-child')?.textContent?.trim();
                const time = row.querySelector('td:last-child')?.textContent?.trim();
                if (day && time) hours[day] = time;
              });

              return { name, address, phone, rating, reviews, image, hours };
            });

            if (!details.name || details.name.length < 3) continue;

            // --- STRICT VALIDATION & DEDUPLICATION ---
            const normalizedName = normalizeText(details.name);
            const normalizedAddress = normalizeText(details.address);

            // 1. Geography Check (Ensure it's in the right governorate)
            if (!normalizedAddress.includes(normalizeText(city.governorate.nameAr)) && 
                !normalizedAddress.includes(normalizeText(city.nameAr))) {
              console.log(`⚠️ Geo-Mismatch: ${details.name} is in ${details.address}, skipped.`);
              continue;
            }

            // 2. Database Duplication Check
            const existing = await prisma.clinic.findFirst({
              where: {
                OR: [
                  { nameAr: details.name, cityId: city.id },
                  { phone: details.phone && details.phone !== '' ? details.phone : '_____' }
                ]
              }
            });

            if (existing) {
              console.log(`♻️ Duplicate: ${details.name} already exists.`);
              continue;
            }

            // 3. Coordinate Extraction (Plus Code)
            let lat = null, lng = null;
            const plusCodeMatch = details.address.match(/[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}/i);
            if (plusCodeMatch) {
              try {
                const code = plusCodeMatch[0].toUpperCase();
                const recovered = olc.recoverNearest(code, govRef.lat, govRef.lng);
                const decoded = olc.decode(recovered);
                lat = decoded.latitudeCenter;
                lng = decoded.longitudeCenter;
              } catch (e) {}
            }

            // 4. Save to Database
            await prisma.clinic.create({
              data: {
                nameAr: details.name,
                slug: generateUniqueSlug(details.name),
                addressAr: details.address,
                phone: details.phone || '16676',
                image: details.image || '',
                ratingAvg: parseFloat(details.rating.replace(',', '.')) || 0,
                ratingCount: parseInt(details.reviews.replace(/[^0-9]/g, '')) || 0,
                workingHours: JSON.stringify(details.hours),
                governorateId: city.governorateId,
                cityId: city.id,
                isOpen: true,
                status: 'published',
                specialties: { connect: [{ id: spec.id }] },
                lat,
                lng
              }
            });

            console.log(`✅ Saved: ${details.name} in ${city.nameAr}`);

          } catch (err) {
            console.error(`❌ Detail Error:`, (err as Error).message);
          }
        }
      } catch (err) {
        console.error(`❌ Search Error:`, (err as Error).message);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('🚀 MEGA SCRAPER COMPLETED!');
}

scrapeMegaEgypt().catch(console.error);
