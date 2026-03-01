
import axios from 'axios';

async function probe() {
  console.log('Probing for valid drug IDs...');
  const start = 46000;
  const end = 60000;
  const step = 100; // Check every 100th ID

  for (let id = start; id <= end; id += step) {
    try {
      const url = `https://dwaprices.com/med.php?id=${id}`;
      const res = await axios.get(url, { timeout: 3000, validateStatus: () => true });
      
      if (res.status === 200) {
        const hasPrice = res.data.match(/(\d+(\.\d+)?)\s*ج\.م/);
        const nameMatch = res.data.match(/<h1>(.*?)<\/h1>/);
        const name = nameMatch ? nameMatch[1] : 'Unknown';
        
        if (hasPrice) {
            console.log(`[FOUND] ID ${id}: ${name} - Price: ${hasPrice[0]}`);
            return; // Found a valid one!
        } else {
            process.stdout.write('.');
        }
      } else {
        process.stdout.write('x');
      }
    } catch (e) {
      process.stdout.write('E');
    }
  }
  console.log('\nProbe finished.');
}

probe();
