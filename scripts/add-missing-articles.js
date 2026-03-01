const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingArticles() {
  console.log('Adding missing articles...\n');
  
  try {
    // Get or create category
    let category = await prisma.articleCategory.findFirst();
    if (!category) {
      category = await prisma.articleCategory.create({
        data: {
          nameAr: 'نصائح صحية',
          nameEn: 'Health Tips',
          slug: 'health-tips'
        }
      });
    }
    
    const articles = [
      {
        slug: 'importance-of-regular-checkups',
        title: 'أهمية الفحوصات الدورية',
        excerpt: 'تعرف على أهمية إجراء الفحوصات الطبية الدورية للحفاظ على صحتك والكشف المبكر عن الأمراض',
        content: `<h2>لماذا الفحوصات الدورية مهمة؟</h2>
<p>الفحوصات الطبية الدورية هي أحد أهم الخطوات للحفاظ على صحتك. تساعد هذه الفحوصات في:</p>
<ul>
<li>الكشف المبكر عن الأمراض قبل تفاقمها</li>
<li>متابعة الحالة الصحية العامة</li>
<li>تقييم عوامل الخطر</li>
<li>تحديث التطعيمات اللازمة</li>
</ul>
<h2>متى يجب إجراء الفحوصات؟</h2>
<p>يُنصح بإجراء فحص طبي شامل مرة واحدة على الأقل سنوياً، وقد تحتاج لفحوصات أكثر تكراراً حسب عمرك وحالتك الصحية.</p>`,
        author: 'د. أحمد محمد',
        categoryId: category.id,
        isPublished: true,
        views: 0
      },
      {
        slug: 'how-to-choose-doctor',
        title: 'كيف تختار الطبيب المناسب؟',
        excerpt: 'دليل شامل لاختيار الطبيب المناسب لحالتك الصحية',
        content: `<h2>معايير اختيار الطبيب</h2>
<p>اختيار الطبيب المناسب قرار مهم يؤثر على صحتك. إليك أهم المعايير:</p>
<ul>
<li><strong>التخصص:</strong> تأكد من أن الطبيب متخصص في المجال الذي تحتاجه</li>
<li><strong>الخبرة:</strong> ابحث عن طبيب ذو خبرة كافية</li>
<li><strong>السمعة:</strong> اسأل عن تجارب المرضى السابقين</li>
<li><strong>الموقع:</strong> اختر طبيباً في موقع مناسب لك</li>
</ul>
<h2>نصائح إضافية</h2>
<p>لا تتردد في طرح الأسئلة على الطبيب، وتأكد من شعورك بالراحة معه.</p>`,
        author: 'د. سارة أحمد',
        categoryId: category.id,
        isPublished: true,
        views: 0
      },
      {
        slug: 'vitamin-d-deficiency',
        title: 'نقص فيتامين د: الأعراض والعلاج',
        excerpt: 'تعرف على أعراض نقص فيتامين د وطرق العلاج والوقاية',
        content: `<h2>ما هو فيتامين د؟</h2>
<p>فيتامين د هو فيتامين ضروري لصحة العظام والجهاز المناعي. يُعرف بـ"فيتامين الشمس" لأن الجسم ينتجه عند التعرض لأشعة الشمس.</p>
<h2>أعراض نقص فيتامين د</h2>
<ul>
<li>التعب والإرهاق المستمر</li>
<li>آلام العظام والعضلات</li>
<li>ضعف المناعة</li>
<li>تساقط الشعر</li>
<li>الاكتئاب</li>
</ul>
<h2>طرق العلاج</h2>
<p>يمكن علاج نقص فيتامين د من خلال:</p>
<ul>
<li>التعرض لأشعة الشمس بشكل منتظم</li>
<li>تناول الأطعمة الغنية بفيتامين د</li>
<li>المكملات الغذائية حسب توصية الطبيب</li>
</ul>`,
        author: 'د. محمد علي',
        categoryId: category.id,
        isPublished: true,
        views: 0
      }
    ];
    
    for (const article of articles) {
      // Check if article already exists
      const existing = await prisma.article.findUnique({
        where: { slug: article.slug }
      });
      
      if (existing) {
        console.log(`Article "${article.slug}" already exists, skipping...`);
        continue;
      }
      
      await prisma.article.create({
        data: article
      });
      console.log(`Created article: ${article.title}`);
    }
    
    console.log('\nDone! All articles added.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingArticles();
