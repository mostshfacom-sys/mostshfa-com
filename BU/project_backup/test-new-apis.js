const http = require('http');

function testAPI(path, description) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${description}: ${res.statusCode} - ${json.success ? 'Success' : 'Failed'}`);
          if (json.success && json.data) {
            console.log(`   📊 البيانات: ${json.data.length} عنصر`);
          }
          if (json.success && json.filters) {
            console.log(`   🔍 الفلاتر: ${Object.keys(json.filters).length} نوع`);
          }
          if (json.success && json.cities) {
            console.log(`   🏙️ المدن: ${json.cities.length} مدينة`);
          }
          resolve();
        } catch (e) {
          console.log(`❌ ${description}: ${res.statusCode} - Parse Error`);
          resolve();
        }
      });
    });
    req.on('error', (e) => {
      console.log(`❌ ${description}: ${e.message}`);
      resolve();
    });
    req.on('timeout', () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve();
    });
    req.end();
  });
}

async function runTests() {
  console.log('🧪 اختبار APIs الجديدة...\n');
  
  await testAPI('/api/hospitals-pro?page=1&pageSize=3', 'API المستشفيات المحسن');
  await testAPI('/api/hospitals-pro/filters', 'API الفلاتر');
  await testAPI('/api/hospitals-pro/cities?governorateId=1', 'API المدن');
  
  console.log('\n✅ انتهى الاختبار');
}

runTests();