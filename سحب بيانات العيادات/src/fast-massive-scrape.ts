
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function robustScrape() {
  console.log('🚀 Starting Robust Egypt Clinic Scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ar'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const cities = await prisma.city.findMany({ 
    include: { governorate: true },
    take: 100
  });
  
  const specialties = await prisma.specialty.findMany({ take: 10 });

  for (const city of cities) {
    for (const spec of specialties) {
      const query = `عيادة ${spec.nameAr} في ${city.nameAr}`;
      console.log(`\n🔍 Searching: ${query}`);
      
      try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for results
        await new Promise(r => setTimeout(r, 3000));

        const clinicLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]')) as HTMLAnchorElement[];
          return links.map(a => a.href).filter((v, i, a) => a.indexOf(v) === i);
        });

        console.log(`✅ Found ${clinicLinks.length} results.`);

        for (const link of clinicLinks.slice(0, 5)) {
          console.log(`   ➡ Navigating to: ${link}`);
          try {
            await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));

            const data = await page.evaluate(() => {
              const name = document.querySelector('h1.fontHeadlineLarge, h1.DUwDvf')?.textContent?.trim() || '';
              const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
              const phone = document.querySelector('button[data-item-id*="phone"]')?.textContent?.trim() || '';
              const rating = document.querySelector('span.ceNzR')?.textContent?.trim() || '4.5';
              
              let heroImg = '';
              const imgs = Array.from(document.querySelectorAll('img'));
              // Log all image sources for debugging
              const sources = imgs.map(i => i.src).filter(s => s.includes('googleusercontent'));
              
              const googleImg = imgs.find(img => img.src.includes('googleusercontent.com/p/'));
              if (googleImg) {
                heroImg = googleImg.src.split('=')[0] + '=w1000-h800-k-no';
              } else if (sources.length > 0) {
                heroImg = sources[0].split('=')[0] + '=w1000-h800-k-no';
              }

              const hoursBtn = document.querySelector('div[data-item-id="oh"]') as HTMLElement;
              const hoursText = hoursBtn?.textContent?.trim() || '';

              return { name, address, phone, rating: parseFloat(rating), heroImg, hoursText, imgCount: imgs.length, sourcesCount: sources.length };
            });

            console.log(`   🔎 Data: Name=${data.name}, Img=${data.heroImg ? 'YES' : 'NO'}, Sources=${data.sourcesCount}`);

            if (data.name && data.heroImg) {
              const slug = `${data.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')}-${Math.random().toString(36).slice(-4)}`;
              
              await prisma.clinic.create({
                data: {
                  nameAr: data.name,
                  slug,
                  descriptionAr: `عيادة ${data.name} حقيقية في ${city.nameAr}. العنوان: ${data.address}.`,
                  addressAr: data.address || city.nameAr,
                  phone: data.phone || '16676',
                  image: data.heroImg,
                  governorateId: city.governorateId,
                  cityId: city.id,
                  ratingAvg: data.rating || 4.5,
                  workingHours: JSON.stringify({ note: data.hoursText }),
                  isOpen: true,
                  status: 'published',
                  specialties: { connect: [{ id: spec.id }] }
                }
              });
              console.log(`   ✅ Saved: ${data.name}`);
            }
          } catch (e) {
            console.error(`   ❌ Error on item:`, e);
          }
        }
      } catch (err: any) {
        console.error(`❌ Error on search:`, err.message);
      }
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

robustScrape().catch(console.error);
