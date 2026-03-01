import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();
const BASE_URL = 'https://yellowpages.com.eg/en/category/hospitals';

// Configuration
const MAX_PAGES = 3; // Start with 3 pages to prove it works
const HEADLESS = true; 

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrape() {
  console.log('Starting Fast Scraper...');
  
  let executablePath: string | undefined = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(executablePath)) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (!fs.existsSync(executablePath)) {
    console.log('Chrome not found in standard paths. Trying bundled chromium.');
    executablePath = undefined;
  }

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    executablePath: executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  // Optimization: Block images/css/fonts
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Cache types
  const types = await prisma.hospitalType.findMany();
  const getType = (slug: string) => types.find(t => t.slug === slug);

  for (let i = 1; i <= MAX_PAGES; i++) {
    const url = `${BASE_URL}/p${i}`;
    console.log(`Navigating to list page ${i}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      const title = await page.title();
      console.log(`Page Title: ${title}`);

      // Get links to detail pages
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.company-name')).map(el => el.getAttribute('href')).filter(Boolean);
      });

      console.log(`Found ${links.length} hospital links on page ${i}.`);
      
      if (links.length === 0) {
        const content = await page.content();
        fs.writeFileSync(`debug-yp-${i}.html`, content);
        console.log(`Dumped HTML to debug-yp-${i}.html`);
      }

      for (const link of links) {
        const detailUrl = `https://yellowpages.com.eg${link}`;
        // console.log(`Scraping detail: ${detailUrl}`); // Reduce logging noise
        
        try {
          const detailPage = await browser.newPage();
          // Also block resources on detail page
          await detailPage.setRequestInterception(true);
          detailPage.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
              req.abort();
            } else {
              req.continue();
            }
          });

          await detailPage.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

          const data = await detailPage.evaluate(() => {
            const nameEn = document.querySelector('.company-name')?.textContent?.trim() || '';
            const description = document.querySelector('.about-company')?.textContent?.trim() || '';
            const address = document.querySelector('.company-address')?.textContent?.trim() || '';
            const phone = document.querySelector('.company-phone')?.textContent?.trim() || '';
            
            // Images (from src or data-src since blocked)
            // Even if blocked, src attribute might exist in HTML
            const logo = document.querySelector('.company-logo img')?.getAttribute('src') || document.querySelector('.company-logo img')?.getAttribute('data-src');
            const gallery = Array.from(document.querySelectorAll('.gallery-item img, .photos img')).map(img => img.getAttribute('src') || img.getAttribute('data-src')).filter(Boolean);
            
            // Services/Keywords
            const text = document.body.innerText;
            const hasEmergency = /Emergency|24 Hours|Urgent|طوارئ/i.test(text);
            const hasWheelchair = /Wheelchair|Handicap|Accessible/i.test(text);
            const hasAmbulance = /Ambulance|Is3af|إسعاف/i.test(text);
            
            const hours = document.body.innerText.match(/(Working Hours|Hours|Open):?[\s\S]{0,50}(Daily|Sunday|Monday|24 Hours|Open)/i)?.[0] || 'Not specified';

            // Map link for coordinates
            const mapLink = document.querySelector('a[href*="maps.google"]')?.getAttribute('href') || 
                            document.querySelector('a[href*="google.com/maps"]')?.getAttribute('href');
            
            let lat = null, lng = null;
            if (mapLink) {
              const match = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || mapLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
              }
            }

            return { nameEn, description, address, phone, logo, gallery, hasEmergency, hasWheelchair, hasAmbulance, lat, lng, hours };
          });

          await detailPage.close();

          if (!data.nameEn) continue;

          // Filtering
          const lowerName = data.nameEn.toLowerCase();
          if (lowerName.includes('clinic') || lowerName.includes('عيادة')) {
            // console.log(`Skipping clinic: ${data.nameEn}`);
            continue;
          }

          // Type Detection
          let typeSlug = 'private';
          if (lowerName.includes('general hospital') || lowerName.includes('public hospital')) typeSlug = 'general';
          else if (lowerName.includes('teaching') || (lowerName.includes('university') && lowerName.includes('teaching'))) typeSlug = 'teaching';
          else if (lowerName.includes('university')) typeSlug = 'university';
          else if (lowerName.includes('military') || lowerName.includes('armed forces') || lowerName.includes('police')) typeSlug = 'military';
          else if (lowerName.includes('specialized')) typeSlug = 'specialized';
          else if (lowerName.includes('charity') || lowerName.includes('benevolent') || lowerName.includes('57357')) typeSlug = 'charity';
          else if (lowerName.includes('center') || lowerName.includes('centre')) typeSlug = 'center';

          // Slug generation
          let slug = data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          if (!slug) slug = `hospital-${Date.now()}`;
          
          // Ensure uniqueness
          let uniqueSlug = slug;
          let counter = 1;
          while (await prisma.hospital.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }

          // Metadata
          const metadata = {
            gallery: data.gallery,
            hasWheelchair: data.hasWheelchair,
            hasAmbulance: data.hasAmbulance
          };

          const type = getType(typeSlug) || getType('private');

          await prisma.hospital.upsert({
            where: { slug: uniqueSlug },
            update: {},
            create: {
              nameAr: data.nameEn, 
              nameEn: data.nameEn,
              slug: uniqueSlug,
              address: data.address,
              phone: data.phone,
              logo: data.logo && !data.logo.startsWith('http') ? `https://yellowpages.com.eg${data.logo}` : data.logo,
              description: data.description,
              hasEmergency: data.hasEmergency,
              lat: data.lat,
              lng: data.lng,
              workingHours: JSON.stringify({ note: data.hours }),
              metadata: JSON.stringify(metadata),
              typeId: type?.id
            }
          });

          console.log(`Saved: ${data.nameEn} (${type?.nameEn})`);

        } catch (e: any) {
          console.error(`Error scraping detail ${detailUrl}:`, e.message);
        }
        
        await sleep(500); // Reduced delay
      }

    } catch (e: any) {
      console.error(`Error on list page ${i}:`, e.message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('Scraping finished.');
}

scrape().catch(console.error);
