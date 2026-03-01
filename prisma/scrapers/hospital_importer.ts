
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  // Cairo
  { url: 'https://en.infoeg.com/cairo/categories/515', gov: 'القاهرة' },
  { url: 'https://en.infoeg.com/cairo/categories/516', gov: 'القاهرة' },
  // Giza
  { url: 'https://en.infoeg.com/giza/categories/515', gov: 'الجيزة' },
  { url: 'https://en.infoeg.com/giza/categories/516', gov: 'الجيزة' },
  // Alexandria
  { url: 'https://en.infoeg.com/alexandria/categories/515', gov: 'الإسكندرية' },
  { url: 'https://en.infoeg.com/alexandria/categories/516', gov: 'الإسكندرية' },
  // Dakahlia
  { url: 'https://en.infoeg.com/dakahlia/categories/515', gov: 'الدقهلية' },
  { url: 'https://en.infoeg.com/dakahlia/categories/516', gov: 'الدقهلية' },
  // Gharbia
  { url: 'https://en.infoeg.com/gharbia/categories/515', gov: 'الغربية' },
  { url: 'https://en.infoeg.com/gharbia/categories/516', gov: 'الغربية' },
  // Sharqia
  { url: 'https://en.infoeg.com/sharqia/categories/515', gov: 'الشرقية' },
  { url: 'https://en.infoeg.com/sharqia/categories/516', gov: 'الشرقية' },
  // Qalyubia
  { url: 'https://en.infoeg.com/qalyubia/categories/515', gov: 'القليوبية' },
  { url: 'https://en.infoeg.com/qalyubia/categories/516', gov: 'القليوبية' },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeHospitalDetails(url: string, govName: string, retries = 2) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000
    });
    const $ = cheerio.load(data);

    const nameEn = $('h1').text().trim();
    if (!nameEn || nameEn.toLowerCase().includes('add your business') || nameEn.toLowerCase().includes('plus tone')) {
      return;
    }
    const nameAr = $('.breadcrumb li:last-child').text().trim() || nameEn;
    const address = $('.address, .location, .fa-map-marker').parent().text().trim();
    const phone = $('body').text().match(/Phones\s*·\s*([\d*]+)/i)?.[1]?.replace(/\*/g, '') || '';

    // Heuristics for type
    let typeSlug = 'private';
    const lowerName = nameEn.toLowerCase();
    if (lowerName.includes('general')) typeSlug = 'general';
    else if (lowerName.includes('specialized')) typeSlug = 'specialized';
    else if (lowerName.includes('university')) typeSlug = 'university';
    else if (lowerName.includes('military')) typeSlug = 'military';

    // Find Gov and City
    const gov = await prisma.governorate.findFirst({
      where: { OR: [{ nameAr: govName }, { nameEn: govName }] }
    });

    let cityId = null;
    if (gov) {
      const cities = await prisma.city.findMany({ where: { governorateId: gov.id } });
      const city = cities.find(c => 
        (c.nameAr && address.includes(c.nameAr)) || 
        (c.nameEn && address.toLowerCase().includes(c.nameEn.toLowerCase()))
      );
      if (city) cityId = city.id;
    }

    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `hospital-${Date.now()}`;

    await prisma.hospital.upsert({
      where: { slug },
      update: {
        nameAr,
        nameEn,
        address,
        phone,
      },
      create: {
        nameAr,
        nameEn,
        slug,
        address,
        phone,
        ...(gov && { governorate: { connect: { id: gov.id } } }),
        ...(cityId && { city: { connect: { id: cityId } } }),
        type: {
          connectOrCreate: {
            where: { slug: typeSlug },
            create: { slug: typeSlug, nameAr: typeSlug, nameEn: typeSlug }
          }
        }
      }
    });

    console.log(`Successfully scraped: ${nameAr}`);
  } catch (error: any) {
    if (retries > 0 && error.response?.status >= 500) {
      console.log(`Retrying ${url} due to ${error.response.status}... (${retries} left)`);
      await sleep(3000);
      return scrapeHospitalDetails(url, govName, retries - 1);
    }
    console.error(`Error scraping ${url}:`, error.message);
  }
}

async function startScraping() {
  console.log('--- Starting Enhanced Hospital Scraper ---');
  for (const cat of CATEGORIES) {
    try {
      console.log(`Category: ${cat.url}`);
      const { data } = await axios.get(cat.url);
      const $ = cheerio.load(data);
      
      const links: string[] = [];
      $('a[href*="/page/"]').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().toLowerCase();
        // Skip generic links or specific irrelevant ads
        if (href && !title.includes('add your business') && !title.includes('plus tone')) {
          links.push(href.startsWith('http') ? href : `https://en.infoeg.com${href}`);
        }
      });

      for (const link of links) { 
        await scrapeHospitalDetails(link, cat.gov);
        await sleep(1500);
      }
    } catch (error: any) {
      console.error(`Error in category ${cat.url}:`, error.message);
    }
  }
  console.log('--- Scraping Completed ---');
}

startScraping().catch(console.error);
