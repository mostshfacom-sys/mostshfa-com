
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();
const LINKS_FILE = 'vezeeta-links.json';

async function seed() {
    if (!fs.existsSync(LINKS_FILE)) {
        console.error(`File ${LINKS_FILE} not found!`);
        return;
    }

    const links: string[] = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf-8'));
    console.log(`Loaded ${links.length} links from ${LINKS_FILE}`);

    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();
    
    // Filter only Egyptian links
    const egyptianLinks = links.filter(l => l.includes('www.vezeeta.com'));
    console.log(`Filtering for Egyptian hospitals: ${egyptianLinks.length} links found.`);

    for (let i = 0; i < egyptianLinks.length; i++) {
        const link = egyptianLinks[i];
        console.log(`[${i + 1}/${egyptianLinks.length}] Processing: ${link}`);

        try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Wait for dynamic content
            try {
                await page.waitForSelector('div[class*="EntityProfileFiltersstyle__ListMenu"]', { timeout: 5000 });
            } catch (e) {
                // ignore timeout
            }

            const data = await page.evaluate(() => {
                const nameEl = document.querySelector('h1');
                let name = nameEl?.innerText?.trim() || '';
                
                // Cleanup name if it has "احجز مع..."
                name = name.replace('احجز مع أفضل دكاترة ', '').trim();

                // Address extraction from Breadcrumbs or Title
                // Often the title is "Hospital Name - Area"
                let address = null;
                if (name.includes('-')) {
                    const parts = name.split('-');
                    if (parts.length > 1) {
                        address = parts[parts.length - 1].trim();
                        // Keep name clean? maybe
                        // name = parts[0].trim(); // Optional: keep full name in name field for now
                    }
                }

                // Specialties from Side Menu / Filter
                // We look for the container that has "كل التخصصات" (All Specialties)
                const filterMenus = Array.from(document.querySelectorAll('div[class*="EntityProfileFiltersstyle__ListMenu"]'));
                let specialties: string[] = [];
                
                for (const menu of filterMenus) {
                    if (menu.textContent?.includes('كل التخصصات')) {
                        // Extract items. Usually they are in div or span children
                        // The text content is usually concatenated strings. 
                        // We might need to look at child nodes or split by newline if applicable.
                        // Based on inspection, it seemed to be a list.
                        // Let's try to get child elements text
                        const items = Array.from(menu.querySelectorAll('div, span, label, a'));
                        specialties = items
                            .map(el => el.textContent?.trim())
                            .filter(t => t && t !== 'كل التخصصات' && t.length > 2 && !t.includes('English'));
                        
                        // Deduplicate
                        specialties = Array.from(new Set(specialties));
                        break;
                    }
                }

                // If no specialties found in filter, try general list search
                if (specialties.length === 0) {
                     const allText = document.body.innerText;
                     // Simple keyword matching for common specialties
                     const commonSpecs = ['جلدية', 'اسنان', 'نفسي', 'اطفال', 'مخ واعصاب', 'عظام', 'نساء وتوليد', 'انف واذن', 'قلب', 'باطنة', 'جراحة'];
                     specialties = commonSpecs.filter(s => allText.includes(s));
                }

                // Image
                // Try to find an image that is NOT an icon/specialty image
                const images = Array.from(document.querySelectorAll('img'));
                let logo = null;
                for (const img of images) {
                    const src = img.src;
                    if (src && !src.includes('Specialties') && !src.includes('Assets/Images/SelfServiceDoctors') && !src.includes('logo') && !src.includes('whitelogowithdotcom')) {
                        // Potential hospital image
                        // Check size if possible?
                        logo = src;
                        break;
                    }
                }
                
                // Fallback logo: try to find one with 'logo' in alt or src if previous failed
                if (!logo) {
                    const logoImg = images.find(img => img.alt.toLowerCase().includes('logo') || img.src.includes('logo'));
                    if (logoImg) logo = logoImg.src;
                }

                return {
                    name,
                    address,
                    logo,
                    specialties
                };
            });

            if (!data.name) {
                console.log('Skipping: Could not extract name.');
                continue;
            }

            console.log(`Extracted: ${data.name} | Addr: ${data.address} | Specs: ${data.specialties.length}`);

            // Save to DB
            const slug = link.split('/').pop() || `hospital-${Date.now()}`;
            
            // Generate slugs for specialties
            const specialtyConnects = data.specialties.map((specName: string) => {
                const specSlug = specName.replace(/\s+/g, '-').toLowerCase();
                return {
                    where: { slug: specSlug },
                    create: { nameAr: specName, slug: specSlug }
                };
            });

            await prisma.hospital.upsert({
                where: { slug: decodeURIComponent(slug) },
                update: {
                    nameAr: data.name,
                    address: data.address,
                    logo: data.logo,
                    specialties: {
                        connectOrCreate: specialtyConnects
                    }
                },
                create: {
                    nameAr: data.name,
                    slug: decodeURIComponent(slug),
                    address: data.address,
                    logo: data.logo,
                    specialties: {
                        connectOrCreate: specialtyConnects
                    }
                }
            });

            console.log('Updated DB.');

        } catch (e) {
            console.error(`Error processing ${link}:`, e);
        }
    }

    await browser.close();
    await prisma.$disconnect();
}

seed();
