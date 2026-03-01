/**
 * سكريبت لإصلاح صور المقالات الخارجية
 * يحول الصور من mostshfa.com إلى صور افتراضية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_ARTICLE_IMAGE = '/images/defaults/article.svg';

async function main() {
  console.log('📰 إصلاح صور المقالات الخارجية...\n');
  
  // جلب المقالات مع صور خارجية من mostshfa.com
  const articles = await prisma.article.findMany({
    where: {
      image: {
        contains: 'mostshfa.com'
      }
    },
    select: { id: true, title: true, image: true }
  });
  
  console.log(`وجدت ${articles.length} مقال بصور من mostshfa.com`);
  
  // تحديث جميع هذه المقالات لاستخدام الصورة الافتراضية
  const result = await prisma.article.updateMany({
    where: {
      image: {
        contains: 'mostshfa.com'
      }
    },
    data: {
      image: DEFAULT_ARTICLE_IMAGE
    }
  });
  
  console.log(`✅ تم تحديث ${result.count} مقال`);
  
  // إحصائيات نهائية
  const stats = {
    total: await prisma.article.count(),
    withDefault: await prisma.article.count({ where: { image: DEFAULT_ARTICLE_IMAGE } }),
    withExternal: await prisma.article.count({ where: { image: { startsWith: 'http' } } }),
    withLocal: await prisma.article.count({ where: { image: { startsWith: '/' } } }),
  };
  
  console.log('\n📊 إحصائيات المقالات:');
  console.log(`   إجمالي: ${stats.total}`);
  console.log(`   بصور افتراضية: ${stats.withDefault}`);
  console.log(`   بصور خارجية: ${stats.withExternal}`);
  console.log(`   بصور محلية: ${stats.withLocal}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
