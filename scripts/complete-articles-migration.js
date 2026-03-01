/**
 * سكريبت شامل لنقل المقالات مع دعم الصور المحلية
 * 
 * المهام:
 * 1. مسح المقالات التجريبية القديمة
 * 2. نقل جميع المقالات من قاعدة البيانات القديمة
 * 3. نقل التصنيفات
 * 4. إعداد مسارات الصور المحلية
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

// مسارات الصور
const IMAGE_PATHS = {
  // الصور من الموقع القديم
  OLD_SITE_BASE: 'https://mostshfa.com/uploads/',
  
  // مسارات الصور المحلية الجديدة
  LOCAL_BASE: '/images/',
  
  // المجلدات الفرعية حسب الأقسام
  FOLDERS: {
    articles: '/images/articles/',
    hospitals: '/images/hospitals/',
    clinics: '/images/clinics/',
    labs: '/images/labs/',
    pharmacies: '/images/pharmacies/',
    drugs: '/images/drugs/',
    staff: '/images/staff/',
    general: '/images/general/'
  }
};

// صور Unsplash الافتراضية للمقالات الطبية
const DEFAULT_MEDICAL_IMAGES = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800',
  'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800'
];

async function main() {
  console.log('🚀 بدء عملية نقل المقالات الشاملة...\n');
  console.log('='.repeat(60));
  
  try {
    // الخطوة 1: مسح المقالات التجريبية
    await clearTestArticles();
    
    // الخطوة 2: قراءة ملف SQL
    console.log('\n📖 قراءة قاعدة البيانات القديمة...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ تم قراءة الملف بنجاح');
    
    // الخطوة 3: استخراج ونقل التصنيفات
    const categoryMap = await migrateCategories(sqlContent);
    
    // الخطوة 4: استخراج ونقل المقالات
    await migrateArticles(sqlContent, categoryMap);
    
    // الخطوة 5: إنشاء هيكل مجلدات الصور
    await createImageFolders();
    
    // الخطوة 6: عرض الإحصائيات النهائية
    await showFinalStats();
    
    // الخطوة 7: عرض دليل مسارات الصور
    showImagePathsGuide();
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * مسح المقالات التجريبية القديمة
 */
async function clearTestArticles() {
  console.log('\n🗑️ مسح المقالات التجريبية القديمة...');
  
  const countBefore = await prisma.article.count();
  console.log(`  📊 عدد المقالات قبل المسح: ${countBefore}`);
  
  // مسح جميع المقالات الموجودة
  await prisma.article.deleteMany({});
  
  console.log('  ✅ تم مسح جميع المقالات التجريبية');
}

/**
 * نقل التصنيفات من قاعدة البيانات القديمة
 */
async function migrateCategories(sqlContent) {
  console.log('\n📁 نقل التصنيفات...');
  
  const categories = extractCategories(sqlContent);
  console.log(`  📊 تم العثور على ${categories.length} تصنيف`);
  
  const categoryMap = {};
  let created = 0, updated = 0;
  
  for (const cat of categories) {
    try {
      const slug = cat.slug || generateSlug(cat.name);
      
      const result = await prisma.articleCategory.upsert({
        where: { slug },
        update: { 
          nameAr: cat.name,
          nameEn: cat.name
        },
        create: {
          nameAr: cat.name,
          nameEn: cat.name,
          slug,
          icon: getCategoryIcon(cat.name),
          color: getCategoryColor(cat.id)
        }
      });
      
      categoryMap[cat.id] = result.id;
      
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    } catch (e) {
      // تجاهل الأخطاء المكررة
    }
  }
  
  // إنشاء تصنيف افتراضي
  let defaultCategory = await prisma.articleCategory.findFirst({
    where: { slug: 'general' }
  });
  
  if (!defaultCategory) {
    defaultCategory = await prisma.articleCategory.create({
      data: {
        nameAr: 'مقالات عامة',
        nameEn: 'General',
        slug: 'general',
        icon: '📄',
        color: '#6B7280'
      }
    });
  }
  
  categoryMap['default'] = defaultCategory.id;
  
  console.log(`  ✅ تم إنشاء ${created} تصنيف جديد`);
  console.log(`  🔄 تم تحديث ${updated} تصنيف`);
  
  return categoryMap;
}

/**
 * نقل المقالات من قاعدة البيانات القديمة
 */
