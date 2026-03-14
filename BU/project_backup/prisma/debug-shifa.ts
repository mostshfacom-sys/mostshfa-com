
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function debugShifa() {
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--lang=ar']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

    const query = 'مجموعة مستشفيات شفا التجمع الخامس';
    console.log(`Searching for: ${query}`);
    
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, { waitUntil: 'networkidle2' });
    
    // Wait for results or direct place load
    try {
        await page.waitForSelector('div[role="article"]', { timeout: 5000 });
        
        // Click the first result
        const places = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div[role="article"]'));
            return items.map(item => {
                const linkEl = item.querySelector('a');
                return linkEl ? linkEl.href : '';
            });
        });

        if (places.length > 0) {
            console.log(`Navigating to: ${places[0]}`);
            await page.goto(places[0], { waitUntil: 'networkidle2' });
        }
    } catch (e) {
        console.log('List view not found, checking if direct place loaded...');
    }

    await new Promise(r => setTimeout(r, 5000));

    // Dump HTML
    const content = await page.content();
        fs.writeFileSync('shifa-debug.html', content);
        console.log('Saved shifa-debug.html');

        // Check for Hours buttons
        const hoursButtons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, div[role="button"], div[aria-expanded]'));
            return btns.map(b => ({
                text: b.textContent,
                ariaLabel: b.getAttribute('aria-label'),
                ariaExpanded: b.getAttribute('aria-expanded'),
                class: b.className
            })).filter(b => 
                (b.text && (b.text.includes('مفتوح') || b.text.includes('ساعات'))) ||
                (b.ariaLabel && (b.ariaLabel.includes('مفتوح') || b.ariaLabel.includes('ساعات'))) ||
                b.ariaExpanded !== null
            );
        });
        console.log('Potential Hours Buttons:', JSON.stringify(hoursButtons, null, 2));

        // Check for Reviews buttons
        const reviewsButtons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
            return btns.map(b => ({
                text: b.textContent,
                ariaLabel: b.getAttribute('aria-label'),
                role: b.getAttribute('role')
            })).filter(b => 
                (b.text && (b.text.includes('مراجعة') || b.text.includes('Reviews'))) ||
                (b.ariaLabel && (b.ariaLabel.includes('مراجعة') || b.ariaLabel.includes('Reviews')))
            );
        });
        console.log('Potential Reviews Buttons:', JSON.stringify(reviewsButtons, null, 2));

        // Take screenshot
        await page.screenshot({ path: 'shifa-debug.png' });
    
    await browser.close();
}

debugShifa();
