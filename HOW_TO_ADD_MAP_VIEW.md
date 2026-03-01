# كيفية إضافة عرض الخريطة التفاعلية

## الخطوات المطلوبة

### 1. إضافة الاستيرادات في أعلى الملف `src/app/hospitals-pro/page.tsx`

بعد السطر:
```typescript
import { SkeletonCard, SkeletonCardList } from '@/components/shared/SkeletonCard';
```

أضف:
```typescript
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/ui/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
});
```

### 2. إضافة حالة عرض الخريطة

بعد السطر:
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
```

أضف:
```typescript
const [isMapView, setIsMapView] = useState(false);
```

### 3. إضافة زر التبديل

ابحث عن:
```typescript
{/* Results */}
<div className="flex-1 min-w-0">
  <SearchStatusBar
```

واستبدله بـ:
```typescript
{/* Results */}
<div className="flex-1 min-w-0">
  {/* Map View Toggle Button */}
  {!loading && !error && hospitals.length > 0 && (
    <div className="mb-4 flex justify-end">
      <MapViewButton
        isMapView={isMapView}
        onToggle={() => setIsMapView(!isMapView)}
      />
    </div>
  )}

  <SearchStatusBar
```

### 4. إضافة عرض الخريطة

ابحث عن:
```typescript
{/* Recently Viewed */}
<RecentlyViewedPanel />

{/* Grid View */}
<AnimatePresence mode="wait">
```

واستبدله بـ:
```typescript
{/* Recently Viewed */}
<RecentlyViewedPanel />

{/* Map or Grid View */}
{isMapView ? (
  <motion.div
    key="map"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="mb-6"
  >
    <InteractiveMap
      entities={hospitals.map(h => ({
        id: h.id,
        name: h.name_en || h.name_ar,
        nameAr: h.name_ar,
        latitude: h.latitude || 30.0444,
        longitude: h.longitude || 31.2357,
        type: 'hospital' as const,
        address: h.address || '',
        phone: h.phone || undefined,
        rating: h.rating_avg || undefined,
        isVerified: h.is_verified || false,
        isFeatured: h.is_featured || false,
        hasEmergency: h.has_emergency || false,
      }))}
      height="600px"
      showSearch={true}
      showFilters={true}
    />
  </motion.div>
) : (
  <>
    {/* Grid View */}
    <AnimatePresence mode="wait">
```

### 5. إغلاق القوس

في نهاية قسم العرض، قبل:
```typescript
{/* Load More Button */}
```

أضف:
```typescript
    </AnimatePresence>
  </>
)}
```

## النتيجة

بعد هذه التعديلات، سيظهر زر "عرض الخريطة التفاعلية" في أعلى الصفحة، وعند الضغط عليه ستظهر خريطة تفاعلية تعرض جميع المستشفيات.

## الميزات
- ✅ التبديل بين عرض الشبكة والخريطة
- ✅ عرض جميع المستشفيات على الخريطة
- ✅ البحث والفلترة داخل الخريطة
- ✅ عرض تفاصيل المستشفى عند النقر
- ✅ تحميل ديناميكي للخريطة
