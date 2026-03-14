import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import { OpenLocationCode } from 'open-location-code';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

let prisma: PrismaClient;
const olc = new OpenLocationCode();

const CHECKPOINT_FILE = 'checkpoint.json';
const LOG_FILE = 'scrape.log';
const WAIT = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SAMPLE_LIMIT = Number(process.env.SAMPLE_LIMIT || '5');
const MAX_RESULTS_PER_QUERY = Number(process.env.MAX_RESULTS_PER_QUERY || '300');
const SITE_BASE_URL = (process.env.SITE_BASE_URL || '').replace(/\/$/, '');

function log(line: string) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  try {
    fs.appendFileSync(LOG_FILE, msg + '\n', 'utf-8');
  } catch {
    // ignore
  }
}

function loadEnvIfMissing() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') return;

  // 1) Try local .env in this scraper directory
  const localEnvPath = path.resolve(process.cwd(), '.env');
  // 2) Fallback to main project .env (two levels up from "سحب بيانات العيادات")
  const mainEnvPath = path.resolve(process.cwd(), '..', '..', '.env');

  const tryParse = (envPath: string) => {
    if (!fs.existsSync(envPath)) return false;
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/\bDATABASE_URL\s*=\s*"?([^"\n\r]+)"?/);
    if (!match?.[1]) return false;
    process.env.DATABASE_URL = match[1].trim();
    return true;
  };

  const ok = tryParse(localEnvPath) || tryParse(mainEnvPath);
  if (!ok) {
    throw new Error(
      `DATABASE_URL is missing. Create .env in scraper folder or ensure main .env exists at: ${mainEnvPath}`
    );
  }
}

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

function loadCheckpoint() {
  if (process.env.RESET_CHECKPOINT === '1') {
    return { lastCityId: 0, lastSpecId: 0, lastLinkIndex: -1 };
  }
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
  }
  return { lastCityId: 0, lastSpecId: 0, lastLinkIndex: -1 };
}

function saveCheckpoint(cityId: number, specId: number, lastLinkIndex: number) {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify({ lastCityId: cityId, lastSpecId: specId, lastLinkIndex }, null, 2)
  );
}

function normalizeText(text: string): string {
  if (!text) return '';
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

function hashStringToBase36(input: string): string {
  // djb2-ish
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  // force uint32
  const u = hash >>> 0;
  return u.toString(36);
}

function generateDeterministicClinicSlug(args: {
  name: string;
  cityId: number | null | undefined;
  governorateId: number | null | undefined;
  address?: string;
  phone?: string;
}): string {
  const base = normalizeText(args.name)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const normalizedPhone = normalizeText(args.phone || '').replace(/[^0-9+]/g, '');
  const normalizedAddress = normalizeText(args.address || '');
  const dedupHint = normalizedPhone || normalizedAddress;

  const key = [
    normalizeText(args.name),
    String(args.governorateId ?? ''),
    String(args.cityId ?? ''),
    dedupHint,
  ].join('|');

  const suffix = hashStringToBase36(key).slice(0, 7);
  return `${base}-${suffix}`;
}

function extractGooglePlaceIdFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const cid = u.searchParams.get('cid');
    if (cid && cid.trim() !== '') return `cid:${cid.trim()}`;
  } catch {
    // ignore
  }

  // Common stable token in Google Maps place URLs
  const m = url.match(/0x[0-9a-f]+:0x[0-9a-f]+/i);
  if (m?.[0]) return `hex:${m[0].toLowerCase()}`;

  return null;
}

