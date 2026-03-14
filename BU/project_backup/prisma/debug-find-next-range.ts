
import axios from 'axios';

async function checkRange() {
  const ranges = [42000, 45000, 50000, 60000, 70000, 80000, 90000, 100000];
  
  for (const id of ranges) {
    try {
      const url = `https://dwaprices.com/med.php?id=${id}`;
      console.log(`Checking ${id}...`);
      const response = await axios.get(url, { timeout: 5000 });
      if (response.data.includes('<title>') && !response.data.includes('Not Found') && !response.data.includes('Error')) {
         const title = response.data.match(/<title>(.*?)<\/title>/)?.[1] || '';
         console.log(`[FOUND] ${id}: ${title}`);
      } else {
         console.log(`[MISSING] ${id}`);
      }
    } catch (e: any) {
      console.log(`[ERROR] ${id}: ${e.message}`);
    }
  }
}

checkRange();
