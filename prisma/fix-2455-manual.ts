import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('Manually correcting hospital 2455 data...');

    // Clean services list - removing concatenated garbage
    const cleanServices = [
        'مستشفى دار الفؤاد',
        'مدخل صالح للكراسي المتحركة',
        'موقف سيارات صالح للكراسي المتحركة',
        'خدمة طوارئ',
        'طوارئ 24 ساعة',
        'عربة إسعاف'
    ];

    await prisma.hospital.update({
        where: { id: 2455 },
        data: {
            category: 'مستشفى خاص', // Fix gender agreement
            services: JSON.stringify(cleanServices),
            // Ensure emergency flag is true
            hasEmergency: true,
            // Ensure working hours are set to 24h
            workingHours: JSON.stringify({
                'السبت': '24 ساعة', 'الأحد': '24 ساعة', 'الاثنين': '24 ساعة',
                'الثلاثاء': '24 ساعة', 'الأربعاء': '24 ساعة', 'الخميس': '24 ساعة', 'الجمعة': '24 ساعة'
            }),
            // Set a fallback description if none exists, or just leave it blank if that's safer
            // I'll leave description as is if it's null, or maybe set a generic one if requested?
            // The user asked for "any available data". If none, none.
            // But let's at least clear any garbage if present.
            description: null // Reset to null to be safe rather than garbage
        }
    });

    console.log('Fixed hospital 2455 successfully.');
}

fix()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
