
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function scrapeClinics() {
  console.log('Starting Clinics Scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Optimization
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const baseUrl = 'https://yellowpages.com.eg/ar/category/clinics';
  
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract basic info from list
    const clinics = await page.evaluate(() => {
      const items = document.querySelectorAll('.item-row');
      return Array.from(items).map(item => {
        const nameEl = item.querySelector('.item-title a');
        const addressEl = item.querySelector('.address-text');
        const phoneEl = item.querySelector('.call-now');
        const imgEl = item.querySelector('.item-logo img');
        
        return {
          name: nameEl?.textContent?.trim() || '',
          url: nameEl?.getAttribute('href') || '',
          address: addressEl?.textContent?.trim() || '',
          phone: phoneEl?.getAttribute('data-phone') || '',
          logo: imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '',
        };
      });
    });

    console.log(`Found ${clinics.length} clinics on page 1`);

    for (const c of clinics) {
      if (!c.name) continue;
      
      console.log(`Processing: ${c.name}`);
      
      // Determine City/Gov from address (naive)
      // We should map this properly in a real scenario
      const governorateId = 1; // Cairo default
      const cityId = 1; // Nasr City default (should be dynamic)

      const slug = c.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

      try {
        await prisma.clinic.create({
          data: {
            nameAr: c.name,
            slug: slug,
            addressAr: c.address,
            phone: c.phone,
            logo: c.logo.startsWith('http') ? c.logo : `https://yellowpages.com.eg${c.logo}`,
            governorateId,
            cityId,
            isOpen: true,
            status: 'published',
            descriptionAr: `عيادة ${c.name} في ${c.address}`,
          }
        });
        console.log(`Saved: ${c.name}`);
      } catch (e) {
        console.error(`Failed to save ${c.name}:`, e);
      }
    }

  } catch (e) {
    console.error('Scraping failed:', e);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

scrapeClinics();
