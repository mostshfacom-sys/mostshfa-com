/**
 * سكريبت نقل المقالات من قاعدة البيانات القديمة (MySQL) إلى الجديدة (SQLite/Prisma)
 * 
 * يقرأ من ملف SQL ويستخرج المقالات ثم يضيفها لقاعدة البيانات الجديدة
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// مسار ملف SQL القديم
const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

// رابط الصور الأساسي
const IMAGE_BASE_URL = 'https://mostshfa.com/uploads/articles/';

async function migrateArticles() {
  console.log('🚀 بدء نقل المقالات من قاعدة البيانات القديمة...\n');
  
  try {
    // قراءة ملف SQL
    console.log('📖 قراءة ملف SQL...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // استخراج بيانات المقالات من INSERT statements
    const articles = extractArticlesFromSQL(sqlContent);
    console.log(`✅ تم العثور على ${articles.length} مقال\n`);
    
    if (articles.length === 0) {
      console.log('❌ لم يتم العثور على مقالات في ملف SQL');
      return;
    }
    
    // استخراج التصنيفات أولاً
    const categories = extractCategoriesFromSQL(sqlContent);
    console.log(`📁 تم العثور على ${categories.length} تصنيف\n`);
    
    // إنشاء التصنيفات
    console.log('📁 إنشاء التصنيفات...');
    const categoryMap = {};
    for (const cat of categories) {
      try {
        const created = await prisma.articleCategory.upsert({
          where: { slug: cat.slug },
          update: {
            nameAr: cat.name,
          },
          create: {
            nameAr: cat.name,
            nameEn: cat.name,
            slug: cat.slug,
            icon: '📄',
            color: '#3B82F6'
          }
        });
        categoryMap[cat.id] = created.id;
        console.log(`  ✓ ${cat.name}`);
      } catch (e) {
        console.log(`  ✗ خطأ في التصنيف ${cat.name}: ${e.message}`);
      }
    }
    
    // إنشاء تصنيف افتراضي إذا لم يوجد
    let defaultCategory = await prisma.articleCategory.findFirst();
    if (!defaultCategory) {
      defaultCategory = await prisma.articleCategory.create({
        data: {
          nameAr: 'مقالات عامة',
          nameEn: 'General Articles',
          slug: 'general',
          icon: '📄',
          color: '#6B7280'
        }
      });
    }
    
    // إضافة المقالات
    console.log('\n📝 إضافة المقالات...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const article of articles) {
      try {
        // التحقق من وجود المقال
        const existing = await prisma.article.findUnique({
          where: { slug: article.slug }
        });
        
        if (existing) {
          skipCount++;
          continue;
        }
        
        // تحديد التصنيف
        const categoryId = categoryMap[article.category_id] || defaultCategory.id;
        
        // بناء رابط الصورة الكامل
        let imageUrl = null;
        if (article.image) {
          // إذا كانت الصورة اسم ملف فقط، أضف الرابط الأساسي
          if (!article.image.startsWith('http')) {
            imageUrl = IMAGE_BASE_URL + article.image;
          } else {
            imageUrl = article.image;
          }
        }
        
        await prisma.article.create({
          data: {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || article.seo_description || article.title.substring(0, 150),
            content: article.content,
            image: imageUrl,
            author: article.author || article.postby_admin || 'فريق التحرير',
            tags: article.tags || '',
            views: article.views || 0,
            isFeatured: article.is_featured || false,
            isPublished: article.status === 'published',
            categoryId: categoryId,
            publishedAt: new Date()
          }
        });
        
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ✓ تم إضافة ${successCount} مقال...`);
        }
      } catch (e) {
        errorCount++;
        if (errorCount <= 5) {
          console.log(`  ✗ خطأ في المقال "${article.title}": ${e.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ملخص النقل:');
    console.log(`  ✅ تم إضافة: ${successCount} مقال`);
    console.log(`  ⏭️ تم تخطي (موجود): ${skipCount} مقال`);
    console.log(`  ❌ أخطاء: ${errorCount} مقال`);
    console.log('='.repeat(50));
    
    // عرض إحصائيات نهائية
    const totalArticles = await prisma.article.count();
    const totalCategories = await prisma.articleCategory.count();
    console.log(`\n📈 الإجمالي في قاعدة البيانات:`);
    console.log(`  - المقالات: ${totalArticles}`);
    console.log(`  - التصنيفات: ${totalCategories}`);
    
    // عرض بعض المقالات مع الصور
    const articlesWithImages = await prisma.article.findMany({
      where: { image: { not: null } },
      take: 5,
      select: { title: true, image: true }
    });
    console.log('\n🖼️ أمثلة على المقالات مع الصور:');
    articlesWithImages.forEach(a => {
      console.log(`  - ${a.title.substring(0, 40)}... => ${a.image}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * استخراج المقالات من محتوى SQL
 */
