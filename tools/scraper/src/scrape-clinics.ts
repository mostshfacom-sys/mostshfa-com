
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

async function scrapeRealClinics() {
  console.log('🚀 Starting real clinic scraping from YallaMedical...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const clinics: any[] = [];
  const MAX_PAGES = 10; // Let's try 10 pages first
  
  for (let i = 1; i <= MAX_PAGES; i++) {
    const url = `https://yallamedical.com/clinics?page=${i}`;
    console.log(`🔍 Scraping page ${i}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      const pageClinics = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.clinic-card, .medical-item, .card'));
        return cards.map(el => {
          const name = el.querySelector('h2, .title, .name')?.textContent?.trim();
          const address = el.querySelector('.address, .location, .addr')?.textContent?.trim();
          const image = el.querySelector('img')?.getAttribute('src');
          const link = el.querySelector('a')?.getAttribute('href');
          const specialty = el.querySelector('.specialty, .dept')?.textContent?.trim();
          
          return { name, address, image, link, specialty };
        }).filter(c => c.name);
      });
      
      clinics.push(...pageClinics);
      console.log(`✅ Found ${pageClinics.length} clinics on page ${i}`);
      
      // Delay to avoid ban
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`❌ Failed on page ${i}:`, err);
    }
  }

  console.log(`✨ Total clinics found: ${clinics.length}. Fetching details...`);

  const detailedClinics = [];
  // Limit for safety, but try to get as many as possible
  for (const clinic of clinics.slice(0, 100)) { 
    try {
      console.log(`🔍 Fetching details for: ${clinic.name}`);
      const detailUrl = clinic.link?.startsWith('http') ? clinic.link : `https://yallamedical.com${clinic.link}`;
      await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      
      const details = await page.evaluate(() => {
        const phone = document.querySelector('.phone, .tel, [href^="tel:"]')?.textContent?.replace(/\s+/g, '').trim();
        const description = document.querySelector('.description, .about, .content')?.textContent?.trim();
        const hours = Array.from(document.querySelectorAll('.working-hours li, .hours-row')).map(li => li.textContent?.trim()).join(' | ');
        const lat = document.querySelector('[data-lat]')?.getAttribute('data-lat');
        const lng = document.querySelector('[data-lng]')?.getAttribute('data-lng');
        const gallery = Array.from(document.querySelectorAll('.gallery img, .slider img')).map(img => img.getAttribute('src')).filter(src => src && !src.includes('placeholder'));
        
        return { phone, description, hours, lat, lng, gallery };
      });
      
      detailedClinics.push({ ...clinic, ...details });
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ Failed on ${clinic.name}:`, err);
    }
  }

  const outputPath = path.join(process.cwd(), 'scraped-clinics-real.json');
  fs.writeFileSync(outputPath, JSON.stringify(detailedClinics, null, 2));
  console.log(`✨ Saved ${detailedClinics.length} real clinics to scraped-clinics-real.json`);

  await browser.close();
}

scrapeRealClinics();
