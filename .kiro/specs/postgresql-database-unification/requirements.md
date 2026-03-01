# متطلبات توحيد قاعدة البيانات PostgreSQL

## نظرة عامة
إنشاء قاعدة بيانات PostgreSQL موحدة في `mostshfa_new` تجمع بين:
- البنية الحالية في mostshfa_new (SQLite + Prisma)
- المميزات المتقدمة من mostshfa_pro (Django + PostgreSQL)
- صفحة hospitals-pro المحسنة
- صفحة الأدوات الطبية الشاملة

## الأهداف الرئيسية

### 1. توحيد قاعدة البيانات
- **الهدف**: إنشاء schema PostgreSQL موحد يدعم جميع الكيانات الطبية
- **التقنية**: Prisma ORM مع PostgreSQL
- **المخرجات**: 
  - ملف schema.prisma محدث
  - ملفات migration للانتقال من SQLite إلى PostgreSQL
  - نصوص نقل البيانات

### 2. نقل صفحة hospitals-pro
- **المصدر**: `mostshfa_pro/frontend/src/app/hospitals-enhanced/page.tsx`
- **الهدف**: `mostshfa_new/src/app/hospitals-pro/page.tsx`
- **المميزات المطلوبة**:
  - نظام البحث المتقدم والفلاتر الذكية
  - عرض الخريطة التفاعلية
  - نظام المقارنة بين المستشفيات
  - نظام المفضلة والتقييمات
  - واجهة مستخدم محسنة مع animations

### 3. نقل صفحة الأدوات الطبية
- **المصدر**: `mostshfa_pro/frontend/src/app/tools/page.tsx`
- **الهدف**: `mostshfa_new/src/app/tools/page.tsx`
- **المميزات المطلوبة**:
  - مجموعة شاملة من الحاسبات الطبية
  - نظام تصنيف وفلترة الأدوات
  - واجهة تفاعلية لكل أداة
  - نظام التقييمات والإحصائيات
  - دعم متعدد اللغات (عربي/إنجليزي)

### 4. تحسين النظام الموحد
- **API موحد**: إنشاء API endpoints موحدة لجميع الكيانات
- **مكونات قابلة لإعادة الاستخدام**: تطوير مكونات React موحدة
- **نظام البحث**: تطبيق بحث موحد عبر جميع الكيانات
- **نظام التحليلات**: إضافة تتبع الاستخدام والإحصائيات

## المتطلبات التقنية

### قاعدة البيانات
- **النوع**: PostgreSQL 15+
- **ORM**: Prisma
- **المميزات المطلوبة**:
  - Full-text search للنصوص العربية
  - Indexing محسن للاستعلامات السريعة
  - JSON fields للبيانات المرنة
  - Spatial data للمواقع الجغرافية

### الجداول الجديدة المطلوبة

#### 1. جداول المحتوى الطبي
```prisma
model ArticleCategory {
  // توسيع الجدول الحالي
  parent        ArticleCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  parentId      Int?             @map("parent_id")
  children      ArticleCategory[] @relation("CategoryHierarchy")
  order         Int              @default(0)
  isActive      Boolean          @default(true) @map("is_active")
}

model ArticleTag {
  id          Int       @id @default(autoincrement())
  nameAr      String    @unique @map("name_ar")
  nameEn      String?   @map("name_en")
  slug        String    @unique
  color       String    @default("#10B981")
  usageCount  Int       @default(0) @map("usage_count")
  articles    Article[]
  createdAt   DateTime  @default(now()) @map("created_at")
  @@map("article_tags")
}

model MedicalTool {
  id                String            @id @default(uuid())
  nameAr            String            @map("name_ar")
  nameEn            String?           @map("name_en")
  slug              String            @unique
  descriptionAr     String            @map("description_ar")
  descriptionEn     String?           @map("description_en")
  toolType          ToolType          @map("tool_type")
  componentName     String            @map("component_name")
  config            Json              @default("{}")
  medicalSpecialties Json            @default("[]") @map("medical_specialties")
  targetConditions  Json              @default("[]") @map("target_conditions")
  accuracyLevel     AccuracyLevel     @map("accuracy_level")
  icon              String?
  featuredImage     String?           @map("featured_image")
  instructionsAr    String?           @map("instructions_ar")
  instructionsEn    String?           @map("instructions_en")
  usageCount        Int               @default(0) @map("usage_count")
  averageRating     Decimal           @default(0.00) @map("average_rating") @db.Decimal(3,2)
  ratingCount       Int               @default(0) @map("rating_count")
  isActive          Boolean           @default(true) @map("is_active")
  isFeatured        Boolean           @default(false) @map("is_featured")
  metaTitleAr       String?           @map("meta_title_ar")
  metaTitleEn       String?           @map("meta_title_en")
  metaDescriptionAr String?           @map("meta_description_ar")
  metaDescriptionEn String?           @map("meta_description_en")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  ratings           ToolRating[]
  @@map("medical_tools")
}

enum ToolType {
  calculator
  checker
  converter
  tracker
  assessment
}

enum AccuracyLevel {
  reference
  screening
  diagnostic
}
```

