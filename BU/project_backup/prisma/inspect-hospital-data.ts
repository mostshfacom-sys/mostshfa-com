
import puppeteer from 'puppeteer-core';

async function inspectHospitalData() {
  const url = 'https://www.vezeeta.com/ar/hospital/%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AA%D8%AC%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%A7%D9%85%D8%B3';
  
  console.log(`Inspecting data richness for: ${url}`);
  
  try {
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; 
    const browser = await puppeteer.launch({
      executablePath,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Fake user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for some data to load
    await new Promise(r => setTimeout(r, 5000));

    // Extract data
    const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const name = h1 ? (h1 as HTMLElement).innerText : null;
        
        const addrEl = document.querySelector('[data-testid="address"]');
        const address = addrEl ? (addrEl as HTMLElement).innerText : (document.body.innerText.match(/العنوان[:\s]+([^\n]+)/)?.[1] || '');
        
        // Images
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => !src.includes('logo') && !src.includes('icon'));
        
        // Phone? (Usually hidden or requires click)
        const phone = document.body.innerText.match(/01\d{9}/)?.[0] || 'Not Found';

        // About
        const aboutEl = document.querySelector('[data-testid="about-hospital"]');
        const about = aboutEl ? (aboutEl as HTMLElement).innerText : 'Not Found';

        // Specialties
        const specialties = Array.from(document.querySelectorAll('[data-testid="specialty-card"]')).map(el => (el as HTMLElement).innerText);

        return { name, address, phone, images: images.slice(0, 5), about, specialties: specialties.slice(0, 5) };
    });

    console.log('Extracted Data:', JSON.stringify(data, null, 2));

    await browser.close();

  } catch (e) {
    console.error('Error:', e);
  }
}

inspectHospitalData();
