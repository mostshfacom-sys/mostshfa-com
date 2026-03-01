
import axios from 'axios';

async function findNextValidId() {
  console.log(`Scanning ranges...`);
  
  const ranges = [
      { start: 1, end: 20000 },
      { start: 20000, end: 40000 },
      { start: 40000, end: 60000 },
      { start: 60000, end: 80000 },
      { start: 80000, end: 100000 },
      { start: 100000, end: 125000 }
  ];

  for (const range of ranges) {
      console.log(`\nChecking Range ${range.start} - ${range.end}`);
      // Check 5 random points in this range
      for (let i = 0; i < 5; i++) {
          const randomId = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
          try {
            const url = `https://dwaprices.com/med.php?id=${randomId}`;
            const response = await axios.get(url, { timeout: 3000 });
            const title = response.data.match(/<title>(.*?)<\/title>/)?.[1] || '';
            if (title.length > 10 && !title.includes('Not Found') && !title.includes('Error')) {
                console.log(`[FOUND] ${randomId}: ${title.substring(0, 50)}...`);
            } else {
                process.stdout.write('.');
            }
          } catch (e) {
            process.stdout.write('x');
          }
      }
  }
}

findNextValidId();