async function collectPlaceLinks(page: any, maxLinks: number): Promise<string[]> {
  const unique = new Set<string>();
  let stableRounds = 0;

  // Special case for Sample mode: don't over-scroll
  const isSample = Number(process.env.SAMPLE_LIMIT || '0') > 0;
  const scrollLimit = isSample ? 5 : 40;

  // Try multiple scroll rounds until no new links are found
  for (let round = 0; round < scrollLimit; round++) {
    const batch = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/maps/place/"]')) as HTMLAnchorElement[];
      return anchors.map((a) => a.href).filter(Boolean);
    });

    const before = unique.size;
    for (const href of batch) unique.add(href);

    if (unique.size >= maxLinks) break;

    if (unique.size === before) stableRounds++;
    else stableRounds = 0;

    // If stable for a few rounds, stop
    if (stableRounds >= 4) break;

    if (isSample && unique.size >= Number(process.env.SAMPLE_LIMIT || '5') * 2) break;

    await page.evaluate(async (isSample: boolean) => {
      const feed = document.querySelector('div[role="feed"]');
      if (!feed) return;
      feed.scrollBy(0, isSample ? 1500 : 2500);
      await new Promise((r) => setTimeout(r, isSample ? 800 : 1200));
    }, isSample);
  }

  return Array.from(unique).slice(0, maxLinks);
}

