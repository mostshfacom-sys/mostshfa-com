const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== Database Summary ===\n');
  
  const summary = {
    'المحافظات (Governorates)': await prisma.governorate.count(),
    'المدن (Cities)': await prisma.city.count(),
    'أنواع المستشفيات (Hospital Types)': await prisma.hospitalType.count(),
    'التخصصات (Specialties)': await prisma.specialty.count(),
    'المستشفيات (Hospitals)': await prisma.hospital.count(),
    'العيادات (Clinics)': await prisma.clinic.count(),
    'المعامل (Labs)': await prisma.lab.count(),
    'الصيدليات (Pharmacies)': await prisma.pharmacy.count(),
    'فئات الأدوية (Drug Categories)': await prisma.drugCategory.count(),
    'الأدوية (Drugs)': await prisma.drug.count(),
  };
  
  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }
  
  // Sample data
  console.log('\n=== Sample Data ===\n');
  
  const sampleHospital = await prisma.hospital.findFirst();
  console.log('Sample Hospital:', sampleHospital?.nameAr);
  
  const sampleDrug = await prisma.drug.findFirst();
  console.log('Sample Drug:', sampleDrug?.nameAr);
  
  await prisma.$disconnect();
}

checkData();
