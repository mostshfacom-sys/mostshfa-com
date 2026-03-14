
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectVezeeta() {
  const urls = [
    'https://www.vezeeta.com/ar',
    'https://www.vezeeta.com/ar/Hospital', // Guessing
    'https://www.vezeeta.com/ar/Center',   // Guessing
    'https://www.vezeeta.com/ar/search?EntityType=Hospital' // Guessing search query
  ];

  for (const url of urls) {
    try {
      console.log(`Checking ${url}...`);
      const res = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        validateStatus: () => true 
      });
      
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        const $ = cheerio.load(res.data);
        const title = $('title').text().trim();
        console.log(`Title: ${title}`);
        
        // Look for links related to hospitals
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && (href.includes('hospital') || href.includes('center') || text.includes('مستشفى') || text.includes('مركز'))) {
            if (i < 5) console.log(`Link: ${text} -> ${href}`);
          }
        });
      }
    } catch (e: any) {
      console.log(`Error checking ${url}: ${e.message}`);
    }
    console.log('---');
  }
}

inspectVezeeta();
