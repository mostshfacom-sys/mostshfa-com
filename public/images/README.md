# نظام الصور - Mostshfa

## 📊 إحصائيات الصور الحالية

| القسم | عدد الصور | الحالة |
|-------|-----------|--------|
| المقالات | ~196 | ✅ مكتمل |
| الأدوية | ~600+ | ✅ مكتمل |
| المستشفيات | ~25 | ✅ متاح |
| الصيدليات | ~30 | ✅ متاح |
| العيادات | 3 | ⚠️ جزئي |
| المعامل | 0 | 🔄 افتراضي |
| التمريض | 0 | 🔄 افتراضي |
| الأطباء | 0 | 🔄 افتراضي |
| أيقونات التخصصات | ~90 | ✅ مكتمل |

## هيكل المجلدات

```
public/images/
├── articles/          # صور المقالات (~196 صورة)
├── clinics/           # صور العيادات (3 صور)
├── drugs/             # صور الأدوية (~600+ صورة)
├── general/           # صور عامة
├── hospitals/         # صور المستشفيات (~25 صورة)
├── labs/              # صور المعامل (فارغ - يستخدم الافتراضي)
├── nursing/           # صور التمريض (فارغ - يستخدم الافتراضي)
├── pharmacies/        # صور الصيدليات (~30 صورة)
├── staff/             # صور الأطباء والموظفين (فارغ - يستخدم الافتراضي)
├── Medical specialty icons/  # أيقونات التخصصات الطبية (~90 أيقونة)
└── defaults/          # الصور الافتراضية لكل قسم
    ├── hospital.svg   # صورة افتراضية للمستشفيات
    ├── clinic.svg     # صورة افتراضية للعيادات
    ├── pharmacy.svg   # صورة افتراضية للصيدليات
    ├── lab.svg        # صورة افتراضية للمعامل
    ├── drug.svg       # صورة افتراضية للأدوية
    ├── doctor.svg     # صورة افتراضية للأطباء
    ├── nursing.svg    # صورة افتراضية للتمريض
    ├── article.svg    # صورة افتراضية للمقالات
    └── medical.svg    # صورة افتراضية عامة
```

## نظام الصور الافتراضية

### الاستخدام في الكود

```tsx
import { EntityImage, EntityCardImage, EntityThumbnail } from '@/components/ui/EntityImage';

// صورة عادية
<EntityImage
  src={hospital.image}
  alt={hospital.name}
  entityType="hospital"
  width={300}
  height={200}
/>

// صورة بطاقة
<EntityCardImage
  src={drug.image}
  alt={drug.name}
  entityType="drug"
  aspectRatio="4/3"
/>

// صورة مصغرة
<EntityThumbnail
  src={doctor.photo}
  alt={doctor.name}
  entityType="doctor"
  size="md"
/>
```

### الدوال المساعدة

```tsx
import { 
  getSmartImage, 
  getDefaultImage, 
  getImageWithFallback,
  isValidImageUrl 
} from '@/lib/images/default-images';

// الحصول على صورة ذكية (تتحقق من صحة الرابط)
const image = getSmartImage(entity.image, 'hospital');

// الحصول على الصورة الافتراضية مباشرة
const defaultImg = getDefaultImage('pharmacy');

// التحقق من صحة رابط الصورة
if (isValidImageUrl(url)) {
  // الرابط صالح
}
```

## أنواع الكيانات المدعومة

| النوع | الوصف | الصورة الافتراضية |
|-------|-------|-------------------|
| hospital | مستشفى | hospital.svg |
| clinic | عيادة | clinic.svg |
| pharmacy | صيدلية | pharmacy.svg |
| lab | معمل تحاليل | lab.svg |
| drug | دواء | drug.svg |
| doctor | طبيب | doctor.svg |
| nursing | تمريض | nursing.svg |
| article | مقال | article.svg |
| general | عام | medical.svg |

## إضافة صور جديدة

### للمستشفيات
ضع الصور في: `public/images/hospitals/`
التنسيق المفضل: `hospital-name.jpg` أو `hospital-slug.jpg`

### للأدوية
ضع الصور في: `public/images/drugs/`
التنسيق المفضل: `drug-id.jpg` (مثل: `1234.jpg`)

### للمقالات
ضع الصور في: `public/images/articles/`
التنسيق المفضل: `random-string.jpg`

## ملاحظات

1. الصور الافتراضية بتنسيق SVG لضمان جودة عالية بأي حجم
2. النظام يتحقق تلقائياً من صحة روابط الصور
3. في حالة فشل تحميل الصورة، يتم عرض الصورة الافتراضية تلقائياً
4. يمكن تخصيص الصور الافتراضية بتعديل ملفات SVG في مجلد `defaults/`

## 🔧 تحديث الصور في قاعدة البيانات

لتحديث الصور الافتراضية للكيانات التي ليس لها صور:

```bash
cd mostshfa_new
node scripts/update-default-images.js
```

هذا السكريبت سيقوم بـ:
- فحص جميع الكيانات في قاعدة البيانات
- تعيين صورة افتراضية مناسبة للكيانات بدون صور
- استخدام الصور المحلية إذا كانت متاحة (خاصة للأدوية)

## 🎨 تخصيص الصور الافتراضية

يمكنك تعديل ملفات SVG في مجلد `defaults/` لتغيير شكل الصور الافتراضية.
كل ملف SVG يحتوي على:
- خلفية متدرجة
- أيقونة تمثل القسم
- نص عربي يوضح نوع الكيان
