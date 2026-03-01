
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspect() {
  const id = 31840;
  console.log(`Inspecting ID ${id} for EGP price...`);
  try {
    const res = await axios.get(`https://dwaprices.com/med.php?id=${id}`);
    const $ = cheerio.load(res.data);
    
    // Dump ALL rows
    $('tr').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.includes('السعر') || text.includes('جنية') || text.includes('ج.م') || text.includes('EGP')) {
            console.log(`Row ${i}: ${text}`);
        }
    });

    // Dump body text around "السعر"
    const body = $('body').text();
    const index = body.indexOf('السعر');
    if (index !== -1) {
        console.log('Context around "السعر":', body.substring(index, index + 100).replace(/\s+/g, ' '));
    }

  } catch (e) {
    console.error(e);
  }
}

inspect();