async function migrateArticles(sqlContent, categoryMap) {
  console.log('\n📝 نقل المقالات...');
  
  const articles = extractArticles(sqlContent);
  console.log(`  📊 تم العثور على ${articles.length} مقال في القاعدة القديمة`);
  
  let success = 0, errors = 0;
  const errorDetails = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    try {
      // التحقق من عدم وجود المقال
      const exists = await prisma.article.findUnique({
        where: { slug: article.slug }
      });
      
      if (exists) {
        continue;
      }
      
      // معالجة الصورة
      let imageUrl = processImageUrl(article.image, article.id);
      
      // إنشاء المقال
      await prisma.article.create({
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || article.title.substring(0, 200),
          content: article.content || '',
          image: imageUrl,
          author: article.author || 'فريق التحرير',
          tags: article.tags || '',
          views: parseInt(article.views) || 0,
          isFeatured: false,
          isPublished: article.status === 'published',
          categoryId: categoryMap[article.category_id] || categoryMap['default'],
          publishedAt: new Date()
        }
      });
      
      success++;
      
      // عرض التقدم
      if (success % 25 === 0) {
        console.log(`  ⏳ تم نقل ${success} مقال...`);
      }
      
    } catch (error) {
      errors++;
      errorDetails.push({
        title: article.title?.substring(0, 50),
        error: error.message
      });
    }
  }
  
  console.log(`\n  ✅ تم نقل ${success} مقال بنجاح`);
  
  if (errors > 0) {
    console.log(`  ⚠️ فشل نقل ${errors} مقال`);
  }
}

/**
 * معالجة رابط الصورة
 */
function processImageUrl(imageField, articleId) {
  // إذا لم توجد صورة، استخدم صورة افتراضية
  if (!imageField || imageField === 'NULL' || imageField === 'null' || imageField.trim() === '') {
    return DEFAULT_MEDICAL_IMAGES[articleId % DEFAULT_MEDICAL_IMAGES.length];
  }
  
  // إذا كانت الصورة رابط كامل
  if (imageField.startsWith('http')) {
    // تحويل الروابط المحلية القديمة
    if (imageField.includes('localhost')) {
      return imageField.replace('http://localhost/mostshfa', 'https://mostshfa.com');
    }
    return imageField;
  }
  
  // إذا كانت الصورة مسار محلي
  // يمكن استخدامها كمسار محلي في المشروع الجديد
  // أو تحويلها لرابط من الموقع القديم
  
  // للصور المحلية: /images/articles/filename.jpg
  // للصور من الموقع القديم: https://mostshfa.com/uploads/articles/filename.jpg
  
  return `https://mostshfa.com/uploads/articles/${imageField}`;
}

/**
 * إنشاء هيكل مجلدات الصور
 */
