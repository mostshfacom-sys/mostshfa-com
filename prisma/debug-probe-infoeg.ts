
import axios from 'axios';
import * as cheerio from 'cheerio';

async function probe() {
  const url = 'https://en.infoeg.com/cairo/page/528159';
  console.log(`Fetching ${url}...`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Log the phone number section
    console.log('Phone Section:');
    // Try to find phone number
    const phone = $('i.fa-phone').parent().text().trim();
    console.log('Phone Text:', phone);
    
    // Log the whole body to find where phone is if the above fails
    console.log($('body').html()?.substring(0, 5000)); 

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

probe();
