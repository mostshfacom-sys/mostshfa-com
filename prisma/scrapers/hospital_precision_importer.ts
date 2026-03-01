
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration for high-precision scraping
const CONFIG = {
  BATCH_SIZE: 5,
  SLEEP_MS: 1500,
  RETRY_LIMIT: 3,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  BASE_URL: 'https://en.infoeg.com'
};

// Target categories for comprehensive coverage
const CATEGORIES = [
  { url: '/cairo/categories/515', gov: 'القاهرة' },
  { url: '/cairo/categories/516', gov: 'القاهرة' },
  { url: '/giza/categories/515', gov: 'الجيزة' },
  { url: '/giza/categories/516', gov: 'الجيزة' },
  { url: '/alexandria/categories/515', gov: 'الإسكندرية' },
  { url: '/alexandria/categories/516', gov: 'الإسكندرية' },
  { url: '/dakahlia/categories/515', gov: 'الدقهلية' },
  { url: '/dakahlia/categories/516', gov: 'الدقهلية' },
  { url: '/gharbia/categories/515', gov: 'الغربية' },
  { url: '/gharbia/categories/516', gov: 'الغربية' },
  { url: '/sharqia/categories/515', gov: 'الشرقية' },
  { url: '/sharqia/categories/516', gov: 'الشرقية' },
  { url: '/qalyubia/categories/515', gov: 'القليوبية' },
  { url: '/qalyubia/categories/516', gov: 'القليوبية' },
  { url: '/monufia/categories/515', gov: 'المنوفية' },
  { url: '/beheira/categories/515', gov: 'البحيرة' },
  { url: '/kafr-el-sheikh/categories/515', gov: 'كفر الشيخ' },
  { url: '/damietta/categories/515', gov: 'دمياط' },
  { url: '/ismailia/categories/515', gov: 'الإسماعيلية' },
  { url: '/port-said/categories/515', gov: 'بورسعيد' },
  { url: '/suez/categories/515', gov: 'السويس' },
  { url: '/luxor/categories/515', gov: 'الأقصر' },
  { url: '/aswan/categories/515', gov: 'أسوان' },
  { url: '/sohag/categories/515', gov: 'سوهاج' },
  { url: '/qena/categories/515', gov: 'قنا' },
  { url: '/asyut/categories/515', gov: 'أسيوط' },
  { url: '/beni-suef/categories/515', gov: 'بني سويف' },
  { url: '/minya/categories/515', gov: 'المنيا' },
  { url: '/fayoum/categories/515', gov: 'الفيوم' }
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWithRetry(url: string, retries = CONFIG.RETRY_LIMIT): Promise<any> {
  try {
    return await axios.get(url, {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 20000
    });
  } catch (error: any) {
    if (retries > 0 && (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
      console.log(`Retry ${CONFIG.RETRY_LIMIT - retries + 1} for ${url}...`);
      await sleep(2000);
      return getWithRetry(url, retries - 1);
    }
    throw error;
  }
}

function determineType(nameEn: string, nameAr: string): string {
  const fullText = (nameEn + ' ' + nameAr).toLowerCase();
  if (fullText.includes('university') || fullText.includes('جامع')) return 'university';
  if (fullText.includes('military') || fullText.includes('عسكر') || fullText.includes('قوات مسلح')) return 'military';
  if (fullText.includes('specialized') || fullText.includes('تخصص')) return 'specialized';
  if (fullText.includes('general') || fullText.includes('عام')) return 'general';
  if (fullText.includes('center') || fullText.includes('مركز')) return 'medical-center';
  if (fullText.includes('clinic') || fullText.includes('عيادة')) return 'clinic';
  return 'private';
}

async function scrapeHospitalDetails(url: string, govName: string) {
  try {
    const { data } = await getWithRetry(url);
    const $ = cheerio.load(data);

    const nameEn = $('h1').first().text().trim();
    if (!nameEn || nameEn.toLowerCase().includes('add your business')) return;

    const nameAr = $('.breadcrumb li:last-child').text().trim() || nameEn;
    const address = $('.address, .location, .fa-map-marker').parent().text().trim();
    const phoneMatch = $('body').text().match(/Phones\s*·\s*([\d\s*\/,-]+)/i);
    const phone = phoneMatch ? phoneMatch[1].replace(/\*/g, '').trim() : '';
    
    // Improved Image Scraping
    let logo = '';
    const imgElement = $('.profile-logo img, .company-logo img, .entry-content img').first();
    if (imgElement.length) {
      logo = imgElement.attr('src') || imgElement.attr('data-src') || '';
      if (logo && !logo.startsWith('http')) {
        logo = CONFIG.BASE_URL + (logo.startsWith('/') ? '' : '/') + logo;
      }
    }

    const typeSlug = determineType(nameEn, nameAr);

    // Get DB objects
    const gov = await prisma.governorate.findFirst({
      where: { OR: [{ nameAr: govName }, { nameEn: govName }] },
      include: { cities: true }
    });

    let cityId = null;
    if (gov) {
      const city = gov.cities.find(c => 
        (c.nameAr && address.includes(c.nameAr)) || 
        (c.nameEn && address.toLowerCase().includes(c.nameEn.toLowerCase()))
      );
      if (city) cityId = city.id;
    }

    const slug = (nameEn.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')) || `hosp-${Date.now()}`;

    await prisma.hospital.upsert({
      where: { slug },
      update: {
        nameAr,
        nameEn,
        address,
        phone,
        logo: logo || undefined,
      },
      create: {
        nameAr,
        nameEn,
        slug,
        address,
        phone,
        logo,
        governorateId: gov?.id,
        cityId: cityId,
        // type: typeSlug ? { connect: { slug: typeSlug } } : undefined
      }
    });

    console.log(`[OK] ${nameAr} (${govName})`);
  } catch (error: any) {
    console.error(`[ERR] ${url}: ${error.message}`);
  }
}

async function startScraping() {
  console.log('--- Starting Precision Hospital Importer (Target: 5000+) ---');
  
  for (const cat of CATEGORIES) {
    console.log(`\nProcessing Category: ${cat.url} (${cat.gov})`);
    try {
      const { data } = await getWithRetry(CONFIG.BASE_URL + cat.url);
      const $ = cheerio.load(data);
      
      const links: string[] = [];
      $('.category-listing a, .company-name a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/page/')) {
          links.push(CONFIG.BASE_URL + href);
        }
      });

      console.log(`Found ${links.length} potential hospitals.`);

      for (let i = 0; i < links.length; i += CONFIG.BATCH_SIZE) {
        const batch = links.slice(i, i + CONFIG.BATCH_SIZE);
        await Promise.all(batch.map(link => scrapeHospitalDetails(link, cat.gov)));
        await sleep(CONFIG.SLEEP_MS);
      }
    } catch (error: any) {
      console.error(`Error in category ${cat.url}: ${error.message}`);
    }
  }

  const finalCount = await prisma.hospital.count();
  console.log(`\n--- Import Finished. Total Hospitals: ${finalCount} ---`);
  await prisma.$disconnect();
}

startScraping();
