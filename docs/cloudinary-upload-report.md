# تقرير كامل: رفع الصور إلى Cloudinary (متوافق مع Vercel + Next.js)

## 1) لماذا Cloudinary؟
- Vercel (Serverless) لا يدعم الكتابة الدائمة داخل `public/` وقت التشغيل.
- Cloudinary يوفر:
  - تخزين دائم
  - CDN سريع
  - روابط HTTPS
  - تحويلات (Transformations) وضغط تلقائي

## 2) إنشاء حساب وجلب المفاتيح
1) افتح Cloudinary Dashboard وأنشئ حسابًا مجانيًا.
2) من صفحة **Dashboard** ستجد:
- `Cloud name`
- `API Key`
- `API Secret`

## 3) إعداد متغيرات البيئة (Vercel Environment Variables)
في Vercel:
`Project` -> `Settings` -> `Environment Variables`

أضف المتغيرات التالية (في Production + Preview + Development حسب حاجتك):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

مهم:
- لا تضع `API_SECRET` في الواجهة (Client). يجب أن يبقى في السيرفر فقط.

## 4) الوضع الحالي في المشروع (المشكلة)
المسار الحالي للرفع:
- `src/app/api/admin/upload/route.ts`

يقوم بـ:
- إنشاء مجلد داخل `public/` ثم `fs.writeFile`

هذا يعمل محليًا، لكنه **يفشل على Vercel** لأن نظام الملفات ليس مخصصًا للحفظ الدائم.

## 5) التعديل المطلوب (الحل)
تعديل `/api/admin/upload` ليقوم بـ:
- استقبال `file` من `formData`
- رفعه إلى Cloudinary
- إرجاع رابط `secure_url`
- استخدام هذا الرابط لحفظه في قاعدة البيانات داخل الحقول مثل `bannerImage` أو `Article.image` أو `Drug.image`

## 6) اقتراح تنظيم المجلدات داخل Cloudinary
- بنرات الموقع: `mostshfa/banners`
- صور المقالات (إن تم تفعيلها لاحقًا): `mostshfa/articles`
- صور الأدوية (إن تم تفعيلها لاحقًا): `mostshfa/drugs`

## 7) Transformations مقترحة للبنرات (لتقليل الحجم والاستهلاك)
أثناء العرض (وليس شرطًا أثناء الرفع):
- `f_auto` اختيار أفضل صيغة تلقائيًا
- `q_auto` ضغط ذكي
- `c_fill,w_1920,h_600` مقاس مناسب لبنر

الهدف:
- صور أخف + تحميل أسرع + استهلاك أقل للباندويدث.

## 8) حدود المجاني وهل ستحتاج للدفع؟
- Cloudinary لديه خطة مجانية بحدود شهرية (تخزين/باندويدث/تحويلات).
- للبنرات فقط غالبًا **لن تحتاج للدفع** إلا إذا كان الترافيك مرتفعًا جدًا أو عدد الصور/التحويلات كبير.
- راقب الاستهلاك من Dashboard (Usage) لأن الأرقام قد تتغير حسب سياسة Cloudinary.

## 9) ملاحظات مهمة لأمان الاستخدام
- لا تستخدم `API_SECRET` في أي كود Client.
- يفضل تقييد مسار الرفع بحيث يكون Admin-only (حسب نظام التوثيق عندك).
- ضع حدًا للحجم (مثل 5MB) وأنواع الملفات (image/*) كما هو موجود حاليًا.

## 10) مشاكل شائعة وحلولها
- **401 / Invalid Signature**:
  - تأكد من مفاتيح Cloudinary في Vercel Env.
- **يرفع محليًا ويفشل على Vercel**:
  - السبب غالبًا هو الاعتماد على `fs` بدل Cloudinary.
- **الصورة لا تظهر عبر `<Image />`**:
  - قد تحتاج إضافة `res.cloudinary.com` إلى إعدادات `next.config.js` ضمن `images.domains` (حسب طريقة العرض).

## 11) أين تُحفظ صور المقالات والأدوية حاليًا؟
- **المقالات**: الحقل `Article.image` (String?) في قاعدة البيانات، والـAPI يرجعه كما هو.
- **الأدوية**: الحقل `Drug.image` (String?) في قاعدة البيانات، وصفحة الدواء تستخدمه في `EntityThumbnail`.
- في الواجهة `EntityImage` يدعم:
  - روابط `http/https`
  - مسارات محلية تبدأ بـ `/`
  - fallback افتراضي عند عدم وجود صورة

---

## المطلوب قبل التنفيذ البرمجي
- تحديد اسم مجلد Cloudinary النهائي للبنرات (مثل `mostshfa/banners`).
- تأكيد هل تريد الصور Public (غالبًا نعم).
