# تحديث نظام البانر - الترحيل لقاعدة البيانات

## ملخص التغييرات

تم تحديث نظام البانر ليستخدم قاعدة البيانات (PlanetScale/MySQL) بدلاً من ملف JSON محلي، وذلك لضمان التوافق مع بيئة Vercel.

## المشكلة السابقة

كان البانر يُخزن في ملف `data/banner-config.json` والذي:
- ❌ لا يعمل على Vercel (نظام ملفات للقراءة فقط)
- ❌ لا يدعم التحديثات في بيئة الإنتاج

## الحل الجديد

تم ترحيل البانر لجدول `page_banners` في قاعدة البيانات:
- ✅ يعمل على Vercel + PlanetScale
- ✅ يدعم التحديثات من لوحة التحكم
- ✅ قابل للتوسع لصفحات أخرى

## الملفات المُحدّثة

1. **prisma/schema.prisma**
   - تغيير provider من `sqlite` إلى `mysql`
   - إضافة `relationMode = "prisma"` لدعم PlanetScale
   - إضافة `@db.Text` و `@db.LongText` للحقول النصية

2. **src/app/api/admin/banner/route.ts**
   - تحديث لاستخدام Prisma بدلاً من fs
   - دعم GET و PUT للبانر

3. **src/components/articles/ArticlesBanner.tsx**
   - لا تغييرات (يعمل مع API الجديد)

4. **src/app/admin/articles-banner/page.tsx**
   - لا تغييرات (يعمل مع API الجديد)

## خطوات الإعداد

### 1. إعداد متغيرات البيئة

```env
# .env أو .env.local
DATABASE_URL="mysql://user:password@host/database?sslaccept=strict"
```

### 2. تشغيل الترحيل

```bash
cd mostshfa_new
npx prisma generate
npx prisma db push
```

أو استخدم السكريبت:
```bash
node scripts/setup-database.js
```

### 3. التحقق من العمل

1. شغّل السيرفر: `npm run dev`
2. افتح: http://localhost:3001/admin/articles-banner
3. جرّب تعديل البانر وحفظه

## هيكل جدول page_banners

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | INT | المعرف الفريد |
| page_key | VARCHAR | مفتاح الصفحة (مثل: articles) |
| title | VARCHAR | عنوان البانر |
| subtitle | TEXT | JSON يحتوي على: text, buttonText, overlayColor, textPosition |
| image_url | VARCHAR | رابط الصورة |
| link_url | VARCHAR | رابط الزر |
| is_enabled | BOOLEAN | حالة التفعيل |
| created_at | DATETIME | تاريخ الإنشاء |
| updated_at | DATETIME | تاريخ التحديث |

## ملاحظات

- الصور تُخزن في `/public/images/banners/` (ملفات ثابتة)
- يمكن استخدام روابط خارجية للصور
- البانر يُنشأ تلقائياً بقيم افتراضية عند أول طلب GET