function extractArticlesFromSQL(sqlContent) {
  const articles = [];
  
  // البحث عن INSERT INTO articles بشكل أكثر دقة
  // الصيغة: INSERT INTO `articles` (...) VALUES (...), (...), ...;
  const insertMatch = sqlContent.match(/INSERT INTO [`']?articles[`']?\s*\([^)]+\)\s*VALUES\s*([\s\S]*?)(?=INSERT INTO|CREATE TABLE|ALTER TABLE|$)/i);
  
  if (!insertMatch) {
    console.log('لم يتم العثور على INSERT statements للمقالات');
    return articles;
  }
  
  const valuesSection = insertMatch[1];
  
  // استخراج كل صف من البيانات
  // نبحث عن النمط: (id, category_id, ..., 'value', ..., NULL, ...)
  const rowRegex = /\((\d+),\s*(\d+),\s*(\d+),\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*([^,]*),\s*([^,]*),\s*(\d+),\s*(\d+),\s*(\d+),\s*'([^']*)',\s*([^,]*),\s*([^,]*),\s*'([^']*)',\s*'([^']*)',\s*([^,]*),\s*([^,]*),\s*([^,]*),\s*([^,]*),\s*([^,]*),\s*([^,]*),\s*([^)]*)\)/g;
  
  let match;
  while ((match = rowRegex.exec(valuesSection)) !== null) {
    try {
      const article = {
        id: parseInt(match[1]),
        category_id: parseInt(match[2]),
        author_id: parseInt(match[3]),
        title: unescapeSQL(match[4]),
        slug: unescapeSQL(match[5]),
        content: unescapeSQL(match[6]),
        rewritten_content: match[7] === 'NULL' ? null : unescapeSQL(match[7]),
        read_time: match[8] === 'NULL' ? null : parseInt(match[8]),
        views: parseInt(match[9]) || 0,
        likes: parseInt(match[10]) || 0,
        favorites_count: parseInt(match[11]) || 0,
        status: unescapeSQL(match[12]) || 'published',
        seo_title: match[13] === 'NULL' ? null : unescapeSQL(match[13]),
        seo_description: match[14] === 'NULL' ? null : unescapeSQL(match[14]),
        created_at: match[15],
        updated_at: match[16],
        image: match[17] === 'NULL' ? null : unescapeSQL(match[17].replace(/^'|'$/g, '')),
        tags: match[18] === 'NULL' ? null : unescapeSQL(match[18].replace(/^'|'$/g, '')),
        postby_admin: match[19] === 'NULL' ? null : unescapeSQL(match[19]),
        meta_keywords: match[20] === 'NULL' ? null : unescapeSQL(match[20]),
        is_featured: false
      };
      
      if (article.title && article.slug) {
        articles.push(article);
      }
    } catch (e) {
      // تجاهل الأخطاء في التحليل
    }
  }
  
  // إذا لم نجد مقالات بالطريقة الأولى، نجرب طريقة أبسط
  if (articles.length === 0) {
    console.log('جاري تجربة طريقة بديلة لاستخراج المقالات...');
    return extractArticlesSimple(sqlContent);
  }
  
  return articles;
}

/**
 * طريقة بديلة أبسط لاستخراج المقالات
 */
function extractArticlesSimple(sqlContent) {
  const articles = [];
  
  // البحث عن كل INSERT VALUES للمقالات
  const lines = sqlContent.split('\n');
  let inArticlesInsert = false;
  let currentValues = '';
  
  for (const line of lines) {
    if (line.includes('INSERT INTO `articles`') || line.includes("INSERT INTO 'articles'")) {
      inArticlesInsert = true;
      currentValues = line;
      continue;
    }
    
    if (inArticlesInsert) {
      currentValues += line;
      
      // إذا وصلنا لنهاية الـ INSERT
      if (line.includes(';')) {
        // استخراج القيم
        const valuesMatch = currentValues.match(/VALUES\s*([\s\S]*);/i);
        if (valuesMatch) {
          const rows = extractRows(valuesMatch[1]);
          for (const row of rows) {
            if (row.title && row.slug) {
              articles.push(row);
            }
          }
        }
        inArticlesInsert = false;
        currentValues = '';
      }
    }
  }
  
  return articles;
}

/**
 * استخراج الصفوف من قسم VALUES
 */
function extractRows(valuesStr) {
  const rows = [];
  let depth = 0;
  let currentRow = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    
    if (escaped) {
      currentRow += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      currentRow += char;
      continue;
    }
    
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      currentRow += char;
      continue;
    }
    
    if (inString && char === stringChar) {
      // تحقق من التكرار المزدوج للاقتباس
      if (i + 1 < valuesStr.length && valuesStr[i + 1] === stringChar) {
        currentRow += char;
        i++;
        currentRow += valuesStr[i];
        continue;
      }
      inString = false;
      currentRow += char;
      continue;
    }
    
    if (!inString) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          currentRow = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          // نهاية صف
          const parsed = parseArticleRow(currentRow);
          if (parsed) {
            rows.push(parsed);
          }
          currentRow = '';
          continue;
        }
      }
    }
    
    if (depth > 0) {
      currentRow += char;
    }
  }
  
  return rows;
}

