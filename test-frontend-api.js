// Test if the frontend can fetch data from the API

async function testAPIs() {
  console.log('Testing Hospitals Pro APIs...\n');
  
  // Test 1: Fetch hospitals
  console.log('1. Testing /api/hospitals-pro');
  try {
    const response = await fetch('http://localhost:3002/api/hospitals-pro?page=1&pageSize=5');
    const data = await response.json();
    console.log('   ✓ Status:', response.status);
    console.log('   ✓ Count:', data.count);
    console.log('   ✓ Results:', data.results?.length);
    console.log('   ✓ First hospital:', data.results?.[0]?.nameAr);
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Fetch filters
  console.log('2. Testing /api/hospitals-pro/filters');
  try {
    const response = await fetch('http://localhost:3002/api/hospitals-pro/filters');
    const data = await response.json();
    console.log('   ✓ Status:', response.status);
    console.log('   ✓ Hospital Types:', data.hospital_types?.length);
    console.log('   ✓ Governorates:', data.governorates?.length);
    console.log('   ✓ Cities:', data.cities?.length);
    console.log('   ✓ Specialties:', data.specialties?.length);
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  console.log('');
  
  // Test 3: Test with search
  console.log('3. Testing search functionality');
  try {
    const response = await fetch('http://localhost:3002/api/hospitals-pro?page=1&search=مستشفى');
    const data = await response.json();
    console.log('   ✓ Status:', response.status);
    console.log('   ✓ Search results:', data.count);
    console.log('   ✓ First result:', data.results?.[0]?.nameAr);
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  console.log('\n✓ All API tests completed!');
  console.log('\nNow open http://localhost:3002/hospitals-pro in your browser');
}

testAPIs();