async function createImageFolders() {
  console.log('\n📂 إنشاء هيكل مجلدات الصور...');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const imagesDir = path.join(publicDir, 'images');
  
  const folders = [
    'images',
    'images/articles',
    'images/hospitals',
    'images/clinics',
    'images/labs',
    'images/pharmacies',
    'images/drugs',
    'images/staff',
    'images/general'
  ];
  
  for (const folder of folders) {
    const folderPath = path.join(publicDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`  ✅ تم إنشاء: ${folder}`);
    } else {
      console.log(`  📁 موجود: ${folder}`);
    }
  }
  
  // إنشاء ملف README في مجلد الصور
  const readmePath = path.join(imagesDir, 'README.md');
  const readmeContent = `# مجلد الصور المحلية

## هيكل المجلدات

\`\`\`
public/images/
├── articles/      # صور المقالات
├── hospitals/     # صور المستشفيات
├── clinics/       # صور العيادات
├── labs/          # صور المعامل
├── pharmacies/    # صور الصيدليات
├── drugs/         # صور الأدوية
├── staff/         # صور الأطباء والموظفين
└── general/       # صور عامة
\`\`\`

## كيفية إضافة صور محلية

1. ضع الصورة في المجلد المناسب
2. استخدم المسار في قاعدة البيانات: \`/images/articles/my-image.jpg\`

## تنسيقات الصور المدعومة
- JPG/JPEG
- PNG
- WebP (مفضل للأداء)
- SVG (للأيقونات)

## أحجام الصور الموصى بها
- صور المقالات: 800x450 بكسل
- صور المستشفيات: 600x400 بكسل
- صور الأطباء: 300x300 بكسل
- الشعارات: 200x200 بكسل
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log('  📄 تم إنشاء ملف README.md');
}

/**
 * عرض الإحصائيات النهائية
 */
async function showFinalStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 الإحصائيات النهائية:');
  console.log('='.repeat(60));
  
  const stats = {
    articles: await prisma.article.count(),
    categories: await prisma.articleCategory.count(),
    hospitals: await prisma.hospital.count(),
    clinics: await prisma.clinic.count(),
    labs: await prisma.lab.count(),
    pharmacies: await prisma.pharmacy.count(),
    drugs: await prisma.drug.count()
  };
  
  console.log(`
  📝 المقالات:     ${stats.articles}
  📁 التصنيفات:    ${stats.categories}
  🏥 المستشفيات:   ${stats.hospitals}
  🏨 العيادات:     ${stats.clinics}
  🔬 المعامل:      ${stats.labs}
  💊 الصيدليات:    ${stats.pharmacies}
  💉 الأدوية:      ${stats.drugs}
  `);
  
  // إحصائيات الصور
  const articlesWithImages = await prisma.article.count({
    where: {
      image: { not: null }
    }
  });
  
  console.log(`  🖼️ مقالات مع صور: ${articlesWithImages}/${stats.articles}`);
}

/**
 * عرض دليل مسارات الصور
 */
function showImagePathsGuide() {
  console.log('\n' + '='.repeat(60));
  console.log('📍 دليل مسارات الصور المحلية:');
  console.log('='.repeat(60));
  
  console.log(`
  المسار الأساسي: public/images/
  
  📂 المجلدات الفرعية:
  ├── articles/      → /images/articles/
  ├── hospitals/     → /images/hospitals/
  ├── clinics/       → /images/clinics/
  ├── labs/          → /images/labs/
  ├── pharmacies/    → /images/pharmacies/
  ├── drugs/         → /images/drugs/
  ├── staff/         → /images/staff/
  └── general/       → /images/general/
  
  📝 مثال للاستخدام:
  - ضع الصورة في: public/images/articles/my-article.jpg
  - استخدم في قاعدة البيانات: /images/articles/my-article.jpg
  
  🔗 الصور من الموقع القديم:
  - المسار: https://mostshfa.com/uploads/articles/
  `);
}

// ==================== دوال مساعدة ====================

function extractArticles(sql) {
  const articles = [];
  
  // البحث عن INSERT للمقالات
  const insertRegex = /INSERT INTO `articles`\s*\([^)]+\)\s*VALUES\s*/gi;
  let match;
  
  while ((match = insertRegex.exec(sql)) !== null) {
    const startIndex = match.index + match[0].length;
    
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let currentRow = '';
    let i = startIndex;
    
    while (i < sql.length) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        currentRow += char;
      } else if (inString && char === stringChar) {
        if (nextChar === stringChar) {
          currentRow += char + nextChar;
          i++;
        } else {
          inString = false;
          currentRow += char;
        }
      } else if (!inString && char === '(') {
        depth++;
        if (depth === 1) currentRow = '';
        else currentRow += char;
      } else if (!inString && char === ')') {
        depth--;
        if (depth === 0) {
          const parsed = parseArticleRow(currentRow);
          if (parsed && parsed.title && parsed.slug) {
            articles.push(parsed);
          }
          currentRow = '';
        } else {
          currentRow += char;
        }
      } else if (!inString && char === ';') {
        break;
      } else if (depth > 0) {
        currentRow += char;
      }
      i++;
    }
  }
  
  return articles;
}

function parseArticleRow(row) {
  try {
    const values = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        if (nextChar === stringChar) {
          current += char;
          i++;
        } else {
          inString = false;
        }
      } else if (!inString && char === ',') {
        values.push(cleanValue(current.trim()));
        current = '';
        continue;
      } else {
        current += char;
      }
    }
    values.push(cleanValue(current.trim()));
    
    // الحقول حسب هيكل الجدول:
    // id, category_id, author_id, title, slug, content, rewritten_content, 
    // read_time, view_count, likes, favorites_count, status, seo_title, 
    // seo_description, created_at, updated_at, image, tags, postby_admin, 
    // meta_keywords, last_indexed, og_title, og_image
    
    if (values.length >= 17) {
      return {
        id: parseInt(values[0]) || 0,
        category_id: parseInt(values[1]) || null,
        author_id: parseInt(values[2]) || null,
        title: values[3] || '',
        slug: values[4] || '',
        content: values[5] || '',
        views: parseInt(values[8]) || 0,
        status: values[11] || 'published',
        excerpt: values[13] || null,
        image: values[16] || null,
        tags: values[17] || null,
        author: values[18] || null
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractCategories(sql) {
  const categories = [];
  const regex = /INSERT INTO `article_categories`\s*\([^)]+\)\s*VALUES\s*([^;]+);/gi;
  const match = regex.exec(sql);
  
  if (match) {
    const valuesStr = match[1];
    const rowRegex = /\((\d+),\s*'([^']+)',\s*'([^']+)'/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
      categories.push({
        id: parseInt(rowMatch[1]),
        name: rowMatch[2],
        slug: rowMatch[3]
      });
    }
  }
  
  return categories;
}

function cleanValue(val) {
  if (!val || val === 'NULL' || val === 'null') return null;
  return val
    .replace(/^['"]|['"]$/g, '')
    .replace(/''/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .trim();
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getCategoryIcon(name) {
  const icons = {
    'صحة': '❤️',
    'تغذية': '🥗',
    'رياضة': '🏃',
    'نفسية': '🧠',
    'أطفال': '👶',
    'حمل': '🤰',
    'أمراض': '🏥',
    'أدوية': '💊',
    'جمال': '✨',
    'عيون': '👁️',
    'أسنان': '🦷',
    'قلب': '❤️‍🩹'
  };
  
  for (const [key, icon] of Object.entries(icons)) {
    if (name.includes(key)) return icon;
  }
  return '📄';
}

function getCategoryColor(id) {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];
  return colors[id % colors.length];
}

// تشغيل السكريبت
main();
