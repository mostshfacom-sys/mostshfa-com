# 🧪 اختبار زر الخريطة - خطوات بسيطة

## الخطوة 1: افتح الموقع
```
http://localhost:3002/hospitals-pro
```

## الخطوة 2: افتح Console
اضغط **F12** ثم اذهب لتبويب **Console**

## الخطوة 3: ابحث عن الزر
ابحث عن زر "عرض الخريطة" 🗺️ في أعلى الصفحة

## الخطوة 4: اضغط على الزر
اضغط على زر "عرض الخريطة"

## الخطوة 5: راقب Console

### ✅ إذا ظهرت هذه الرسائل = الزر يعمل:
```
🔧 MapViewButton mounted with X hospitals
🗺️ Map button clicked! Opening map with X hospitals
✅ Map state set to true
🗺️ InteractiveMap mounted with X hospitals
✅ Leaflet loaded successfully
```

### ❌ إذا ظهر خطأ:

#### خطأ 1: "No hospitals data available"
**المعنى**: لا توجد بيانات مستشفيات
**الحل**: 
- تأكد من أن الصفحة حملت المستشفيات
- انتظر قليلاً حتى تحمل البيانات
- أعد تحميل الصفحة (F5)

#### خطأ 2: "Cannot find module './InteractiveMap'"
**المعنى**: ملف الخريطة غير موجود
**الحل**:
```bash
# تحقق من وجود الملف
ls mostshfa_new/src/components/hospitals-pro/InteractiveMap.tsx
```

#### خطأ 3: "Leaflet is not defined"
**المعنى**: مكتبة Leaflet غير محملة
**الحل**:
```bash
cd mostshfa_new
npm install leaflet react-leaflet @types/leaflet
npm run dev
```

#### خطأ 4: لا يحدث شيء عند الضغط
**المعنى**: قد يكون هناك خطأ JavaScript
**الحل**:
1. افتح Console (F12)
2. ابحث عن أي رسائل خطأ حمراء
3. أرسل لي لقطة شاشة من الأخطاء

## الخطوة 6: اختبار بديل

إذا لم يعمل الزر، جرب هذا في Console:

```javascript
// اختبر إذا كان الزر موجود
const button = document.querySelector('button[title="عرض المستشفيات على الخريطة"]');
console.log('Button found:', button);

// اختبر إذا كانت البيانات موجودة
console.log('Page has hospitals:', window.location.href);
```

## 🔧 حلول سريعة

### الحل 1: أعد تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C)
cd mostshfa_new
npm run dev
```

### الحل 2: امسح Cache
```bash
cd mostshfa_new
rm -rf .next
npm run dev
```

### الحل 3: تحقق من المكتبات
```bash
cd mostshfa_new
npm list leaflet react-leaflet
```

يجب أن يظهر:
```
├── leaflet@1.9.4
└── react-leaflet@5.0.0
```

## 📸 ما أحتاجه منك

إذا استمرت المشكلة، أرسل لي:

1. **لقطة شاشة من Console** (F12 → Console)
2. **لقطة شاشة من الصفحة** (أين الزر؟)
3. **نسخ الرسائل من Console** (انسخ النص)

## 🎯 النتيجة المتوقعة

عند الضغط على الزر، يجب أن:
1. تظهر نافذة منبثقة كبيرة
2. تحتوي على خريطة تفاعلية
3. تظهر علامات المستشفيات على الخريطة
4. يمكنك الضغط على العلامات لرؤية التفاصيل
5. يمكنك إغلاق الخريطة بالضغط على X

---

**ملاحظة مهمة**: تأكد من أن السيرفر يعمل على المنفذ الصحيح:
```
http://localhost:3002/hospitals-pro
```
وليس:
```
http://localhost:3000/hospitals-pro
```
