
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectVezeetaDeep() {
  const url = 'https://www.vezeeta.com/ar';
  console.log(`Fetching ${url}...`);
  
  try {
    const res = await axios.get(url, { 
      headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const $ = cheerio.load(res.data);
    
    // Look for any link with 'hospital' in href
    console.log('--- Deep Hospital Links ---');
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.toLowerCase().includes('hospital')) {
          console.log(`${$(el).text().trim()} -> ${href}`);
      }
    });

  } catch (e) {
    console.error(e);
  }
}

inspectVezeetaDeep();
