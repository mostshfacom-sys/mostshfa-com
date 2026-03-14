
import puppeteer from 'puppeteer-core';

async function testHospitalPage() {
  const url = 'https://www.vezeeta.com/ar/hospital/%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AA%D8%AC%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%A7%D9%85%D8%B3';
  
  console.log(`Testing access to: ${url}`);
  
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

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('Status:', response?.status());
    console.log('Title:', await page.title());
    
    // Check if we see the hospital name
    const h1 = await page.$eval('h1', el => (el as HTMLElement).innerText).catch(() => 'No H1');
    console.log('H1:', h1);

    await browser.close();

  } catch (e) {
    console.error('Error:', e);
  }
}

testHospitalPage();
