const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    const hospitalCount = await prisma.hospital.count();
    console.log('Total hospitals:', hospitalCount);
    
    const typeCount = await prisma.hospitalType.count();
    console.log('Total hospital types:', typeCount);
    
    const govCount = await prisma.governorate.count();
    console.log('Total governorates:', govCount);
    
    const cityCount = await prisma.city.count();
    console.log('Total cities:', cityCount);
    
    if (hospitalCount > 0) {
      const sample = await prisma.hospital.findFirst({
        include: {
          type: true,
          governorate: true,
          city: true,
        }
      });
      console.log('\nSample hospital:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    // Test API response format
    console.log('\n--- Testing API call ---');
    const response = await fetch('http://localhost:3002/api/hospitals-pro?page=1&pageSize=5');
    const data = await response.json();
    console.log('API Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
