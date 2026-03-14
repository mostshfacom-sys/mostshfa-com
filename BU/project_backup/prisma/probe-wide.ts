
import axios from 'axios';
import * as cheerio from 'cheerio';

async function probe() {
  console.log('Starting Wide Range Probe (32,000 to 100,000)...');
  
  const start = 32000;
  const end = 100000;
  const step = 500; // Check every 500th ID
  
  let found = 0;

  for (let id = start; id <= end; id += step) {
    try {
      const url = `https://dwaprices.com/med.php?id=${id}`;
      const res = await axios.get(url, { 
        timeout: 5000, 
        validateStatus: () => true 
      });

      if (res.status === 200) {
        const hasPrice = res.data.match(/(\d+(\.\d+)?)\s*ج\.م/);
        const nameMatch = res.data.match(/<h1>(.*?)<\/h1>/);
        const name = nameMatch ? nameMatch[1] : 'Unknown';
        
        // Check for specific "Not Found" indicators in text if status is 200
        const isErrorPage = res.data.includes('غير موجود') || res.data.includes('Not Found') || name === 'Unknown';

        if (hasPrice && !isErrorPage) {
            console.log(`[FOUND] ID ${id}: ${name} - Price: ${hasPrice[0]}`);
            found++;
            // If we found something, try to check the neighborhood
            // checkNeighborhood(id);
        } else {
            process.stdout.write('.');
        }
      } else {
        process.stdout.write('x');
      }
    } catch (e) {
      process.stdout.write('E');
    }
    
    if ((id - start) % (step * 20) === 0) console.log(`\nReached ID ${id}...`);
  }
  
  console.log(`\nProbe finished. Found ${found} potential drugs.`);
}

probe();
