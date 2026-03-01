import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

function extractPhones(text: string): string[] {
  const set = new Set<string>();
  // Regex for Egyptian mobile/landline
  // 010, 011, 012, 015 (mobile) -> 11 digits
  // 02, 03, etc (landline) -> 9-10 digits
  // Hotlines -> 19xxx (5 digits)
  
  const rx = /(?:\+?20\s?)?0?1[0125]\d{8}|(?:\+?20\s?)?0\d{1,2}\d{7,8}|\b19\d{3}\b/g;
  
  const m = text.match(rx) || [];
  m.forEach(x => set.add(x.replace(/\D/g, '').replace(/^20/, '0')));
  return Array.from(set);
}

async function main() {
  console.log('Starting Pharmacy Enrichment (Puppeteer)...');
  
  const pharmacies = await prisma.pharmacy.findMany({
    where: {
      OR: [
        { phone: null },
        { phone: '' }
      ]
    },
    include: {
      city: true
    },
    take: 100 // Process in batches
  });

  console.log(`Found ${pharmacies.length} pharmacies missing phone numbers.`);
  if (pharmacies.length === 0) return;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Block images/fonts to speed up
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  let updatedCount = 0;

  for (const p of pharmacies) {
    const name = p.nameAr || p.nameEn;
    if (!name) continue;

    const city = p.city?.nameAr || '';
    const query = `${name} ${city} رقم تليفون`;
    
    console.log(`Searching for: ${query}`);

    try {
      await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Get text content of results
      const content = await page.evaluate(() => document.body.innerText);
      const phones = extractPhones(content);
      
      // Analyze for services
      const hasNursing = /تمريض|حقن|قياس ضغط|قياس سكر|جروح|غيار|nursing|injection/i.test(content);
      const hasDelivery = /توصيل|دليفري|خدمة توصيل|delivery|home delivery|tawsil/i.test(content);

      if (phones.length > 0 || hasNursing || hasDelivery) {
        // Prefer hotline (5 digits) or mobile
        const hotline = phones.find(ph => ph.length === 5 && ph.startsWith('19'));
        const phone = phones.find(ph => ph.length >= 10 && ph !== hotline) || phones[0];

        console.log(`Found for ${name}: Phone=${phone||'X'} Hotline=${hotline||'X'} Nursing=${hasNursing} Delivery=${hasDelivery}`);
        
        await prisma.pharmacy.update({
          where: { id: p.id },
          data: {
            phone: phone || p.phone,
            hotline: hotline || p.hotline,
            hasDeliveryService: !!hotline || hasDelivery || p.hasDeliveryService,
            hasNursingService: hasNursing || p.hasNursingService
          }
        });
        updatedCount++;
      } else {
        console.log(`No info found for ${name}`);
      }
      
      // Random delay
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

    } catch (e: any) {
      console.error(`Error processing ${name}:`, e.message);
    }
  }

  console.log(`Updated ${updatedCount} pharmacies.`);
  await browser.close();
  await prisma.$disconnect();
}

main();
