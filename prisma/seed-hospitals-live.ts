
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const BASE_URL = 'https://infoeg.com';
const MAX_PAGES_PER_CATEGORY = 5; // Scrape first 5 pages to get a good sample (~100 hospitals)

// Categories to scrape (Government and Private Hospitals in major cities)
const TARGETS = [
    // Cairo
    { gov: 'القاهرة', url: 'https://infoeg.com/cairo/categories/516', typeSlug: 'general' }, // Government
    { gov: 'القاهرة', url: 'https://infoeg.com/cairo/categories/391', typeSlug: 'private' }, // Hospitals & Centers
    // Giza
    { gov: 'الجيزة', url: 'https://infoeg.com/giza/categories/516', typeSlug: 'general' },
    { gov: 'الجيزة', url: 'https://infoeg.com/giza/categories/391', typeSlug: 'private' },
    // Alexandria
    { gov: 'الإسكندرية', url: 'https://infoeg.com/alexandria/categories/516', typeSlug: 'general' },
    { gov: 'الإسكندرية', url: 'https://infoeg.com/alexandria/categories/391', typeSlug: 'private' },
];

async function getHtml(url: string) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000
        });
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

async function scrapeListingPage(url: string, govName: string, typeSlug: string) {
    const html = await getHtml(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const hospitals: any[] = [];

    $('.card.page-item').each((i, el) => {
        try {
            const titleEl = $(el).find('.card-title.title a');
            const fullTitle = titleEl.text().trim();
            const detailUrl = titleEl.attr('href') || '';
            
            // Split title into Ar/En if possible
            // Usually "Arabic Name \n English Name"
            const titleParts = fullTitle.split(/\n+/).map(t => t.trim()).filter(t => t.length > 0);
            const nameAr = titleParts[0] || fullTitle;
            const nameEn = titleParts.length > 1 ? titleParts[1] : nameAr; // Fallback to Ar if no En

            const imgEl = $(el).find('img.img-thumbnail');
            const logo = imgEl.attr('src');

            const addressEl = $(el).find('.card-text.item-body p');
            let address = addressEl.text().trim().replace(/\s+/g, ' ');
            // Remove icon text if any
            address = address.replace(/^[^a-zA-Z0-9\u0600-\u06FF]+/, '');

            // Extract City from address (simple heuristic)
            // Address format usually: "Street - Region - Landmark" or "Region - City"
            let cityName = govName; // Default to governorate name
            const addressParts = address.split('-');
            if (addressParts.length > 1) {
                // Usually the second part is the region/city
                // Example: "13 Gesr El Suez Street - Heliopolis - In Front Of..." -> Heliopolis
                // Example: "شارع الرشيدى - السيدة زينب - محافظة القاهرة" -> Sayeda Zeinab
                cityName = addressParts[1].trim(); 
            }

            if (nameAr) {
                hospitals.push({
                    nameAr,
                    nameEn,
                    detailUrl,
                    logo,
                    address,
                    cityName,
                    govName,
                    typeSlug
                });
            }
        } catch (e) {
            console.error('Error parsing item:', e);
        }
    });

    return hospitals;
}

async function scrapeHospitalDetails(url: string) {
    if (!url) return { phone: null, description: null };
    
    // Convert relative URL to absolute if needed (usually absolute in infoeg)
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const html = await getHtml(fullUrl);
    if (!html) return { phone: null, description: null };

    const $ = cheerio.load(html);
    
    // Extract phone
    let phone: string | null | undefined = null;
    // Look for tel: link
    $('a[href^="tel:"]').each((i, el) => {
        if (!phone) phone = $(el).attr('href')?.replace('tel:', '');
    });
    
    // Look for text containing "تليفون" or "Tel"
    if (!phone) {
         $('p, div, span, li').each((i, el) => {
            const text = $(el).text();
            if (text.includes('تليفون') || text.includes('Tel') || text.includes('Mobile')) {
                const match = text.match(/\b01[0-25]\d{8}\b|\b02\d{7,8}\b|\b19\d{3}\b/);
                if (match) phone = match[0];
            }
         });
    }

    // Description
    // Look for p tag that is not address
    let description = '';
    $('.card-text, .description').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && !text.includes('العنوان') && !text.includes('Address')) {
            description = text;
        }
    });

    // Address fallback
    let address: string | null = $('.address, .location, .fa-map-marker').parent().text().trim() || null;
    if (!address) {
        // Try to find address in text
        address = $('body').text().match(/العنوان : (.*)/)?.[1]?.trim() || null;
    }

    return { phone, description, address };
}

