
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

const OUTPUT_FILE = 'vezeeta-links.json';

async function harvest() {
    console.log('Launching browser...');
    
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome', 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
    
    const page = await browser.newPage();

    // Load existing links if any
    let existingLinks: string[] = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            existingLinks = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch (e) {
            console.error('Error reading existing file, starting fresh.');
        }
    }
    const allLinks = new Set<string>(existingLinks);

    // Expanded queries for Egypt
    const queries = [
        'site:vezeeta.com/ar/hospital "مستشفى" القاهرة',
        'site:vezeeta.com/ar/hospital "مستشفى" الجيزة',
        'site:vezeeta.com/ar/hospital "مستشفى" الاسكندرية',
        'site:vezeeta.com/ar/hospital "مركز" القاهرة',
        'site:vezeeta.com/ar/hospital "عيادات" القاهرة',
        'site:vezeeta.com/ar/hospital "مستشفى" المعادي',
        'site:vezeeta.com/ar/hospital "مستشفى" مدينة نصر',
        'site:vezeeta.com/ar/hospital "مستشفى" المهندسين',
        'site:vezeeta.com/ar/hospital "مستشفى" الدقي',
        'site:vezeeta.com/ar/hospital "مستشفى" التجمع',
        'site:vezeeta.com/ar/hospital "مستشفى" اكتوبر',
        'site:vezeeta.com/ar/hospital "مستشفى" الشيخ زايد'
    ];

    console.log(`Starting harvest. Current count: ${allLinks.size}`);

    for (const query of queries) {
        console.log(`Searching for: ${query}`);
        try {
            // Page 1
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=100`, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for results container
            try {
                // Try waiting for standard google result container or search box
                await page.waitForSelector('#search', { timeout: 10000 });
            } catch (e) {
                console.log('Timeout waiting for #search, checking page content...');
                const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
                console.log('Page content preview:', bodyText);
            }

            await extractLinks(page, allLinks);

            // Random pause
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

        } catch (e) {
            console.error(`Error searching for ${query}:`, e);
        }
    }

    console.log(`Harvest complete. Total unique links: ${allLinks.size}`);
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(Array.from(allLinks), null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
    
    await browser.close();
}

async function extractLinks(page: any, allLinks: Set<string>) {
    const newLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
            .map(a => a.href)
            .filter(href => href.includes('vezeeta.com/ar/hospital/') && !href.includes('google') && !href.includes('/login'));
    });

    let added = 0;
    newLinks.forEach((link: string) => {
        // Clean the URL
        const cleanLink = link.split('?')[0];
        if (!allLinks.has(cleanLink)) {
            allLinks.add(cleanLink);
            added++;
        }
    });
    console.log(`Found ${newLinks.length} links, added ${added} new ones.`);
}

harvest();
