
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPoliceHospitalHours() {
  const hospital = await prisma.hospital.findFirst({
    where: {
      nameAr: {
        contains: 'الشرطة'
      }
    }
  });

  if (!hospital) {
    console.log('Hospital not found');
    return;
  }

  console.log(`Updating hours for ${hospital.nameAr} (${hospital.id})`);

  // Clear existing
  await prisma.workingHour.deleteMany({
    where: { hospitalId: hospital.id }
  });

  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  for (const day of days) {
    await prisma.workingHour.create({
      data: {
        hospitalId: hospital.id,
        day: day,
        openTime: '09:00 ص – 09:00 م',
        isClosed: day === 'Friday' // Make Friday closed for demo
      }
    });
  }

  // Also enable emergency for demo
  await prisma.hospital.update({
    where: { id: hospital.id },
    data: { hasEmergency: true }
  });

  console.log('Done! Link: http://localhost:3000/hospitals/' + hospital.slug);
}

seedPoliceHospitalHours()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
