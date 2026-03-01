const http = require('http');

// Test the hospitals-pro API endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/hospitals-pro?page=1&pageSize=5',
  method: 'GET',
  timeout: 10000
};

console.log('Testing hospitals-pro API endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ API Response:');
      console.log('Success:', jsonData.success);
      console.log('Data count:', jsonData.data ? jsonData.data.length : 0);
      console.log('Pagination:', jsonData.pagination);
      
      if (jsonData.success) {
        console.log('🎉 API test successful!');
      } else {
        console.log('❌ API returned error:', jsonData.error);
      }
    } catch (err) {
      console.error('❌ Failed to parse JSON response:', err.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (err) => {
  console.error('❌ API request failed:', err.message);
});

req.on('timeout', () => {
  console.error('❌ API request timeout');
  req.destroy();
});

req.end();