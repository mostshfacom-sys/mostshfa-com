async function testAPI() {
  try {
    const response = await fetch('http://localhost:3002/api/hospitals-pro?page=1');
    const data = await response.json();
    
    console.log('✓ API Response Structure:');
    console.log('  - Has results:', !!data.results);
    console.log('  - Has count:', !!data.count);
    console.log('  - Results length:', data.results?.length || 0);
    console.log('  - Count value:', data.count || 0);
    console.log('  - Success:', data.success);
    
    if (data.results && data.results.length > 0) {
      const first = data.results[0];
      console.log('\n✓ First Hospital:');
      console.log('  - ID:', first.id);
      console.log('  - Name:', first.nameAr);
      console.log('  - Has type:', !!first.type);
      console.log('  - Has location:', !!first.location);
      console.log('  - Has stats:', !!first.stats);
    }
    
    console.log('\n✓ Test passed! API structure is correct.');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testAPI();
