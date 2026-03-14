const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding articles...');

  // Create article category first
  const category = await prisma.articleCategory.upsert({
    where: { slug: 'health-tips' },
    update: {},
    create: {
      nameAr: 'نصائح صحية',
      nameEn: 'Health Tips',
      slug: 'health-tips',
      icon: '💡',
      color: '#10B981'
    }
  });

  const category2 = await prisma.articleCategory.upsert({
    where: { slug: 'diseases' },
    update: {},
    create: {
      nameAr: 'الأمراض',
      nameEn: 'Diseases',
      slug: 'diseases',
      icon: '🏥',
      color: '#EF4444'
    }
  });

  console.log('✅ Categories created');

  // Create sample articles
  const articles = [
    {
      title: 'أهمية شرب الماء للصحة العامة',
      slug: 'importance-of-drinking-water',
      excerpt: 'تعرف على فوائد شرب الماء وكمية الماء المناسبة يومياً للحفاظ على صحتك',
      content: `<h2>لماذا الماء مهم؟</h2>
<p>الماء ضروري لجميع وظائف الجسم الحيوية. يشكل الماء حوالي 60% من وزن الجسم البالغ.</p>
<h3>فوائد شرب الماء</h3>
<ul>
<li>تنظيم درجة حرارة الجسم</li>
<li>نقل المغذيات والأكسجين للخلايا</li>
<li>التخلص من السموم</li>
<li>تحسين وظائف الكلى</li>
<li>الحفاظ على صحة البشرة</li>
</ul>
<h3>كم كوب ماء يجب شربه يومياً؟</h3>
<p>ينصح الخبراء بشرب 8 أكواب من الماء يومياً على الأقل، أي ما يعادل 2 لتر تقريباً.</p>`,
      author: 'د. أحمد محمد',
      tags: 'ماء,صحة,نصائح,ترطيب',
      categoryId: category.id,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date()
    },
    {
      title: 'نصائح للنوم الصحي',
      slug: 'healthy-sleep-tips',
      excerpt: 'اكتشف أفضل النصائح للحصول على نوم هادئ ومريح',
      content: `<h2>أهمية النوم الجيد</h2>
<p>النوم الجيد ضروري لصحة الجسم والعقل. يحتاج البالغون إلى 7-9 ساعات من النوم يومياً.</p>
<h3>نصائح للنوم الأفضل</h3>
<ol>
<li>حافظ على موعد نوم ثابت</li>
<li>تجنب الكافيين قبل النوم</li>
<li>اجعل غرفة النوم مظلمة وهادئة</li>
<li>تجنب الشاشات قبل النوم بساعة</li>
<li>مارس الرياضة بانتظام</li>
</ol>`,
      author: 'د. سارة أحمد',
      tags: 'نوم,صحة,نصائح,راحة',
      categoryId: category.id,
      isPublished: true,
      publishedAt: new Date()
    },
    {
      title: 'ما هو مرض السكري؟',
      slug: 'what-is-diabetes',
      excerpt: 'دليل شامل عن مرض السكري وأنواعه وطرق الوقاية منه',
      content: `<h2>تعريف مرض السكري</h2>
<p>السكري هو مرض مزمن يحدث عندما يعجز البنكرياس عن إنتاج الأنسولين بكمية كافية، أو عندما يعجز الجسم عن استخدام الأنسولين بشكل فعال.</p>
<h3>أنواع السكري</h3>
<ul>
<li><strong>النوع الأول:</strong> يحدث عندما لا ينتج الجسم الأنسولين</li>
<li><strong>النوع الثاني:</strong> يحدث عندما لا يستخدم الجسم الأنسولين بشكل صحيح</li>
<li><strong>سكري الحمل:</strong> يظهر أثناء الحمل</li>
</ul>
<h3>أعراض السكري</h3>
<ul>
<li>العطش الشديد</li>
<li>كثرة التبول</li>
<li>فقدان الوزن غير المبرر</li>
<li>التعب والإرهاق</li>
</ul>`,
      author: 'د. محمد علي',
      tags: 'سكري,أمراض,صحة,وقاية',
      categoryId: category2.id,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date()
    },
    {
      title: 'فوائد المشي اليومي',
      slug: 'benefits-of-daily-walking',
      excerpt: 'تعرف على الفوائد الصحية المذهلة للمشي 30 دقيقة يومياً',
      content: `<h2>المشي أفضل رياضة</h2>
<p>المشي من أسهل وأفضل التمارين الرياضية التي يمكن ممارستها في أي وقت ومكان.</p>
<h3>فوائد المشي</h3>
<ul>
<li>تحسين صحة القلب</li>
<li>خفض ضغط الدم</li>
<li>تقوية العضلات والعظام</li>
<li>تحسين المزاج</li>
<li>المساعدة في إنقاص الوزن</li>
</ul>`,
      author: 'د. فاطمة حسن',
      tags: 'مشي,رياضة,صحة,لياقة',
      categoryId: category.id,
      isPublished: true,
      publishedAt: new Date()
    }
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: article,
      create: article
    });
  }

  console.log(`✅ Created ${articles.length} articles`);

  // Verify
  const count = await prisma.article.count();
  console.log(`📊 Total articles in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
