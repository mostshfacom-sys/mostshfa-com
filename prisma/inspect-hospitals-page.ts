
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectHospitalsPage() {
  const url = 'https://www.vezeeta.com/ar/hospitals';
  console.log(`Fetching ${url}...`);
  
  try {
    const res = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    
    const $ = cheerio.load(res.data);
    
    console.log('--- Hospital Links ---');
    let count = 0;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && href.includes('/ar/hospital/')) {
        if (count < 5) console.log(`Hospital: ${text} -> ${href}`);
        count++;
      }
    });
    console.log(`Total Hospital Links found: ${count}`);

    console.log('--- Pagination ---');
    // Check for pagination links
    $('ul.pagination a, .pagination a').each((i, el) => {
        console.log(`Page Link: ${$(el).text()} -> ${$(el).attr('href')}`);
    });

  } catch (e) {
    console.error(e);
  }
}

inspectHospitalsPage();
