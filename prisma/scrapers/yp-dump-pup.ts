import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function dump() {
  console.log('Launching browser...');
  let executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(executablePath)) {
    executablePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navigating...');
  await page.goto('https://yellowpages.com.eg/en/category/hospitals', { waitUntil: 'networkidle2' });
  
  const html = await page.content();
  fs.writeFileSync('yp-puppeteer-dump.html', html);
  console.log('Dumped yp-puppeteer-dump.html');
  
  await browser.close();
}

dump();