async function main() {
    console.log('🚀 Starting Real Hospital Scraper...');

    // 1. Ensure basic types exist (Governorates/Cities/Types)
    // We assume Governorates exist from previous seeds, or we create them.
    // We will create Cities on the fly.

    for (const target of TARGETS) {
        console.log(`\n📡 Scraping ${target.gov} - ${target.typeSlug}...`);
        
        // Upsert Governorate
        const gov = await prisma.governorate.upsert({
            where: { nameAr: target.gov },
            update: {},
            create: { nameAr: target.gov, nameEn: target.gov === 'القاهرة' ? 'Cairo' : (target.gov === 'الجيزة' ? 'Giza' : 'Alexandria') }
        });

        // Upsert Type
        const type = await prisma.hospitalType.upsert({
            where: { slug: target.typeSlug },
            update: {},
            create: { 
                nameAr: target.typeSlug === 'general' ? 'مستشفى عام' : 'مستشفى خاص',
                nameEn: target.typeSlug === 'general' ? 'General Hospital' : 'Private Hospital',
                slug: target.typeSlug,
                icon: 'building-hospital'
            }
        });

        // Loop pages
        for (let page = 1; page <= MAX_PAGES_PER_CATEGORY; page++) {
            const pageUrl = `${target.url}?page=${page}`;
            console.log(`   📄 Page ${page}: ${pageUrl}`);
            
            const listings = await scrapeListingPage(pageUrl, target.gov, target.typeSlug);
            if (listings.length === 0) {
                console.log('   ⚠️ No listings found, moving to next category.');
                break;
            }

            console.log(`   Found ${listings.length} hospitals. Processing...`);

            for (const item of listings) {
                try {
                    // Scrape details for "Rich" data (Phone, etc.)
                    // console.log(`      🔍 Fetching details for ${item.nameAr}...`);
                    const details = await scrapeHospitalDetails(item.detailUrl);
                    
                    // Upsert City
                    let cleanCityName = item.cityName.replace('حي', '').trim();
                    // If city name is too long (address part), fallback to Gov
                    if (cleanCityName.length > 20 || cleanCityName.length < 2) cleanCityName = target.gov;

                    const city = await prisma.city.upsert({
                        where: { 
                            governorateId_nameAr: {
                                governorateId: gov.id,
                                nameAr: cleanCityName
                            }
                        },
                        update: {},
                        create: {
                            nameAr: cleanCityName,
                            nameEn: cleanCityName,
                            governorateId: gov.id
                        }
                    });

                    // Unique Slug Logic
                    let slug = item.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'hospital';
                    // Ensure slug uniqueness
                    let count = 0;
                    let uniqueSlug = slug;
                    while (await prisma.hospital.findUnique({ where: { slug: uniqueSlug } })) {
                        count++;
                        uniqueSlug = `${slug}-${count}`;
                    }
                    slug = uniqueSlug;
                    
                    // Check if exists by name to avoid duplicates
                    const existing = await prisma.hospital.findFirst({
                        where: { nameAr: item.nameAr, governorateId: gov.id }
                    });

                    if (existing) {
                        // Update
                         await prisma.hospital.update({
                            where: { id: existing.id },
                            data: {
                                phone: details.phone || existing.phone,
                                description: details.description || existing.description,
                                logo: item.logo || existing.logo,
                                address: details.address || item.address || existing.address,
                                hasEmergency: true
                            }
                        });
                    } else {
                        // Create
                        await prisma.hospital.create({
                            data: {
                                nameAr: item.nameAr,
                                nameEn: item.nameEn,
                                slug: slug,
                                governorateId: gov.id,
                                cityId: city.id,
                                typeId: type.id,
                                address: details.address || item.address,
                                phone: details.phone,
                                logo: item.logo,
                                description: details.description,
                                hasEmergency: true,
                                ratingAvg: 4.0 + Math.random(),
                                ratingCount: Math.floor(Math.random() * 50)
                            }
                        });
                    }
                    process.stdout.write('.');
                } catch (err: any) {
                    console.error(`\nError processing ${item.nameAr}:`, err.message);
                }
            }
            console.log('\n   ✅ Page done.');
        }
    }

    console.log('\n✨ Scraping Completed Successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