#### 2. جداول التقييمات والتفاعل
```prisma
model Rating {
  id          Int         @id @default(autoincrement())
  entityType  EntityType  @map("entity_type")
  entityId    Int         @map("entity_id")
  userIp      String      @map("user_ip")
  rating      Int         @db.SmallInt
  comment     String?
  isHelpful   Boolean?    @map("is_helpful")
  createdAt   DateTime    @default(now()) @map("created_at")
  @@unique([entityType, entityId, userIp])
  @@map("ratings")
}

model Favorite {
  id         Int        @id @default(autoincrement())
  entityType EntityType @map("entity_type")
  entityId   Int        @map("entity_id")
  userIp     String     @map("user_ip")
  createdAt  DateTime   @default(now()) @map("created_at")
  @@unique([entityType, entityId, userIp])
  @@map("favorites")
}

model ViewLog {
  id         Int        @id @default(autoincrement())
  entityType EntityType @map("entity_type")
  entityId   Int        @map("entity_id")
  userIp     String     @map("user_ip")
  userAgent  String?    @map("user_agent")
  referer    String?
  createdAt  DateTime   @default(now()) @map("created_at")
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("view_logs")
}

enum EntityType {
  hospital
  clinic
  lab
  pharmacy
  article
  tool
  drug
}
```

#### 3. جداول التحليلات والإحصائيات
```prisma
model Analytics {
  id            Int        @id @default(autoincrement())
  entityType    EntityType @map("entity_type")
  entityId      Int        @map("entity_id")
  date          DateTime   @db.Date
  views         Int        @default(0)
  uniqueViews   Int        @default(0) @map("unique_views")
  timeSpent     Int        @default(0) @map("time_spent")
  bounceRate    Decimal    @default(0.00) @map("bounce_rate") @db.Decimal(5,2)
  likes         Int        @default(0)
  shares        Int        @default(0)
  comments      Int        @default(0)
  directTraffic Int        @default(0) @map("direct_traffic")
  searchTraffic Int        @default(0) @map("search_traffic")
  socialTraffic Int        @default(0) @map("social_traffic")
  referralTraffic Int      @default(0) @map("referral_traffic")
  createdAt     DateTime   @default(now()) @map("created_at")
  @@unique([entityType, entityId, date])
  @@index([date])
  @@map("analytics")
}
```

### API Endpoints المطلوبة

#### 1. API المستشفيات المحسن
```typescript
// /api/hospitals-pro
GET    /api/hospitals-pro              // قائمة المستشفيات مع فلاتر متقدمة
GET    /api/hospitals-pro/[id]         // تفاصيل مستشفى محدد
POST   /api/hospitals-pro/[id]/rate    // تقييم مستشفى
POST   /api/hospitals-pro/[id]/favorite // إضافة/إزالة من المفضلة
GET    /api/hospitals-pro/compare      // مقارنة المستشفيات
GET    /api/hospitals-pro/map          // بيانات الخريطة
POST   /api/hospitals-pro/[id]/view    // تسجيل مشاهدة
```

#### 2. API الأدوات الطبية
```typescript
// /api/medical-tools
GET    /api/medical-tools              // قائمة الأدوات مع فلاتر
GET    /api/medical-tools/[slug]       // تفاصيل أداة محددة
POST   /api/medical-tools/[id]/use     // تسجيل استخدام أداة
POST   /api/medical-tools/[id]/rate    // تقييم أداة
GET    /api/medical-tools/categories   // فئات الأدوات
```

#### 3. API البحث الموحد
```typescript
// /api/search
GET    /api/search/universal           // بحث موحد عبر جميع الكيانات
GET    /api/search/suggestions         // اقتراحات البحث
GET    /api/search/filters             // فلاتر البحث المتاحة
```

### مكونات React المطلوبة

