
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// A sample URL from our list
const TARGET_URL = 'https://www.vezeeta.com/ar/hospital/%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AA%D8%AC%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%A7%D9%85%D8%B3';

async function inspect() {
    console.log('Launching browser to inspect...');
    const browser = await puppeteer.launch({
        headless: false,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log(`Navigating to ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait a bit
    await new Promise(r => setTimeout(r, 5000));

    // Try to find specific elements and dump their attributes/text
    const analysis = await page.evaluate(() => {
        const data: any = {};

        // 1. Images
        data.images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            class: img.className,
            parentClass: img.parentElement?.className
        })).filter(i => !i.src.includes('data:image')); // filter base64 to keep log clean

        // 2. Links (for phone, facebook, etc)
        data.links = Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.innerText,
            class: a.className
        })).filter(l => l.href.startsWith('tel:') || l.href.includes('facebook') || l.href.includes('whatsapp'));

        // 3. Text content searching for keywords
        const bodyText = document.body.innerText;
        data.hasPhoneText = bodyText.match(/(01\d{9}|16\d{3}|02\d{7,8})/) ? 'Yes' : 'No';
        data.phoneMatches = bodyText.match(/(01\d{9}|16\d{3}|02\d{7,8})/g);
        
        // 4. Structure dump of potential containers
        // Address often has an icon or specific class
        const potentialAddresses = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('العنوان') || el.textContent?.includes('شارع')
        ).slice(0, 5).map(el => ({
            tag: el.tagName,
            text: (el as HTMLElement).innerText?.substring(0, 100) || '',
            class: el.className
        }));
        data.potentialAddresses = potentialAddresses;

        // 5. Specialties
        // Look for lists
        data.lists = Array.from(document.querySelectorAll('ul, ol')).map(ul => ({
            items: (ul as HTMLElement).innerText?.substring(0, 100) || '',
            class: ul.className
        }));

        // 6. JSON-LD check (Structured Data)
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        data.jsonLd = scripts.map(s => JSON.parse(s.innerHTML));

        return data;
    });

    console.log('--- Analysis Result ---');
    console.log(JSON.stringify(analysis, null, 2));

    await browser.close();
}

inspect();
