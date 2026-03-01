const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CONFIG = {
  BATCH_SIZE: 15,
  SLEEP_MS: 1000,
  RETRY_LIMIT: 3,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  BASE_URL: 'https://en.infoeg.com'
};

// Target categories for comprehensive coverage based on InfoEG structure
const SECTIONS = [
  { path: '/cairo/categories/391', gov: 'القاهرة' },
  { path: '/cairo/categories/516', gov: 'القاهرة' },
  { path: '/cairo/categories/515', gov: 'القاهرة' },
  { path: '/giza/categories/391', gov: 'الجيزة' },
  { path: '/giza/categories/516', gov: 'الجيزة' },
  { path: '/alexandria/categories/391', gov: 'الإسكندرية' },
  { path: '/alexandria/categories/516', gov: 'الإسكندرية' },
  { path: '/dakahlia/categories/391', gov: 'الدقهلية' },
  { path: '/gharbia/categories/391', gov: 'الغربية' },
  { path: '/sharqia/categories/391', gov: 'الشرقية' },
  { path: '/qalyubia/categories/391', gov: 'القليوبية' },
  { path: '/monufia/categories/391', gov: 'المنوفية' },
  { path: '/beheira/categories/391', gov: 'البحيرة' },
  { path: '/kafr-el-sheikh/categories/391', gov: 'كفر الشيخ' },
  { path: '/damietta/categories/391', gov: 'دمياط' },
  { path: '/ismailia/categories/391', gov: 'الإسماعيلية' },
  { path: '/port-said/categories/391', gov: 'بورسعيد' },
  { path: '/suez/categories/391', gov: 'السويس' },
  { path: '/luxor/categories/391', gov: 'الأقصر' },
  { path: '/aswan/categories/391', gov: 'أسوان' },
  { path: '/sohag/categories/391', gov: 'سوهاج' },
  { path: '/qena/categories/391', gov: 'قنا' },
  { path: '/asyut/categories/391', gov: 'أسيوط' },
  { path: '/beni-suef/categories/391', gov: 'بني سويف' },
  { path: '/minya/categories/391', gov: 'المنيا' },
  { path: '/fayoum/categories/391', gov: 'الفيوم' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWithRetry(url, retries = CONFIG.RETRY_LIMIT) {
  try {
    return await axios.get(url, {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 30000
    });
  } catch (error) {
    if (retries > 0 && (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
      console.log(`[RETRY] ${CONFIG.RETRY_LIMIT - retries + 1} for ${url}...`);
      await sleep(2000);
      return getWithRetry(url, retries - 1);
    }
    throw error;
  }
}

function determineType(nameEn, nameAr) {
  const fullText = (nameEn + ' ' + nameAr).toLowerCase();
  if (fullText.includes('university') || fullText.includes('جامع')) return 'university';
  if (fullText.includes('military') || fullText.includes('عسكر') || fullText.includes('قوات مسلح')) return 'military';
  if (fullText.includes('specialized') || fullText.includes('تخصص')) return 'specialized';
  if (fullText.includes('general') || fullText.includes('عام')) return 'general';
  if (fullText.includes('center') || fullText.includes('مركز')) return 'medical-center';
  if (fullText.includes('clinic') || fullText.includes('عيادة')) return 'clinic';
  return 'private';
}

async function scrapeHospitalDetails(url, govName) {
  try {
    const { data } = await getWithRetry(url);
    const $ = cheerio.load(data);

    const nameEn = $('h1').first().text().trim();
    if (!nameEn || nameEn.toLowerCase().includes('add your business')) return;

    const nameAr = $('.breadcrumb li:last-child').text().trim() || nameEn;
    const address = $('.address, .location, .fa-map-marker').parent().text().trim();
    
    let phone = '';
    const phoneEl = $('.phone-number, .fa-phone').parent();
    if (phoneEl.length) {
      phone = phoneEl.text().trim().replace(/Phones\s*·\s*/i, '').replace(/\*/g, '');
    } else {
      const bodyText = $('body').text();
      const phoneMatch = bodyText.match(/Phones\s*·\s*([\d\s*\/,-]+)/i);
      phone = phoneMatch ? phoneMatch[1].replace(/\*/g, '').trim() : '';
    }
    
    let logo = '';
    const logoEl = $('.profile-logo img, .company-logo img').first();
    if (logoEl.length) {
      logo = logoEl.attr('src') || logoEl.attr('data-src') || '';
      if (logo && !logo.startsWith('http')) {
        logo = CONFIG.BASE_URL + (logo.startsWith('/') ? '' : '/') + logo;
      }
    }

    const typeSlug = determineType(nameEn, nameAr);
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

    const slug = nameEn.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `hosp-${Date.now()}`;

    await prisma.hospital.upsert({
      where: { slug },
      update: { nameAr, nameEn, address, phone, logo: logo || undefined },
      create: {
        nameAr, nameEn, slug, address, phone, logo,
        governorateId: gov?.id,
        cityId: cityId,
        type: { connect: { slug: typeSlug } }
      }
    });
    process.stdout.write('.');
  } catch (error) {}
}

async function processCategory(cat) {
  let page = 1;
  while (true) {
    const url = `${CONFIG.BASE_URL}${cat.path}${page > 1 ? `?page=${page}` : ''}`;
    try {
      const { data } = await getWithRetry(url);
      const $ = cheerio.load(data);
      const links = [];
      $('.category-listing a, .company-name a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/page/')) {
          const fullLink = href.startsWith('http') ? href : CONFIG.BASE_URL + href;
          if (!links.includes(fullLink)) links.push(fullLink);
        }
      });

      if (links.length === 0) break;

      console.log(`\n[${cat.gov}] Page ${page}: Found ${links.length} hospitals.`);
      for (let i = 0; i < links.length; i += CONFIG.BATCH_SIZE) {
        const batch = links.slice(i, i + CONFIG.BATCH_SIZE);
        await Promise.all(batch.map(link => scrapeHospitalDetails(link, cat.gov)));
        await sleep(CONFIG.SLEEP_MS);
      }

      if (!$('.pagination .next, a[rel="next"]').length || page >= 30) break;
      page++;
    } catch (error) {
      console.error(`\n[ERR] ${cat.gov} Page ${page}: ${error.message}`);
      break;
    }
  }
}

async function start() {
  console.log('--- Starting Precision Hospital Deep Scraper (Target: 5000+) ---');
  for (const cat of SECTIONS) {
    await processCategory(cat);
  }
  const finalCount = await prisma.hospital.count();
  console.log(`\n--- Import Finished. Total Hospitals in DB: ${finalCount} ---`);
  await prisma.$disconnect();
}

start();