/**
 * تحليل صف مقال واحد
 */
function parseArticleRow(rowStr) {
  try {
    const values = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let escaped = false;
    
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (inString && char === stringChar) {
        if (i + 1 < rowStr.length && rowStr[i + 1] === stringChar) {
          current += char;
          i++;
          continue;
        }
        inString = false;
        continue;
      }
      
      if (!inString && char === ',') {
        values.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      values.push(current.trim());
    }
    
    if (values.length >= 17) {
      return {
        id: parseInt(values[0]) || 0,
        category_id: parseInt(values[1]) || null,
        author_id: parseInt(values[2]) || null,
        title: cleanValue(values[3]),
        slug: cleanValue(values[4]),
        content: cleanValue(values[5]),
        rewritten_content: cleanValue(values[6]),
        read_time: parseInt(values[7]) || null,
        views: parseInt(values[8]) || 0,
        likes: parseInt(values[9]) || 0,
        favorites_count: parseInt(values[10]) || 0,
        status: cleanValue(values[11]) || 'published',
        seo_title: cleanValue(values[12]),
        seo_description: cleanValue(values[13]),
        created_at: cleanValue(values[14]),
        updated_at: cleanValue(values[15]),
        image: cleanValue(values[16]),
        tags: values[17] ? cleanValue(values[17]) : null,
        postby_admin: values[18] ? cleanValue(values[18]) : null,
        is_featured: false
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * تنظيف قيمة SQL
 */
function cleanValue(val) {
  if (!val || val === 'NULL' || val === 'null') return null;
  return val
    .replace(/^['"]|['"]$/g, '')
    .replace(/''/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .trim();
}

/**
 * إزالة escape من SQL
 */
function unescapeSQL(str) {
  if (!str || str === 'NULL') return null;
  return str
    .replace(/''/g, "'")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .trim();
}

/**
 * استخراج التصنيفات من محتوى SQL
 */
function extractCategoriesFromSQL(sqlContent) {
  const categories = [];
  
  // البحث عن INSERT INTO article_categories
  const insertMatch = sqlContent.match(/INSERT INTO [`']?article_categories[`']?\s*\([^)]+\)\s*VALUES\s*([\s\S]*?)(?=INSERT INTO|CREATE TABLE|ALTER TABLE|;)/i);
  
  if (!insertMatch) {
    return categories;
  }
  
  const valuesSection = insertMatch[1];
  
  // استخراج كل صف
  let depth = 0;
  let currentRow = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];
    
    if (escaped) {
      currentRow += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      currentRow += char;
      continue;
    }
    
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      currentRow += char;
      continue;
    }
    
    if (inString && char === stringChar) {
      if (i + 1 < valuesSection.length && valuesSection[i + 1] === stringChar) {
        currentRow += char;
        i++;
        currentRow += valuesSection[i];
        continue;
      }
      inString = false;
      currentRow += char;
      continue;
    }
    
    if (!inString) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          currentRow = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          // تحليل الصف
          const values = currentRow.split(',').map(v => cleanValue(v.trim()));
          if (values.length >= 3) {
            categories.push({
              id: parseInt(values[0]) || 0,
              name: values[1] || 'تصنيف',
              slug: values[2] || `category-${values[0]}`
            });
          }
          currentRow = '';
          continue;
        }
      }
    }
    
    if (depth > 0) {
      currentRow += char;
    }
  }
  
  return categories;
}

// تشغيل السكريبت
migrateArticles();