async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.log(`⚠️ Attempt failed, retrying in ${delay}ms... (${retries} left)`);
      await WAIT(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

async function scrapeMegaEgyptResilient() {
  loadEnvIfMissing();
  prisma = new PrismaClient();
  log('🌟 Starting RESILIENT MEGA Egypt Scraper v3.1...');

  const createdClinicLinks: string[] = [];
  let createdClinicsCount = 0;
  
  const checkpoint = loadCheckpoint();
  log(`📍 Resuming from: City ID ${checkpoint.lastCityId}, Spec ID ${checkpoint.lastSpecId}, LinkIndex ${checkpoint.lastLinkIndex}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ar'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

  page.on('pageerror', (err) => log(`🧨 pageerror: ${String(err)}`));
  page.on('error', (err) => log(`🧨 error: ${String(err)}`));

  const cities = await prisma.city.findMany({
    include: { governorate: true },
    where: {
      governorate: { nameAr: { in: Object.keys(GOV_REFS) } },
      id: { gte: checkpoint.lastCityId }
    },
    orderBy: { id: 'asc' }
  });

  const specialties = await prisma.specialty.findMany({
    where: { id: { in: [1, 2, 3, 5, 6, 7, 8, 9, 10, 22, 23, 25, 26, 27, 38, 39, 40, 41, 42] } },
    orderBy: { id: 'asc' },
    take: process.env.SAMPLE_LIMIT ? 1 : undefined
  });

  for (const city of cities) {
    const govRef = GOV_REFS[city.governorate.nameAr];
    if (!govRef) continue;

    for (const spec of specialties) {
      // Skip if already processed in this city according to checkpoint
      if (city.id === checkpoint.lastCityId && spec.id < checkpoint.lastSpecId) continue;

      const searchQuery = `عيادة ${spec.nameAr} في ${city.nameAr} ${city.governorate.nameAr}`;
      log(`🔍 [City: ${city.nameAr} (${city.id})] [Spec: ${spec.nameAr} (${spec.id})] -> ${searchQuery}`);

      try {
        await retry(async () => {
          await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=ar`, {
            waitUntil: 'networkidle2',
            timeout: 60000,
          });
        });

        // Detect blocks/captcha
        const blocked = await page.evaluate(() => {
          const t = document.body?.innerText || '';
          return (
            t.includes('unusual traffic') ||
            t.includes('لم يتمكّن') ||
            t.includes('تعذّر') ||
            t.includes('أثبت أنك لست برنامجًا') ||
            t.includes('حلّ اختبار') ||
            t.includes('Our systems have detected')
          );
        });
        if (blocked) {
          saveCheckpoint(city.id, spec.id, checkpoint.lastLinkIndex ?? -1);
          throw new Error('Google Maps appears blocked / captcha. Stop now to avoid corrupt scraping.');
        }

        const links = await collectPlaceLinks(page, MAX_RESULTS_PER_QUERY);

        log(`✅ Found ${links.length} potential clinics.`);

        const startLinkIndex =
          city.id === checkpoint.lastCityId && spec.id === checkpoint.lastSpecId
            ? (checkpoint.lastLinkIndex ?? -1) + 1
            : 0;

        if (startLinkIndex > 0) {
          log(`⏩ Resuming links from index ${startLinkIndex}/${links.length}`);
        }

        for (let linkIndex = startLinkIndex; linkIndex < links.length; linkIndex++) {
          const link = links[linkIndex];
          try {
            await retry(async () => {
              await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
            });
            await WAIT(1000);

            const googlePlaceId = extractGooglePlaceIdFromUrl(page.url()) || extractGooglePlaceIdFromUrl(link);
            if (!googlePlaceId) {
              log(`⚠️ Missing googlePlaceId for link, skipped: ${link}`);
              saveCheckpoint(city.id, spec.id, linkIndex);
              continue;
            }

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

            const normalizedAddress = normalizeText(details.address);
            if (!normalizedAddress.includes(normalizeText(city.governorate.nameAr)) && 
                !normalizedAddress.includes(normalizeText(city.nameAr))) {
              log(`⚠️ Geo-Mismatch: ${details.name} is in ${details.address}, skipped.`);
              continue;
            }

            const cleanedPhone = normalizeText(details.phone).replace(/[^0-9+]/g, '');
            const nameKey = normalizeText(details.name);
            const addressKey = normalizedAddress;

            const existing = await prisma.clinic.findFirst({
              where: {
                OR: [
                  { googlePlaceId },
                  { nameAr: details.name, cityId: city.id },
                  ...(cleanedPhone ? [{ phone: { contains: cleanedPhone } }] : []),
                  {
                    AND: [
                      { cityId: city.id },
                      { nameAr: { contains: nameKey } },
                      { addressAr: { contains: addressKey.slice(0, Math.min(addressKey.length, 24)) } },
                    ],
                  },
                ]
              }
            });

            if (existing) {
              log(`♻️ Duplicate: ${details.name} already exists.`);
              continue;
            }

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

            const slug = generateDeterministicClinicSlug({
              name: details.name,
              governorateId: city.governorateId,
              cityId: city.id,
              address: details.address,
              phone: cleanedPhone || details.phone,
            });

            await prisma.clinic.upsert({
              where: { googlePlaceId },
              create: {
                nameAr: details.name,
                slug,
                googlePlaceId,
                addressAr: details.address,
                phone: cleanedPhone || details.phone || '16676',
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
                lng,
              },
              update: {
                // If re-run, refresh essential fields without creating duplicates
                nameAr: details.name,
                addressAr: details.address,
                phone: cleanedPhone || details.phone || undefined,
                image: details.image || undefined,
                ratingAvg: parseFloat(details.rating.replace(',', '.')) || 0,
                ratingCount: parseInt(details.reviews.replace(/[^0-9]/g, '')) || 0,
                workingHours: JSON.stringify(details.hours),
                lat,
                lng,
              },
            });

            log(`✅ Saved: ${details.name} in ${city.nameAr}`);

            createdClinicsCount++;
            const relative = `/clinics/${slug}`;
            const full = SITE_BASE_URL ? `${SITE_BASE_URL}${relative}` : relative;
            createdClinicLinks.push(full);
            log(`🔗 Link: ${full}`);

            if (createdClinicsCount >= SAMPLE_LIMIT) {
              fs.writeFileSync('created-clinic-links.json', JSON.stringify(createdClinicLinks, null, 2));
              log(`🧪 Sample limit reached (${SAMPLE_LIMIT}). Stopping after saving links to created-clinic-links.json`);
              await browser.close();
              if (prisma) await prisma.$disconnect();
              return;
            }

            // Save progress after each successfully processed link (even if skipped/duplicate, we move forward)
            saveCheckpoint(city.id, spec.id, linkIndex);
          } catch (err) {
            log(`❌ Detail Error: ${(err as Error).message}`);
            saveCheckpoint(city.id, spec.id, linkIndex);
          }
        }

        // Mark query completed
        saveCheckpoint(city.id, spec.id, links.length - 1);
      } catch (err) {
        log(`❌ Search Error: ${(err as Error).message}`);
        await WAIT(5000); // Cooldown on error
      }
    }
  }

  await browser.close();
  if (prisma) {
    await prisma.$disconnect();
  }
  log('🚀 MEGA SCRAPER COMPLETED!');
}

scrapeMegaEgyptResilient().catch(console.error);
