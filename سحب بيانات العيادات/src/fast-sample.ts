import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

async function runFastSample() {
  console.log('🚀 Starting Fast-Track Scraper (5 Clinics Only)...');
  
  // Load DATABASE_URL from main .env
  const mainEnvPath = path.resolve(process.cwd(), '..', '..', '.env');
  if (fs.existsSync(mainEnvPath)) {
    const content = fs.readFileSync(mainEnvPath, 'utf-8');
    const match = content.match(/\bDATABASE_URL\s*=\s*"?([^"\n\r]+)"?/);
    if (match?.[1]) process.env.DATABASE_URL = match[1].trim();
  }

  const prisma = new PrismaClient();
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ar'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const createdLinks: string[] = [];
  
  try {
    // 1. Get Cairo (ID 1)
    const city = await prisma.city.findFirst({
      where: { id: 1 },
      include: { governorate: true }
    });
    // 2. Get Dental Specialty (ID 1)
    const spec = await prisma.specialty.findFirst({ where: { id: 1 } });

    if (!city || !spec) throw new Error('City or Specialty not found');

    const query = `عيادة أسنان في القاهرة`;
    console.log(`🔍 Searching: ${query}`);

    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Extract first 10 links to be sure we get 5 valid ones
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/maps/place/"]'))
        .map((a: any) => a.href)
        .slice(0, 10);
    });

    console.log(`✅ Found ${links.length} links. Processing...`);

    for (const link of links) {
      if (createdLinks.length >= 5) break;

      try {
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 20000 });
        
        const data = await page.evaluate(() => {
          const name = document.querySelector('h1')?.textContent?.trim() || '';
          const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
          const phone = document.querySelector('button[data-item-id*="phone"]')?.textContent?.trim() || '';
          const rating = document.querySelector('span.ceNzR')?.textContent?.trim() || '0';
          const reviews = document.querySelector('span.F7nice')?.textContent?.replace(/[()]/g, '').trim() || '0';
          return { name, address, phone, rating, reviews };
        });

        if (!data.name || data.name.length < 3) continue;

        // Extract Place ID from URL
        const url = page.url();
        const m = url.match(/0x[0-9a-f]+:0x[0-9a-f]+/i);
        const googlePlaceId = m ? `hex:${m[0].toLowerCase()}` : `link:${Buffer.from(link).toString('base64').slice(0,16)}`;

        const slug = `${data.name.replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`.toLowerCase();

        await prisma.clinic.upsert({
          where: { googlePlaceId },
          create: {
            nameAr: data.name,
            slug,
            googlePlaceId,
            addressAr: data.address,
            phone: data.phone || '16676',
            ratingAvg: parseFloat(data.rating.replace(',', '.')) || 0,
            ratingCount: parseInt(data.reviews.replace(/[^0-9]/g, '')) || 0,
            governorateId: city.governorateId,
            cityId: city.id,
            status: 'published',
            specialties: { connect: [{ id: spec.id }] }
          },
          update: { nameAr: data.name }
        });

        const siteLink = `https://mostshfa.com/clinics/${slug}`;
        createdLinks.push(siteLink);
        console.log(`✨ Saved [${createdLinks.length}/5]: ${data.name} -> ${siteLink}`);

      } catch (err) {
        console.error('❌ Error processing link:', err);
      }
    }

  } catch (err) {
    console.error('💥 Fatal error:', err);
  } finally {
    await browser.close();
    await prisma.$disconnect();
    
    console.log('\n🎯 --- RESULTS ---');
    createdLinks.forEach(l => console.log(l));
    fs.writeFileSync('fast-sample-results.json', JSON.stringify(createdLinks, null, 2));
  }
}

runFastSample();
