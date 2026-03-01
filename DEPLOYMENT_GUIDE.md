# دليل النشر على Vercel + PlanetScale

## 📊 إحصائيات البيانات الحالية

| الجدول | العدد |
|--------|-------|
| المحافظات | 27 |
| المدن | 198 |
| المستشفيات | 324 |
| العيادات | 35 |
| المعامل | 25 |
| الصيدليات | 59 |
| الأدوية | 29,606 |
| المقالات | 234 |
| تصنيفات المقالات | 98 |
| التخصصات | 21 |
| أنواع المستشفيات | 8 |
| الخدمات | 21 |
| المستخدمين | 1 |

---

## 🚀 خطوات النشر

### 1. إنشاء قاعدة بيانات PlanetScale

1. اذهب إلى [PlanetScale](https://planetscale.com)
2. أنشئ حساب جديد أو سجل دخول
3. أنشئ قاعدة بيانات جديدة باسم `mostshfa`
4. اختر المنطقة الأقرب (مثل `aws-eu-west-1`)
5. انسخ الـ Connection String

### 2. إعداد Vercel

1. اذهب إلى [Vercel](https://vercel.com)
2. اربط المشروع من GitHub
3. أضف Environment Variables:

```env
# قاعدة البيانات (من PlanetScale)
DATABASE_URL="mysql://username:password@host/mostshfa?sslaccept=strict"

# NextAuth
NEXTAUTH_URL="https://mostshfa.com"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# Google Services (اختياري)
NEXT_PUBLIC_ADSENSE_ID="ca-pub-xxxxxxxxxx"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GOOGLE_MAPS_KEY=""

# Site URL
NEXT_PUBLIC_SITE_URL="https://mostshfa.com"
```

### 3. تحديث Prisma Schema

قبل النشر، استبدل محتوى `prisma/schema.prisma` بمحتوى `prisma/schema.planetscale.prisma`:

```bash
# في Windows PowerShell
Copy-Item prisma/schema.planetscale.prisma prisma/schema.prisma -Force
```

### 4. نقل البيانات إلى PlanetScale

#### الخيار 1: استخدام Prisma Migrate

```bash
# تثبيت الاعتماديات
npm install

# إنشاء الجداول
npx prisma db push

# تشغيل سكريبت نقل البيانات
node scripts/migrate-to-planetscale.js
```

#### الخيار 2: تصدير واستيراد SQL

```bash
# تصدير البيانات من SQLite
node scripts/export-data.js

# استيراد إلى PlanetScale
# استخدم PlanetScale Console أو أداة MySQL
```

### 5. النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel --prod
```

---

## 📁 ملفات مهمة

- `prisma/schema.prisma` - Schema للتطوير المحلي (SQLite)
- `prisma/schema.planetscale.prisma` - Schema للإنتاج (MySQL/PlanetScale)
- `.env.local` - متغيرات البيئة المحلية
- `.env.example` - مثال على متغيرات البيئة

---

## 🔧 أوامر مفيدة

```bash
# تشغيل محلياً
npm run dev

# فحص قاعدة البيانات
node scripts/check-all-data.js

# إنشاء Prisma Client
npx prisma generate

# فتح Prisma Studio
npx prisma studio
```

---

## ⚠️ ملاحظات مهمة

1. **PlanetScale لا يدعم Foreign Keys** - لذلك نستخدم `relationMode = "prisma"` في schema
2. **تأكد من تحديث NEXTAUTH_SECRET** - استخدم قيمة عشوائية قوية
3. **احتفظ بنسخة احتياطية** من قاعدة البيانات المحلية قبل النشر

---

## 📞 الدعم

إذا واجهت أي مشاكل، تحقق من:
- سجلات Vercel
- PlanetScale Insights
- Prisma Studio للتحقق من البيانات
