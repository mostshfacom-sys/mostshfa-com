import { Metadata } from 'next';
import { InteractiveMap } from '@/components/maps';

export const metadata: Metadata = {
  title: 'الخريطة التفاعلية | مستشفى برو',
  description: 'اعثر على أقرب المستشفيات والعيادات والمعامل والصيدليات من موقعك الحالي',
  keywords: ['خريطة', 'مستشفيات قريبة', 'عيادات قريبة', 'صيدليات قريبة', 'معامل قريبة'],
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            🗺️ الخريطة التفاعلية
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اعثر على أقرب المنشآت الطبية من موقعك الحالي. يمكنك البحث عن المستشفيات والعيادات والمعامل والصيدليات القريبة منك.
          </p>
        </div>

        {/* Interactive Map */}
        <InteractiveMap
          showSearch={true}
          showDirections={true}
          entityTypes={['hospital', 'clinic', 'lab', 'pharmacy']}
        />

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📍</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">تحديد الموقع</h3>
            <p className="text-sm text-gray-600">
              حدد موقعك الحالي للعثور على أقرب المنشآت الطبية
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">بحث متقدم</h3>
            <p className="text-sm text-gray-600">
              فلتر النتائج حسب نوع المنشأة والمسافة
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🧭</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">الاتجاهات</h3>
            <p className="text-sm text-gray-600">
              احصل على اتجاهات مفصلة للوصول إلى وجهتك
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            💡 نصائح للاستخدام
          </h2>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>اسمح للمتصفح بالوصول إلى موقعك للحصول على نتائج دقيقة</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>استخدم الفلاتر لتضييق نطاق البحث حسب نوع المنشأة</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>انقر على أي علامة للحصول على معلومات تفصيلية</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>استخدم زر الاتجاهات لفتح خرائط جوجل مع المسار</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