#### 1. مكونات المستشفيات المحسنة
- `HospitalProCard` - بطاقة مستشفى محسنة
- `HospitalProFilters` - فلاتر متقدمة
- `HospitalProMap` - خريطة تفاعلية
- `HospitalProComparison` - مقارنة المستشفيات
- `HospitalProSearch` - بحث ذكي

#### 2. مكونات الأدوات الطبية
- `MedicalToolCard` - بطاقة أداة طبية
- `MedicalToolModal` - نافذة الأداة التفاعلية
- `ToolCalculator` - حاسبات طبية مختلفة
- `ToolFilters` - فلاتر الأدوات
- `ToolRating` - نظام التقييم

#### 3. مكونات مشتركة
- `UniversalSearch` - بحث موحد
- `EntityCard` - بطاقة كيان عامة
- `RatingSystem` - نظام التقييم الموحد
- `FavoriteButton` - زر المفضلة
- `ShareButton` - زر المشاركة
- `ViewTracker` - تتبع المشاهدات

## معايير الأداء

### قاعدة البيانات
- **زمن الاستجابة**: < 100ms للاستعلامات البسيطة
- **الفهرسة**: فهارس محسنة لجميع الاستعلامات الشائعة
- **التخزين المؤقت**: Redis للبيانات المتكررة
- **النسخ الاحتياطي**: نسخ احتياطية يومية

### واجهة المستخدم
- **تحميل الصفحة**: < 2 ثانية
- **التفاعل**: < 100ms للإجراءات المحلية
- **البحث**: < 500ms للنتائج
- **الخريطة**: تحميل سلس للعلامات

## الأمان والخصوصية

### حماية البيانات
- تشفير البيانات الحساسة
- تنظيف مدخلات المستخدم
- حماية من SQL injection
- معدل محدود للطلبات (Rate limiting)

### الخصوصية
- عدم تخزين معلومات شخصية
- استخدام IP hashing للتتبع
- سياسة خصوصية واضحة
- موافقة المستخدم على الكوكيز

## خطة التنفيذ

### المرحلة 1: إعداد قاعدة البيانات (أسبوع 1)
1. إنشاء schema PostgreSQL الموحد
2. إعداد Prisma migrations
3. نقل البيانات الحالية
4. اختبار الأداء

### المرحلة 2: تطوير API (أسبوع 2)
1. إنشاء API endpoints الأساسية
2. تطبيق نظام التقييمات والمفضلة
3. إضافة البحث الموحد
4. تطبيق التحليلات

### المرحلة 3: تطوير واجهة المستشفيات (أسبوع 3)
1. نقل وتحسين صفحة hospitals-pro
2. تطوير المكونات التفاعلية
3. إضافة الخريطة والفلاتر
4. تطبيق نظام المقارنة

### المرحلة 4: تطوير صفحة الأدوات (أسبوع 4)
1. نقل صفحة الأدوات الطبية
2. تطوير الحاسبات التفاعلية
3. إضافة نظام التصنيف والفلترة
4. تطبيق التقييمات والإحصائيات

### المرحلة 5: الاختبار والتحسين (أسبوع 5)
1. اختبار الأداء والأمان
2. تحسين تجربة المستخدم
3. إضافة المميزات الإضافية
4. التوثيق والنشر

## معايير النجاح

### تقنية
- ✅ نقل ناجح لجميع البيانات
- ✅ أداء محسن (< 2s تحميل الصفحة)
- ✅ استقرار النظام (99.9% uptime)
- ✅ أمان محسن (لا توجد ثغرات)

### وظيفية
- ✅ جميع المميزات تعمل بشكل صحيح
- ✅ واجهة مستخدم سلسة ومتجاوبة
- ✅ بحث سريع ودقيق
- ✅ نظام تقييمات فعال

### تجربة المستخدم
- ✅ تحسن في معدل الاستخدام
- ✅ انخفاض معدل الارتداد
- ✅ زيادة وقت البقاء في الموقع
- ✅ تقييمات إيجابية من المستخدمين

## الصيانة والتطوير المستقبلي

### الصيانة الدورية
- مراقبة الأداء اليومية
- نسخ احتياطية أسبوعية
- تحديثات الأمان الشهرية
- مراجعة الكود الفصلية

### التطوير المستقبلي
- إضافة مميزات جديدة بناءً على ملاحظات المستخدمين
- تحسين خوارزميات البحث والتوصيات
- توسيع قاعدة البيانات لتشمل كيانات جديدة
- تطوير تطبيق موبايل مصاحب