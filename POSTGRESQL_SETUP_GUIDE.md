# دليل إعداد PostgreSQL للمشروع الموحد

## نظرة عامة
هذا الدليل يوضح كيفية إعداد قاعدة البيانات PostgreSQL الموحدة التي تجمع بين مميزات mostshfa_new و mostshfa_pro.

## المتطلبات الأساسية

### 1. تثبيت PostgreSQL
```bash
# Windows
# تحميل من: https://www.postgresql.org/download/windows/

# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. تثبيت Node.js Dependencies
```bash
npm install
# أو
yarn install
```

## الإعداد السريع

### 1. تشغيل Script الإعداد التلقائي
```bash
npm run setup:postgresql
```

هذا الأمر سيقوم بـ:
- التحقق من تثبيت PostgreSQL
- إنشاء قاعدة البيانات
- تطبيق المخطط (Schema)
- إضافة البيانات الأولية

### 2. نقل البيانات من SQLite (اختياري)
إذا كان لديك بيانات في قاعدة SQLite السابقة:
```bash
npm run migrate:sqlite-to-postgresql
```

## الإعداد اليدوي

### 1. إعداد قاعدة البيانات
```sql
-- الاتصال بـ PostgreSQL
psql -U postgres

-- إنشاء قاعدة البيانات
CREATE DATABASE mostshfa_new;

-- إنشاء مستخدم (اختياري)
CREATE USER mostshfa_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mostshfa_new TO mostshfa_user;
```

### 2. تحديث ملف .env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mostshfa_new?schema=public"
```

### 3. تطبيق المخطط
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. إضافة البيانات الأولية
```bash
npm run db:seed
```

## هيكل قاعدة البيانات الموحدة

### الجداول الأساسية
- `governorates` - المحافظات
- `cities` - المدن
- `hospital_types` - أنواع المستشفيات
- `specialties` - التخصصات الطبية
- `hospitals` - المستشفيات (محسن)
- `clinics` - العيادات
- `labs` - المختبرات
- `pharmacies` - الصيدليات
- `drugs` - الأدوية
- `drug_categories` - فئات الأدوية

### الجداول الجديدة للنظام المحسن
- `medical_tools` - الأدوات الطبية
- `article_tags` - علامات المقالات
- `article_tag_relations` - ربط المقالات بالعلامات
- `health_tips` - النصائح الصحية
- `ratings` - التقييمات الموحدة
- `favorites` - المفضلة الموحدة
- `view_logs` - سجل المشاهدات
- `analytics` - التحليلات والإحصائيات

### التحسينات على الجداول الموجودة
- إضافة حقول البحث النصي
- إضافة البيانات الوصفية (metadata)
- إضافة معلومات إضافية للمستشفيات
- تحسين الفهرسة للأداء

## API Endpoints الجديدة

### المستشفيات المحسنة
```
GET /api/hospitals-pro
- فلاتر متقدمة
- بحث جغرافي
- ترتيب ذكي
- إحصائيات شاملة
```

### الأدوات الطبية
```
GET /api/medical-tools
- فلترة حسب النوع والتخصص
- تتبع الاستخدام
- نظام التقييمات
- إحصائيات الشعبية
```

### البحث الموحد
```
GET /api/search/universal
- بحث عبر جميع الكيانات
- اقتراحات ذكية
- فلاتر ديناميكية
- ترتيب حسب الصلة
```

## الأوامر المفيدة

### إدارة قاعدة البيانات
```bash
# عرض قاعدة البيانات في المتصفح
npm run db:studio

# تطبيق تغييرات المخطط
npm run db:migrate

# إعادة تعيين قاعدة البيانات
npm run db:reset

# إضافة بيانات تجريبية
npm run db:seed
```

### التطوير
```bash
# تشغيل الخادم المحلي
npm run dev

# بناء المشروع
npm run build

# تشغيل الإنتاج
npm run start
```

## استكشاف الأخطاء

### مشاكل الاتصال
```bash
# التحقق من تشغيل PostgreSQL
sudo systemctl status postgresql

# اختبار الاتصال
psql -U postgres -d mostshfa_new -c "SELECT 1;"
```

### مشاكل المخطط
```bash
# إعادة إنشاء المخطط
npx prisma migrate reset
npx prisma migrate dev
```

### مشاكل الأداء
```bash
# تحليل الاستعلامات البطيئة
# في PostgreSQL:
# EXPLAIN ANALYZE SELECT ...
```

## الأمان والأداء

### إعدادات الأمان
- استخدام كلمات مرور قوية
- تقييد الوصول للشبكة
- تشفير الاتصالات
- نسخ احتياطية منتظمة

### تحسين الأداء
- فهرسة محسنة للبحث
- تجميع الاستعلامات
- تخزين مؤقت للنتائج
- مراقبة الأداء

## النشر في الإنتاج

### Vercel + Vercel PostgreSQL
```bash
# ربط المشروع بـ Vercel
vercel link

# إضافة قاعدة البيانات
vercel env add DATABASE_URL

# نشر المشروع
vercel --prod
```

### Supabase
```bash
# إنشاء مشروع على Supabase
# نسخ connection string
# تحديث متغيرات البيئة
```

## الدعم والمساعدة

### الموارد المفيدة
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### المشاكل الشائعة
1. **خطأ في الاتصال**: تحقق من DATABASE_URL
2. **مشاكل المخطط**: شغّل prisma migrate reset
3. **بطء الأداء**: تحقق من الفهارس
4. **مشاكل الترميز**: تأكد من UTF-8 encoding

## الخطوات التالية

بعد إعداد قاعدة البيانات بنجاح:

1. **تطوير صفحة المستشفيات المحسنة**
   ```bash
   # إنشاء المكونات والصفحات
   ```

2. **تطوير صفحة الأدوات الطبية**
   ```bash
   # إضافة الحاسبات والأدوات التفاعلية
   ```

3. **تطبيق النظام الموحد**
   ```bash
   # ربط جميع المكونات معاً
   ```

4. **الاختبار والتحسين**
   ```bash
   # اختبار الأداء والوظائف
   ```

---

**ملاحظة**: هذا الدليل جزء من مشروع توحيد قاعدة البيانات. للمزيد من التفاصيل، راجع ملفات المواصفات في `.kiro/specs/postgresql-database-unification/`.