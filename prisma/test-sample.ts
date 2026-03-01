import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

async function testSample() {
    console.log('Starting sample test for one hospital...');
    
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--lang=ar']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Set language to Arabic
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ar'
    });

    const query = 'عيادة اسنان في المعادي';
    console.log(`Searching for: ${query}`);
    
    try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=ar`, { waitUntil: 'networkidle2', timeout: 60000 });
        
        try {
            await page.waitForSelector('div[role="feed"]', { timeout: 5000 });
            // Click the first result
            const firstResult = await page.$('div[role="article"] a');
            if (firstResult) {
                console.log('Clicking first result...');
                await firstResult.click();
                await new Promise(r => setTimeout(r, 5000));
            }
            
            // Wait for details pane to load
            try {
                await page.waitForSelector('h1.fontHeadlineLarge, h1.DUwDvf', { timeout: 5000 });
                console.log('Details pane loaded.');
            } catch (e) {
                console.log('Details pane selector timeout, checking URL...');
            }
            
        } catch (e) {
            console.log('Direct result page likely loaded.');
        }

        console.log('Current URL:', page.url());

        // Try to expand hours
        console.log('Attempting to expand hours...');
        
        // Take a dump of buttons with aria-labels to debug
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button[aria-label], div[role="button"][aria-label]')).map(b => ({
                tag: b.tagName,
                label: b.getAttribute('aria-label'),
                expanded: b.getAttribute('aria-expanded')
            }));
        });
        // console.log('Buttons found:', buttons.filter(b => b.label?.includes('ساعات') || b.label?.includes('مفتوح') || b.label?.includes('مغلق')));

        let hoursClicked = false;
        
        // Strategy 1: The standard OH button
        const hoursDropdown = await page.$('[data-item-id="oh"]');
        if (hoursDropdown) {
            console.log('Found [data-item-id="oh"], clicking...');
            await hoursDropdown.click();
            hoursClicked = true;
            await new Promise(r => setTimeout(r, 2000));
        } 
        
        // Strategy 2: Look for aria-expanded="false" specifically
        if (!hoursClicked) {
            const expandBtn = await page.$('[aria-label*="ساعات"][aria-expanded="false"], [aria-label*="مفتوح"][aria-expanded="false"], [aria-label*="مغلق"][aria-expanded="false"]');
            if (expandBtn) {
                console.log('Found expandable button via aria-label, clicking...');
                await expandBtn.click();
                hoursClicked = true;
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // Strategy 3: Click the text itself if it looks like hours
        if (!hoursClicked) {
             const statusText = await page.$('[aria-label*="مفتوح"], [aria-label*="مغلق"], [aria-label*="Open"], [aria-label*="Closed"]');
             if (statusText) {
                 console.log('Clicking status text fallback...');
                 await statusText.click();
                 hoursClicked = true;
                 await new Promise(r => setTimeout(r, 2000));
             }
        }
        
        // Wait for table
        if (hoursClicked) {
            try {
                await page.waitForSelector('table', { timeout: 2000 });
                console.log('Table appeared.');
            } catch (e) {
                console.log('Table did not appear after click.');
            }
        } else {
            console.log('Could not find any hours element to click.');
        }

        // Extract data
        const details = await page.evaluate(() => {
            // Find the most relevant H1 (the one with the largest font size or inside role="main")
            const h1s = Array.from(document.querySelectorAll('h1'));
            // Filter out "Results" or common generic titles
            const mainH1 = h1s.find(h => h.textContent && !h.textContent.includes('النتائج') && !h.textContent.includes('Results')) || h1s[0];
            const name = mainH1?.textContent || '';
            
            // Category
            const categoryEl = document.querySelector('button[jsaction="pane.rating.category"]');
            const category = categoryEl ? categoryEl.textContent?.trim() : '';

            // Working Hours
            let workingHours: Record<string, string> = {};
            let hasEmergency = false;

            const hoursTable = document.querySelector('table');
            if (hoursTable) {
                 const rows = Array.from(hoursTable.querySelectorAll('tr'));
                 rows.forEach(row => {
                     const day = row.querySelector('td:first-child')?.textContent?.trim();
                     
                     let timeCell = row.querySelector('td[role="text"]');
                     if (!timeCell) {
                         const cells = row.querySelectorAll('td');
                         if (cells.length >= 2) timeCell = cells[1];
                     }
                     
                     let time = timeCell?.textContent?.trim();
                     
                     const timeDiv = timeCell?.querySelector('div[aria-label]');
                     if (timeDiv) {
                         time = timeDiv.getAttribute('aria-label') || '';
                     }

                     if (time) {
                        time = time.replace(/[\uE000-\uF8FF]/g, '').replace(/[^\w\s\u0600-\u06FF:,\-–AMPMampm()\/]/g, '').trim();
                     }

                     if (time && (time.includes('24 ساعة') || time.includes('٢٤ ساعة'))) {
                         hasEmergency = true;
                     }

                     if (day && time) {
                         workingHours[day] = time;
                     }
                 });
            } else {
                // Fallback aria-label parsing
                const hoursContainer = document.querySelector('[aria-label*="Hours"], [aria-label*="ساعات العمل"], [aria-label*="مفتوح"], [aria-label*="مغلق"]');
                if (hoursContainer) {
                    const label = hoursContainer.getAttribute('aria-label');
                    if (label && (label.includes(';') || label.includes('،'))) {
                        const days = label.split(/;|،/); 
                        days.forEach(dayStr => {
                            dayStr = dayStr.trim();
                            if (!dayStr) return;
                            
                            const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
                            for (const dName of dayNames) {
                                if (dayStr.startsWith(dName)) {
                                    let timePart = dayStr.substring(dName.length).replace(/^[,،]\s*/, '').trim();
                                    timePart = timePart.replace(/[\uE000-\uF8FF]/g, '').replace(/[^\w\s\u0600-\u06FF:,\-–AMPMampm()\/]/g, '').trim();
                                    if (timePart) {
                                        workingHours[dName] = timePart;
                                    }
                                    break;
                                }
                            }
                        });
                    }
                }
            }

            // Description / About
            let description = '';
            const aboutContainer = document.querySelector('[aria-label*="About"], [aria-label*="لمحة"]');
            if (aboutContainer) {
                description = aboutContainer.textContent || '';
            }

            // Accessibility
            const accessibilitySection = Array.from(document.querySelectorAll('div[aria-label*="Accessibility"], div[aria-label*="إمكانية الوصول"]'));
            let wheelchairAccessible = false;
            if (accessibilitySection.length > 0) {
                wheelchairAccessible = accessibilitySection.some(div => div.textContent?.includes('Wheelchair') || div.textContent?.includes('كراسي متحركة'));
            } else {
                const allDivs = Array.from(document.querySelectorAll('div'));
                wheelchairAccessible = allDivs.some(d => (d.textContent?.includes('Wheelchair accessible entrance') || d.textContent?.includes('مدخل صالح للكراسي المتحركة')) && d.clientWidth > 0);
            }

            return { name, category, workingHours, hasEmergency, description, wheelchairAccessible };
        });

        console.log('--------------------------------------------------');
        console.log('Extracted Data Sample:');
        console.log(`Name: ${details.name}`);
        console.log(`Category: ${details.category}`);
        console.log(`Working Hours:`, JSON.stringify(details.workingHours, null, 2));
        console.log(`Has Emergency: ${details.hasEmergency}`);
        console.log(`Wheelchair Accessible: ${details.wheelchairAccessible}`);
        console.log(`Description Length: ${details.description.length}`);
        console.log('--------------------------------------------------');

        // Save to DB for UI verification
        const hospitalData = {
            nameAr: details.name,
            slug: `test-hospital-${Date.now()}`,
            category: details.category,
            workingHours: JSON.stringify(details.workingHours),
            hasEmergency: details.hasEmergency,
            wheelchairAccessible: details.wheelchairAccessible,
            description: details.description,
            // Minimal required fields
            isFeatured: false,
            ratingAvg: 0,
            ratingCount: 0
        };

        const created = await prisma.hospital.create({
            data: hospitalData
        });
        
        // Create WorkingHour records
        const dayMap: Record<string, string> = {
            'السبت': 'Saturday',
            'الأحد': 'Sunday',
            'الاثنين': 'Monday',
            'الإثنين': 'Monday',
            'الثلاثاء': 'Tuesday',
            'الأربعاء': 'Wednesday',
            'الخميس': 'Thursday',
            'الجمعة': 'Friday'
        };

        for (const [dayKey, timeStrVal] of Object.entries(details.workingHours)) {
            const timeStr = String(timeStrVal);
            const normalizedDay = dayMap[dayKey] || dayKey;
            const isClosed = timeStr.includes('مغلق') || timeStr.includes('Closed');
            
            await prisma.workingHour.create({
                data: {
                    hospitalId: created.id,
                    day: normalizedDay,
                    openTime: timeStr,
                    isClosed: isClosed
                }
            });
        }

        console.log(`Saved to database with ID: ${created.id}`);
        console.log('You can check the UI now.');

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
    await prisma.$disconnect();
}

testSample();
