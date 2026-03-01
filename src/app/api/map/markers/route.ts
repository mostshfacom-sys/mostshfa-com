import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface Marker {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string | null;
  rating?: number;
  slug: string;
  phone?: string | null;
  isOpen?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const types = searchParams.get('types')?.split(',') || ['hospital', 'clinic', 'lab', 'pharmacy'];
    const limit = parseInt(searchParams.get('limit') || '100');

    const markers: Marker[] = [];

    if (types.includes('hospital')) {
      const hospitals = await prisma.hospital.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: {
          id: true, nameAr: true, slug: true, address: true,
          lat: true, lng: true, ratingAvg: true, phone: true,
        },
        take: limit,
      });
      hospitals.forEach((h) => {
        if (h.lat && h.lng) {
          markers.push({
            id: `hospital-${h.id}`, name: h.nameAr, type: 'hospital',
            lat: h.lat, lng: h.lng, address: h.address,
            rating: h.ratingAvg, slug: h.slug, phone: h.phone,
          });
        }
      });
    }

    if (types.includes('clinic')) {
      const clinics = await prisma.clinic.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: {
          id: true, nameAr: true, slug: true, addressAr: true,
          lat: true, lng: true, ratingAvg: true, phone: true,
        },
        take: limit,
      });
      clinics.forEach((c) => {
        if (c.lat && c.lng) {
          markers.push({
            id: `clinic-${c.id}`, name: c.nameAr, type: 'clinic',
            lat: c.lat, lng: c.lng, address: c.addressAr,
            rating: c.ratingAvg, slug: c.slug, phone: c.phone,
          });
        }
      });
    }

    if (types.includes('lab')) {
      const labs = await prisma.lab.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: {
          id: true, nameAr: true, slug: true, addressAr: true,
          lat: true, lng: true, ratingAvg: true, phone: true,
        },
        take: limit,
      });
      labs.forEach((l) => {
        if (l.lat && l.lng) {
          markers.push({
            id: `lab-${l.id}`, name: l.nameAr, type: 'lab',
            lat: l.lat, lng: l.lng, address: l.addressAr,
            rating: l.ratingAvg, slug: l.slug, phone: l.phone,
          });
        }
      });
    }

    if (types.includes('pharmacy')) {
      const pharmacies = await prisma.pharmacy.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: {
          id: true, nameAr: true, slug: true, addressAr: true,
          lat: true, lng: true, ratingAvg: true, phone: true, is24h: true,
        },
        take: limit,
      });
      pharmacies.forEach((p) => {
        if (p.lat && p.lng) {
          markers.push({
            id: `pharmacy-${p.id}`, name: p.nameAr, type: 'pharmacy',
            lat: p.lat, lng: p.lng, address: p.addressAr,
            rating: p.ratingAvg, slug: p.slug, phone: p.phone, isOpen: p.is24h,
          });
        }
      });
    }

    if (types.includes('ambulance')) {
      // Add mock ambulance locations (major hospitals often serve as ambulance points)
      // Comprehensive list covering major governorates
      const ambulancePoints = [
        // Cairo
        { id: 'amb-1', name: 'نقطة إسعاف رمسيس', lat: 30.0636, lng: 31.2474, address: 'ميدان رمسيس، القاهرة' },
        { id: 'amb-2', name: 'نقطة إسعاف التحرير', lat: 30.0444, lng: 31.2357, address: 'ميدان التحرير، القاهرة' },
        { id: 'amb-5', name: 'نقطة إسعاف المعادي', lat: 29.9602, lng: 31.2569, address: 'المعادي، القاهرة' },
        { id: 'amb-6', name: 'نقطة إسعاف مدينة نصر', lat: 30.0566, lng: 31.3301, address: 'شارع عباس العقاد، مدينة نصر' },
        { id: 'amb-7', name: 'نقطة إسعاف مصر الجديدة', lat: 30.0890, lng: 31.3145, address: 'ميدان روكسي' },
        { id: 'amb-8', name: 'نقطة إسعاف العباسية', lat: 30.0754, lng: 31.2868, address: 'العباسية، القاهرة' },
        { id: 'amb-11', name: 'نقطة إسعاف السيدة زينب', lat: 30.0344, lng: 31.2357, address: 'ميدان السيدة زينب' },
        { id: 'amb-12', name: 'نقطة إسعاف شبرا', lat: 30.0626, lng: 31.2457, address: 'شبرا، القاهرة' },
        { id: 'amb-42', name: 'نقطة إسعاف التجمع الخامس', lat: 30.0234, lng: 31.4870, address: 'التجمع الخامس، القاهرة' },
        { id: 'amb-43', name: 'نقطة إسعاف حلوان', lat: 29.8414, lng: 31.3000, address: 'حلوان، القاهرة' },
        { id: 'amb-44', name: 'نقطة إسعاف إمبابة', lat: 30.0716, lng: 31.2040, address: 'إمبابة، الجيزة' },
        
        // Giza
        { id: 'amb-3', name: 'نقطة إسعاف الجيزة', lat: 30.0131, lng: 31.2089, address: 'ميدان الجيزة' },
        { id: 'amb-4', name: 'نقطة إسعاف الدقي', lat: 30.0378, lng: 31.2100, address: 'الدقي، الجيزة' },
        { id: 'amb-9', name: 'نقطة إسعاف الهرم', lat: 29.9975, lng: 31.1661, address: 'شارع الهرم' },
        { id: 'amb-10', name: 'نقطة إسعاف 6 أكتوبر', lat: 29.9737, lng: 30.9511, address: 'الحصري، 6 أكتوبر' },
        { id: 'amb-13', name: 'نقطة إسعاف الشيخ زايد', lat: 30.0448, lng: 30.9855, address: 'الشيخ زايد، الجيزة' },
        { id: 'amb-14', name: 'نقطة إسعاف المهندسين', lat: 30.0511, lng: 31.2001, address: 'المهندسين، الجيزة' },

        // Alexandria
        { id: 'amb-15', name: 'نقطة إسعاف محطة الرمل', lat: 31.2001, lng: 29.9187, address: 'محطة الرمل، الإسكندرية' },
        { id: 'amb-16', name: 'نقطة إسعاف سموحة', lat: 31.2156, lng: 29.9553, address: 'سموحة، الإسكندرية' },
        { id: 'amb-17', name: 'نقطة إسعاف ميامي', lat: 31.2565, lng: 30.0074, address: 'ميامي، الإسكندرية' },
        { id: 'amb-45', name: 'نقطة إسعاف برج العرب', lat: 30.9154, lng: 29.6964, address: 'برج العرب، الإسكندرية' },
        
        // Delta
        { id: 'amb-18', name: 'نقطة إسعاف المنصورة', lat: 31.0409, lng: 31.3785, address: 'المنصورة، الدقهلية' },
        { id: 'amb-19', name: 'نقطة إسعاف طنطا', lat: 30.7865, lng: 31.0004, address: 'طنطا، الغربية' },
        { id: 'amb-20', name: 'نقطة إسعاف الزقازيق', lat: 30.5765, lng: 31.5041, address: 'الزقازيق، الشرقية' },
        { id: 'amb-21', name: 'نقطة إسعاف دمنهور', lat: 31.0379, lng: 30.4726, address: 'دمنهور، البحيرة' },
        { id: 'amb-46', name: 'نقطة إسعاف المحلة الكبرى', lat: 30.9695, lng: 31.1669, address: 'المحلة الكبرى، الغربية' },
        { id: 'amb-47', name: 'نقطة إسعاف كفر الدوار', lat: 31.1300, lng: 30.1290, address: 'كفر الدوار، البحيرة' },
        { id: 'amb-48', name: 'نقطة إسعاف العاشر من رمضان', lat: 30.2992, lng: 31.7410, address: 'العاشر من رمضان، الشرقية' },
        { id: 'amb-49', name: 'نقطة إسعاف شبين الكوم', lat: 30.5526, lng: 31.0101, address: 'شبين الكوم، المنوفية' },
        { id: 'amb-50', name: 'نقطة إسعاف شبرا الخيمة', lat: 30.1230, lng: 31.2601, address: 'شبرا الخيمة، القليوبية' },

        // Canal
        { id: 'amb-22', name: 'نقطة إسعاف الإسماعيلية', lat: 30.5965, lng: 32.2715, address: 'الإسماعيلية' },
        { id: 'amb-23', name: 'نقطة إسعاف بورسعيد', lat: 31.2653, lng: 32.3019, address: 'بورسعيد' },
        { id: 'amb-24', name: 'نقطة إسعاف السويس', lat: 29.9668, lng: 32.5498, address: 'السويس' },
        { id: 'amb-51', name: 'نقطة إسعاف فايد', lat: 30.3426, lng: 32.3203, address: 'فايد، الإسماعيلية' },

        // Upper Egypt
        { id: 'amb-25', name: 'نقطة إسعاف بني سويف', lat: 29.0661, lng: 31.0994, address: 'بني سويف' },
        { id: 'amb-26', name: 'نقطة إسعاف المنيا', lat: 28.1099, lng: 30.7503, address: 'المنيا' },
        { id: 'amb-27', name: 'نقطة إسعاف أسيوط', lat: 27.1783, lng: 31.1859, address: 'أسيوط' },
        { id: 'amb-28', name: 'نقطة إسعاف سوهاج', lat: 26.5570, lng: 31.6948, address: 'سوهاج' },
        { id: 'amb-29', name: 'نقطة إسعاف قنا', lat: 26.1551, lng: 32.7160, address: 'قنا' },
        { id: 'amb-30', name: 'نقطة إسعاف الأقصر', lat: 25.6872, lng: 32.6396, address: 'الأقصر' },
        { id: 'amb-31', name: 'نقطة إسعاف أسوان', lat: 24.0889, lng: 32.8998, address: 'أسوان' },
        { id: 'amb-32', name: 'نقطة إسعاف الفيوم', lat: 29.3084, lng: 30.8428, address: 'الفيوم' },
        { id: 'amb-33', name: 'نقطة إسعاف دمياط', lat: 31.4175, lng: 31.8144, address: 'دمياط' },
        { id: 'amb-34', name: 'نقطة إسعاف كفر الشيخ', lat: 31.1107, lng: 30.9388, address: 'كفر الشيخ' },
        { id: 'amb-35', name: 'نقطة إسعاف المنوفية', lat: 30.5526, lng: 31.0101, address: 'شبين الكوم، المنوفية' },
        { id: 'amb-36', name: 'نقطة إسعاف القليوبية', lat: 30.4591, lng: 31.1786, address: 'بنها، القليوبية' },
        { id: 'amb-37', name: 'نقطة إسعاف البحر الأحمر', lat: 27.2579, lng: 33.8116, address: 'الغردقة، البحر الأحمر' },
        { id: 'amb-38', name: 'نقطة إسعاف شمال سيناء', lat: 31.1249, lng: 33.8006, address: 'العريش، شمال سيناء' },
        { id: 'amb-39', name: 'نقطة إسعاف جنوب سيناء', lat: 27.9158, lng: 34.3290, address: 'شرم الشيخ، جنوب سيناء' },
        { id: 'amb-40', name: 'نقطة إسعاف مطروح', lat: 31.3543, lng: 27.2373, address: 'مرسى مطروح' },
        { id: 'amb-41', name: 'نقطة إسعاف الوادي الجديد', lat: 25.4517, lng: 30.5466, address: 'الخارجة، الوادي الجديد' },
        { id: 'amb-52', name: 'نقطة إسعاف الواسطى', lat: 29.3373, lng: 31.1769, address: 'الواسطى، بني سويف' },
        { id: 'amb-53', name: 'نقطة إسعاف ملوي', lat: 27.7312, lng: 30.8410, address: 'ملوي، المنيا' },
        { id: 'amb-54', name: 'نقطة إسعاف ديروط', lat: 27.5589, lng: 30.8090, address: 'ديروط، أسيوط' },
        { id: 'amb-55', name: 'نقطة إسعاف أخميم', lat: 26.5635, lng: 31.7443, address: 'أخميم، سوهاج' },
        { id: 'amb-56', name: 'نقطة إسعاف قوص', lat: 25.9198, lng: 32.7619, address: 'قوص، قنا' },
        { id: 'amb-57', name: 'نقطة إسعاف إسنا', lat: 25.2939, lng: 32.5544, address: 'إسنا، الأقصر' },
        { id: 'amb-58', name: 'نقطة إسعاف كوم أمبو', lat: 24.4765, lng: 32.9516, address: 'كوم أمبو، أسوان' },
        { id: 'amb-59', name: 'نقطة إسعاف سافاجا', lat: 26.7292, lng: 33.9365, address: 'سفاجا، البحر الأحمر' },
        { id: 'amb-60', name: 'نقطة إسعاف الشيخ زويد', lat: 31.2142, lng: 34.1107, address: 'الشيخ زويد، شمال سيناء' },
        { id: 'amb-61', name: 'نقطة إسعاف دهب', lat: 28.5024, lng: 34.5136, address: 'دهب، جنوب سيناء' },
        { id: 'amb-62', name: 'نقطة إسعاف العلمين', lat: 30.8442, lng: 28.9542, address: 'العلمين، مطروح' },
        { id: 'amb-63', name: 'نقطة إسعاف الداخلة', lat: 25.4893, lng: 28.9829, address: 'الداخلة، الوادي الجديد' },
      ];

      ambulancePoints.forEach((a) => {
        markers.push({
          id: a.id,
          name: a.name,
          type: 'ambulance',
          lat: a.lat,
          lng: a.lng,
          address: a.address,
          slug: 'emergency', // Generic slug
          phone: '123',
          isOpen: true,
        });
      });
    }

    return NextResponse.json({ markers, total: markers.length });
  } catch (error) {
    console.error('Map markers error:', error);
    return NextResponse.json({ error: 'Error loading markers' }, { status: 500 });
  }
}
