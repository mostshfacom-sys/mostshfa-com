import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugScraper() {
    console.log('Starting debug scraper...');
    
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--lang=ar']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar' });

    // Test with a specific hospital known to have these issues
    const query = 'مستشفى الجيزة التخصصي'; 
    console.log(`Searching for: ${query}`);
    
    try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, { waitUntil: 'networkidle2', timeout: 60000 });
        
        try {
            await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
        } catch (e) {
            console.log('Feed not found immediately');
        }

        // Click first result
        const firstResult = await page.$('div[role="article"] a');
        if (firstResult) {
            await firstResult.click();
            await new Promise(r => setTimeout(r, 5000));
        }

        // 1. Debug Hours Expansion
        console.log('--- Debugging Hours ---');
        let hoursClicked = false;
        
        // Try multiple selectors for the hours dropdown
        const selectors = [
            '[data-item-id="oh"]',
            '[aria-label*="ساعات العمل"]',
            '[aria-label*="مفتوح"]', 
            '[aria-label*="مغلق"]',
            'button[aria-expanded="false"][aria-label*="ساعات"]'
        ];

        for (const sel of selectors) {
            if (hoursClicked) break;
            const el = await page.$(sel);
            if (el) {
                console.log(`Found hours element with selector: ${sel}`);
                try {
                    await el.click();
                    await new Promise(r => setTimeout(r, 2000));
                    // Check if table appeared
                    const table = await page.$('table');
                    if (table) {
                        console.log('Table appeared after click!');
                        hoursClicked = true;
                    } else {
                        console.log('Clicked but no table found.');
                    }
                } catch (e) {
                    console.log(`Error clicking ${sel}:`, e);
                }
            }
        }

        // 2. Debug Data Extraction
        const data = await page.evaluate(() => {
            const cleanText = (text: string | null | undefined) => {
                if (!text) return '';
                // Remove specific garbage symbols and private use area chars
                return text.replace(/[\uE000-\uF8FF]/g, '') // Private Use Area
                           .replace(/[]/g, '') // Specific symbols mentioned
                           .trim();
            };

            const h1s = Array.from(document.querySelectorAll('h1'));
            const mainH1 = h1s.find(h => h.textContent && !h.textContent.includes('النتائج') && !h.textContent.includes('Results')) || h1s[0];
            const name = cleanText(mainH1?.textContent);

            // Category
            const categoryEl = document.querySelector('button[jsaction="pane.rating.category"]');
            const category = cleanText(categoryEl?.textContent);

            // About tab content (try to find it even if not clicked)
            // Sometimes it's called "About" or "لمحة" or "Overview" or "نظرة عامة"
            // The selector might be tricky. Let's look for all buttons in the tab list.
            const tabButtons = Array.from(document.querySelectorAll('div[role="tablist"] button'));
            const aboutBtn = tabButtons.find(b => b.getAttribute('aria-label')?.includes('لمحة') || b.getAttribute('aria-label')?.includes('About') || b.getAttribute('aria-label')?.includes('حول'));
            const aboutTabExists = !!aboutBtn;
            
            // Also check if we are ALREADY on the About tab (unlikely if we just clicked result)
            
            return { name, category, aboutTabExists, tabButtonLabels: tabButtons.map(b => b.getAttribute('aria-label')) };
        });

        console.log('Initial Data:', data);

        // 3. Debug About Tab
        if (data.aboutTabExists) {
            console.log('--- Debugging About Tab ---');
            // Re-find the button to click it
            const aboutBtn = await page.evaluateHandle(() => {
                const tabButtons = Array.from(document.querySelectorAll('div[role="tablist"] button'));
                const btn = tabButtons.find(b => {
                    const label = b.getAttribute('aria-label');
                    return label && (label.includes('لمحة') || label.includes('About') || label.includes('حول'));
                });
                return btn;
            });
            
            if (aboutBtn) {
                // Check if it's an ElementHandle before clicking
                const element = aboutBtn.asElement();
                if (element) {
                    await (element as any).click();
                }
                await new Promise(r => setTimeout(r, 2000));
                
                const aboutData = await page.evaluate(() => {
                    const cleanText = (text: string | null | undefined) => {
                        if (!text) return '';
                        return text.replace(/[\uE000-\uF8FF]/g, '').replace(/[]/g, '').trim();
                    };

                    const descriptionEl = document.querySelector('[aria-label*="About"]'); // Usually the container has this label after clicking
                    // Or look for specific sections
                    const allDivs = Array.from(document.querySelectorAll('div'));
                    const descriptionDiv = allDivs.find(d => d.textContent && d.textContent.length > 50 && (d.parentElement?.getAttribute('aria-label')?.includes('لمحة') || d.closest('[role="main"]')));
                    
                    const description = cleanText(descriptionEl?.textContent || descriptionDiv?.textContent);
                    
                    const accessibilitySection = Array.from(document.querySelectorAll('button[aria-label*="إمكانية الوصول"], div[aria-label*="إمكانية الوصول"]'));
                    const wheelchairAccessible = accessibilitySection.length > 0; // If the section exists, usually it lists accessible features

                    return { description: description?.substring(0, 100) + '...', wheelchairAccessible };
                });
                console.log('About Data:', aboutData);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
}

debugScraper();
