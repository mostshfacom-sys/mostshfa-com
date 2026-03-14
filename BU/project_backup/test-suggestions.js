const http = require('http');

function testSuggestions(query) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ اقتراحات '${query}': ${res.statusCode} - ${json.success ? json.suggestions.length + ' اقتراح' : 'Failed'}`);
          if (json.success && json.suggestions.length > 0) {
            json.suggestions.slice(0, 3).forEach(s => {
              console.log(`   ${s.icon || '📍'} ${s.text} (${s.type})`);
            });
          }
          resolve();
        } catch (e) {
          console.log(`❌ اقتراحات '${query}': ${res.statusCode} - Parse Error`);
          resolve();
        }
      });
    });
    req.on('error', (e) => {
      console.log(`❌ اقتراحات '${query}': ${e.message}`);
      resolve();
    });
    req.on('timeout', () => {
      console.log(`⏰ اقتراحات '${query}': Timeout`);
      req.destroy();
      resolve();
    });
    req.end();
  });
}

async function runTests() {
  console.log('🧪 اختبار اقتراحات البحث...\n');
  await testSuggestions('مستشفى');
  await testSuggestions('القاهرة');
  await testSuggestions('قلب');
  await testSuggestions('طوارئ');
  console.log('\n✅ انتهى الاختبار');
}

runTests();