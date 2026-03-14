const http = require('http');

// Test if server is running on localhost:3000
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

console.log('Testing server connection to localhost:3000...');

const req = http.request(options, (res) => {
  console.log(`✅ Server is running! Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Response received (${data.length} bytes)`);
    console.log('🎉 Server test successful!');
  });
});

req.on('error', (err) => {
  console.error('❌ Server connection failed:', err.message);
  console.log('💡 Make sure the server is running with: npm run dev');
});

req.on('timeout', () => {
  console.error('❌ Server connection timeout');
  req.destroy();
});

req.end();