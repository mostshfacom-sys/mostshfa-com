/**
 * سكريبت شامل لنقل جميع المقالات من قاعدة البيانات القديمة
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const sqlFilePath = path.join(__dirname, '..', '..', 'DB', 'mostshfa_db(19).sql');

// رابط الصور الأساسي
const IMAGE_BASE_URL = 'https://mostshfa.com/uploads/articles/';

async function migrateArticles() {
  console.log('🚀 بدء نقل المقالات من قاعدة البيانات القديمة...\n');
  
  try {
    const content = fs.readFileSync(sqlFilePath, 'utf8');
    
    // استخراج المقالات
    const articles = extractArticles(content);
    console.log(`✅ تم العثور على ${articles.length} مقال\n`);
    
    if (articles.length === 0) {
      console.log('❌ لم يتم العثور على مقالات');
      return;
    }
    
    // استخراج التصنيفات
    const categories = extractCategories(content);
    console.log(`📁 تم العثور على ${categories.length} تصنيف\n`);
    
    // إنشاء التصنيفات
    const categoryMap = {};
    for (const cat of categories) {
      try {
        const created = await prisma.articleCategory.upsert({
          where: { slug: cat.slug || `cat-${cat.id}` },
          update: { nameAr: cat.name },
          create: {
            nameAr: cat.name,
            nameEn: cat.name,
            slug: cat.slug || `cat-${cat.id}`,
            icon: '📄',
            color: '#3B82F6'
          }
        });
        categoryMap[cat.id] = created.id;
      } catch (e) {
        // تجاهل الأخطاء
      }
    }
    
    // تصنيف افتراضي
    let defaultCategory = await prisma.articleCategory.findFirst();
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
    
    // إضافة المقالات
    console.log('📝 إضافة المقالات...\n');
    let success = 0, skip = 0, error = 0;
    
    for (const article of articles) {
      try {
        // تحقق من الوجود
        const exists = await prisma.article.findUnique({
          where: { slug: article.slug }
        });
        
        if (exists) {
          skip++;
          continue;
        }
        
        // بناء رابط الصورة
        let imageUrl = null;
        if (article.image && article.image !== 'NULL') {
          if (article.image.startsWith('http')) {
            imageUrl = article.image.replace('http://localhost/mostshfa', 'https://mostshfa.com');
          } else {
            imageUrl = IMAGE_BASE_URL + article.image;
          }
        }
        
        await prisma.article.create({
          data: {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || article.title.substring(0, 150),
            content: article.content,
            image: imageUrl,
            author: article.author || 'فريق التحرير',
            tags: article.tags || '',
            views: article.views || 0,
            isFeatured: false,
            isPublished: article.status === 'published',
            categoryId: categoryMap[article.category_id] || defaultCategory.id,
            publishedAt: new Date()
          }
        });
        
        success++;
        if (success % 20 === 0) {
          console.log(`  ✓ تم إضافة ${success} مقال...`);
        }
      } catch (e) {
        error++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ملخص النقل:');
    console.log(`  ✅ تم إضافة: ${success} مقال`);
    console.log(`  ⏭️ تم تخطي: ${skip} مقال`);
    console.log(`  ❌ أخطاء: ${error} مقال`);
    
    const total = await prisma.article.count();
    console.log(`\n📈 إجمالي المقالات الآن: ${total}`);
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

function extractArticles(sql) {
  const articles = [];
  
  // البحث عن كل INSERT للمقالات
  const insertRegex = /INSERT INTO `articles`\s*\([^)]+\)\s*VALUES\s*/gi;
  let match;
  let startIndex = 0;
  
  while ((match = insertRegex.exec(sql)) !== null) {
    startIndex = match.index + match[0].length;
    
    // استخراج القيم
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
          const parsed = parseRow(currentRow);
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

function parseRow(row) {
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
        image: values[16] || null,
        tags: values[17] || null,
        author: values[18] || null,
        excerpt: values[13] || null
      };
    }
    return null;
  } catch (e) {
    return null;
  }
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

migrateArticles();
