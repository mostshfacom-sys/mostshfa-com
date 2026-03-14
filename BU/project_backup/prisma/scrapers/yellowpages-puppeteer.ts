import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();
const BASE_URL = 'https://yellowpages.com.eg/en/category/hospitals';

// Configuration
const MAX_PAGES = 5; // Scrape 5 pages for now (~100 items) to ensure quality and speed
const HEADLESS = true; // Try headless first

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrape() {
  console.log('Starting Yellow Pages Deep Scraper...');
  
  let executablePath: string | undefined = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(executablePath)) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (!fs.existsSync(executablePath)) {
    console.log('Chrome not found, using bundled chromium if available.');
    executablePath = undefined;
  }

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    executablePath: executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  // Cache types
  const types = await prisma.hospitalType.findMany();
  const getType = (slug: string) => types.find(t => t.slug === slug);

  for (let i = 1; i <= MAX_PAGES; i++) {
    const url = `${BASE_URL}/p${i}`;
    console.log(`Navigating to list page ${i}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Get links to detail pages
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.company-name')).map(el => el.getAttribute('href')).filter(Boolean);
      });

      console.log(`Found ${links.length} hospital links on page ${i}.`);

      for (const link of links) {
        const detailUrl = `https://yellowpages.com.eg${link}`;
        console.log(`Scraping detail: ${detailUrl}`);
        
        try {
          const detailPage = await browser.newPage();
          await detailPage.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

          const data = await detailPage.evaluate(() => {
            const nameEn = document.querySelector('.company-name')?.textContent?.trim() || '';
            const description = document.querySelector('.about-company')?.textContent?.trim() || '';
            const address = document.querySelector('.company-address')?.textContent?.trim() || '';
            const phone = document.querySelector('.company-phone')?.textContent?.trim() || '';
            
            // Images
            const logo = document.querySelector('.company-logo img')?.getAttribute('src') || document.querySelector('.company-logo img')?.getAttribute('data-src');
            const gallery = Array.from(document.querySelectorAll('.gallery-item img, .photos img, .company-cover img')).map(img => img.getAttribute('src') || img.getAttribute('data-src')).filter(Boolean);
            
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
            console.log(`Skipping clinic: ${data.nameEn}`);
            continue;
          }

          // Type Detection
          let typeSlug = 'private';
          if (lowerName.includes('general hospital') || lowerName.includes('public hospital')) typeSlug = 'general';
          else if (lowerName.includes('teaching') || lowerName.includes('university') && lowerName.includes('teaching')) typeSlug = 'teaching';
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

          // Metadata for extra images and features
          const metadata = {
            gallery: data.gallery,
            hasWheelchair: data.hasWheelchair,
            hasAmbulance: data.hasAmbulance,
            workingHours: data.hours
          };

          // Find Type
          const type = types.find(t => t.slug === typeSlug) || types.find(t => t.slug === 'private');

          // Upsert to avoid duplicates
          await prisma.hospital.upsert({
            where: { slug: uniqueSlug },
            update: {},
            create: {
              nameAr: data.nameEn, // Placeholder
              nameEn: data.nameEn,
              slug: uniqueSlug,
              address: data.address,
              phone: data.phone,
              logo: data.logo && !data.logo.startsWith('http') ? `https://yellowpages.com.eg${data.logo}` : data.logo,
              description: data.description,
              hasEmergency: data.hasEmergency,
              lat: data.lat,
              lng: data.lng,
              workingHours: JSON.stringify({ note: data.hours }), // Simple string for now
              metadata: JSON.stringify(metadata),
              typeId: type?.id
            }
          });

          console.log(`Saved: ${data.nameEn} (${type?.nameEn})`);

        } catch (e: any) {
          console.error(`Error scraping detail ${detailUrl}:`, e.message);
        }
        
        await sleep(2000); // Gentle delay
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
