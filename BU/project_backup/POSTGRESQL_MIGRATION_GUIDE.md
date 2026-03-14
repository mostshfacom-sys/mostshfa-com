# دليل الانتقال إلى PostgreSQL

## نظرة عامة 🎯

هذا الدليل يوضح كيفية الانتقال من SQLite إلى PostgreSQL في مشروع mostshfa_new مع الحفاظ على جميع البيانات والمميزات.

## الحالة الحالية ✅

- **النظام**: يعمل بكفاءة عالية مع SQLite
- **APIs**: 7 endpoints متقدمة تعمل بنجاح
- **البيانات**: 387 مستشفى، 27 محافظة، 198 مدينة
- **المميزات**: بحث ذكي، فلاتر متقدمة، إحصائيات تفاعلية

## لماذا PostgreSQL؟ 🚀

### المزايا
- **أداء أفضل**: استعلامات أسرع للبيانات الكبيرة
- **بحث نصي متقدم**: دعم أفضل للنصوص العربية
- **مرونة أكبر**: دعم JSON وأنواع بيانات متقدمة
- **قابلية التوسع**: مناسب للإنتاج والنمو المستقبلي
- **ميزات متقدمة**: فهرسة ذكية، تحليلات، نسخ احتياطي

### متطلبات النظام
- PostgreSQL 12+ مثبت
- Node.js 18+
- npm أو yarn
- 2GB RAM على الأقل
- 5GB مساحة تخزين

## خطوات الانتقال 📋

### الخطوة 1: تثبيت PostgreSQL

#### Windows
```bash
# باستخدام winget
winget install PostgreSQL.PostgreSQL

# أو تحميل من الموقع الرسمي
# https://www.postgresql.org/download/windows/
```

#### macOS
```bash
# باستخدام Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### الخطوة 2: إعداد قاعدة البيانات

```bash
# تشغيل script الإعداد الكامل
npm run setup:postgresql:complete
```

هذا الأمر سيقوم بـ:
- ✅ التحقق من وجود PostgreSQL
- ✅ إنشاء قاعدة البيانات
- ✅ تحديث ملف البيئة
- ✅ تحديث Prisma Schema
- ✅ إنشاء Migrations
- ✅ نقل البيانات من SQLite
- ✅ اختبار الاتصال

### الخطوة 3: التحقق من النقل

```bash
# اختبار النظام الجديد
npm run test:postgresql

# اختبار APIs
npm run test:apis

# فتح Prisma Studio
npm run db:studio
```

### الخطوة 4: تشغيل النظام

```bash
# تشغيل الخادم
npm run dev

# فتح المتصفح
# http://localhost:3001
```

## الإعدادات المطلوبة ⚙️

### ملف البيئة (.env.local)
```env
# PostgreSQL Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/mostshfa_new?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="local-dev-secret-key-12345"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3001"
```

### إعدادات PostgreSQL
```sql
-- إنشاء المستخدم (اختياري)
CREATE USER mostshfa_user WITH PASSWORD 'secure_password';

-- إنشاء قاعدة البيانات
CREATE DATABASE mostshfa_new OWNER mostshfa_user;

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE mostshfa_new TO mostshfa_user;
```

## الاختبارات والتحقق 🧪

### 1. اختبار الاتصال
```bash
# اختبار الاتصال بقاعدة البيانات
npx prisma db push
```

### 2. اختبار البيانات
```bash
# فحص عدد السجلات
npm run test:postgresql
```

### 3. اختبار APIs
```bash
# اختبار جميع APIs
npm run test:apis
```

### 4. اختبار الواجهة
- افتح http://localhost:3001
- اختبر البحث والفلاتر
- تأكد من عمل الإحصائيات
- اختبر صفحة المستشفيات

## استكشاف الأخطاء 🔧

### خطأ في الاتصال
```bash
# التحقق من تشغيل PostgreSQL
# Windows
net start postgresql-x64-14

# macOS/Linux
sudo systemctl status postgresql
```

### خطأ في كلمة المرور
```bash
# إعادة تعيين كلمة مرور postgres
sudo -u postgres psql
\password postgres
```

### خطأ في الصلاحيات
```sql
-- منح صلاحيات إضافية
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### خطأ في Migration
```bash
# إعادة تعيين Migrations
npx prisma migrate reset
npx prisma migrate dev --name init
```

## الأوامر المفيدة 📝

### إدارة قاعدة البيانات
```bash
# إنشاء migration جديد
npx prisma migrate dev --name migration_name

# تطبيق migrations في الإنتاج
npx prisma migrate deploy

# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# فتح Prisma Studio
npx prisma studio
```

### النسخ الاحتياطي
```bash
# إنشاء نسخة احتياطية
pg_dump -U postgres -h localhost mostshfa_new > backup.sql

# استعادة من نسخة احتياطية
psql -U postgres -h localhost mostshfa_new < backup.sql
```

### مراقبة الأداء
```sql
-- عرض الاستعلامات البطيئة
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- عرض حجم الجداول
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## التحسينات المقترحة 🚀

### 1. فهرسة محسنة
```sql
-- فهارس للبحث النصي العربي
CREATE INDEX idx_hospitals_search_ar ON hospitals USING gin(to_tsvector('arabic', name_ar));
CREATE INDEX idx_hospitals_search_en ON hospitals USING gin(to_tsvector('english', name_en));

-- فهارس مركبة للفلاتر
CREATE INDEX idx_hospitals_filters ON hospitals(governorate_id, city_id, type_id, has_emergency);
```

### 2. تحسين الاستعلامات
```sql
-- إحصائيات الجداول
ANALYZE hospitals;
ANALYZE governorates;
ANALYZE cities;
```

### 3. إعدادات الأداء
```sql
-- في postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

## الفوائد المتوقعة 📈

### الأداء
- **سرعة البحث**: تحسن 3-5x في استعلامات البحث
- **الفلاتر**: استجابة أسرع للفلاتر المعقدة
- **الإحصائيات**: حساب أسرع للإحصائيات

### المرونة
- **البحث النصي**: دعم أفضل للعربية
- **JSON**: استعلامات متقدمة على البيانات المرنة
- **التحليلات**: إمكانيات تحليل متقدمة

### القابلية للتوسع
- **المستخدمون المتزامنون**: دعم أفضل للحمولة العالية
- **حجم البيانات**: أداء مستقر مع نمو البيانات
- **النسخ الاحتياطي**: أدوات احترافية للنسخ

## الخطوات التالية 🎯

### المرحلة القادمة
1. **تحسين الأداء**: إضافة فهارس متقدمة
2. **البحث النصي**: تطبيق Full-Text Search
3. **التحليلات**: لوحة تحكم للإحصائيات
4. **النسخ الاحتياطي**: نظام نسخ تلقائي

### التطوير المستقبلي
- **التخزين المؤقت**: Redis للبيانات المتكررة
- **البحث المتقدم**: Elasticsearch للبحث المعقد
- **التوزيع**: إعداد Master-Slave للإنتاج
- **المراقبة**: أدوات مراقبة الأداء

## الدعم والمساعدة 🆘

### الموارد المفيدة
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

### الأخطاء الشائعة
1. **خطأ الاتصال**: تأكد من تشغيل PostgreSQL
2. **خطأ الصلاحيات**: تحقق من صلاحيات المستخدم
3. **خطأ Migration**: استخدم `prisma migrate reset`
4. **بطء الأداء**: أضف فهارس مناسبة

---

**ملاحظة**: هذا الانتقال اختياري. النظام يعمل بكفاءة عالية مع SQLite حالياً، لكن PostgreSQL سيوفر مزايا إضافية للنمو المستقبلي.