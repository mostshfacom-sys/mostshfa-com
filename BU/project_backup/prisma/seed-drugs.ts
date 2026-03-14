
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const drugCategories = [
  {
    name: 'المضادات الحيوية',
    drugs: [
      {
        nameAr: 'أوجمنتين 1 جم',
        nameEn: 'Augmentin 1gm',
        slug: 'augmentin-1gm-tablet',
        activeIngredient: 'Amoxicillin + Clavulanic Acid',
        priceText: '89.75 ج.م',
        usage: 'علاج الالتهابات البكتيرية في الجهاز التنفسي، المسالك البولية، والجلد.',
        dosage: 'قرص واحد كل 12 ساعة لمدة 7 أيام أو حسب إرشادات الطبيب.',
        contraindications: 'الحساسية للبنسلين، مشاكل الكبد السابقة مع الدواء.',
        image: '/images/drugs/augmentin.png'
      },
      {
        nameAr: 'سيبروسين 500 مجم',
        nameEn: 'Ciprocin 500mg',
        slug: 'ciprocin-500mg',
        activeIngredient: 'Ciprofloxacin',
        priceText: '33.00 ج.م',
        usage: 'علاج التهابات المسالك البولية، والتهابات البروستاتا.',
        dosage: 'قرص كل 12 ساعة.',
        contraindications: 'الحمل، الرضاعة، الأطفال أقل من 18 سنة.',
        image: '/images/drugs/ciprocin.png'
      },
      {
        nameAr: 'زيثروماكس 250 مجم',
        nameEn: 'Zithromax 250mg',
        slug: 'zithromax-250mg',
        activeIngredient: 'Azithromycin',
        priceText: '79.00 ج.م',
        usage: 'علاج التهابات الجهاز التنفسي العلوي والسفلي.',
        dosage: 'كبسولة واحدة يومياً لمدة 3-5 أيام.',
        contraindications: 'الحساسية لمكونات الدواء.',
        image: '/images/drugs/zithromax.png'
      }
    ]
  },
  {
    name: 'مسكنات ومضادات الالتهاب',
    drugs: [
      {
        nameAr: 'بانادول إكسترا',
        nameEn: 'Panadol Extra',
        slug: 'panadol-extra',
        activeIngredient: 'Paracetamol + Caffeine',
        priceText: '35.00 ج.م',
        usage: 'مسكن للآلام الخفيفة والمتوسطة، خافض للحرارة.',
        dosage: 'قرصين كل 6-8 ساعات عند اللزوم.',
        contraindications: 'الحساسية للباراسيتامول، مشاكل الكبد الشديدة.',
        image: '/images/drugs/panadol-extra.png'
      },
      {
        nameAr: 'كتافلام 50 مجم',
        nameEn: 'Cataflam 50mg',
        slug: 'cataflam-50mg',
        activeIngredient: 'Diclofenac Potassium',
        priceText: '55.50 ج.م',
        usage: 'مسكن للآلام، مضاد للالتهابات، آلام الأسنان والدورة الشهرية.',
        dosage: 'قرص كل 8 ساعات بعد الأكل.',
        contraindications: 'قرحة المعدة، مرضى الربو، الحساسية للاسبرين.',
        image: '/images/drugs/cataflam.png'
      },
      {
        nameAr: 'بروفين 600 مجم',
        nameEn: 'Brufen 600mg',
        slug: 'brufen-600mg',
        activeIngredient: 'Ibuprofen',
        priceText: '40.00 ج.م',
        usage: 'مسكن للألم، مضاد للالتهاب، خافض للحرارة.',
        dosage: 'قرص 3 مرات يومياً بعد الأكل.',
        contraindications: 'قرحة المعدة النشطة، الحمل في الشهور الأخيرة.',
        image: '/images/drugs/brufen.png'
      }
    ]
  },
  {
    name: 'أدوية الجهاز الهضمي',
    drugs: [
      {
        nameAr: 'انتينال',
        nameEn: 'Antinal',
        slug: 'antinal-capsules',
        activeIngredient: 'Nifuroxazide',
        priceText: '27.00 ج.م',
        usage: 'مطهر معوي واسع المدى، علاج الإسهال.',
        dosage: 'كبسولة 4 مرات يومياً.',
        contraindications: 'الحساسية للمادة الفعالة.',
        image: '/images/drugs/antinal.png'
      },
      {
        nameAr: 'كونترولوك 40 مجم',
        nameEn: 'Controloc 40mg',
        slug: 'controloc-40mg',
        activeIngredient: 'Pantoprazole',
        priceText: '110.00 ج.م',
        usage: 'علاج ارتجاع المريء، قرحة المعدة والاثنى عشر.',
        dosage: 'قرص واحد يومياً قبل الإفطار.',
        contraindications: 'الحساسية لمثبطات مضخة البروتون.',
        image: '/images/drugs/controloc.png'
      },
      {
        nameAr: 'جافيسكون شراب',
        nameEn: 'Gaviscon Syrup',
        slug: 'gaviscon-syrup',
        activeIngredient: 'Sodium Alginate',
        priceText: '65.00 ج.م',
        usage: 'علاج حرقة المعدة وعسر الهضم.',
        dosage: '10-20 مل بعد الأكل وقبل النوم.',
        contraindications: 'مرضى الفينيل كيتون يوريا.',
        image: '/images/drugs/gaviscon.png'
      }
    ]
  },
  {
    name: 'فيتامينات ومكملات غذائية',
    drugs: [
      {
        nameAr: 'سنتروم',
        nameEn: 'Centrum',
        slug: 'centrum-multivitamin',
        activeIngredient: 'Multivitamins + Minerals',
        priceText: '180.00 ج.م',
        usage: 'مكمل غذائي عام لتعزيز الصحة والمناعة.',
        dosage: 'قرص واحد يومياً مع الطعام.',
        contraindications: 'زيادة نسبة الحديد أو الفيتامينات في الجسم.',
        image: '/images/drugs/centrum.png'
      },
      {
        nameAr: 'نيوروتون',
        nameEn: 'Neuroton',
        slug: 'neuroton-tablets',
        activeIngredient: 'Vitamin B Complex',
        priceText: '45.00 ج.م',
        usage: 'التهاب الأعصاب، نقص فيتامين ب.',
        dosage: 'قرص واحد 3 مرات يومياً.',
        contraindications: 'الحساسية لأي من المكونات.',
        image: '/images/drugs/neuroton.png'
      },
      {
        nameAr: 'اوستيوكير',
        nameEn: 'Osteocare',
        slug: 'osteocare-tablets',
        activeIngredient: 'Calcium + Magnesium + Vitamin D3',
        priceText: '68.00 ج.م',
        usage: 'مكمل غذائي للكالسيوم، صحة العظام.',
        dosage: '2 قرص يومياً.',
        contraindications: 'زيادة الكالسيوم في الدم، حصوات الكلى.',
        image: '/images/drugs/osteocare.png'
      }
    ]
  },
  {
    name: 'أدوية البرد والأنفلونزا',
    drugs: [
      {
        nameAr: 'كومتركس',
        nameEn: 'Comtrex',
        slug: 'comtrex-tablets',
        activeIngredient: 'Acetaminophen + Pseudoephedrine + Brompheniramine',
        priceText: '30.00 ج.م',
        usage: 'علاج نزلات البرد، الرشح، احتقان الجيوب الأنفية.',
        dosage: 'قرصين كل 6 ساعات.',
        contraindications: 'ارتفاع ضغط الدم، مرضى القلب.',
        image: '/images/drugs/comtrex.png'
      },
      {
        nameAr: 'كونجستال',
        nameEn: 'Congestal',
        slug: 'congestal-tablets',
        activeIngredient: 'Paracetamol + Pseudoephedrine + Chlorpheniramine',
        priceText: '26.00 ج.م',
        usage: 'علاج أعراض البرد والأنفلونزا.',
        dosage: 'قرص واحد 3 مرات يومياً.',
        contraindications: 'الحمل، الرضاعة، ارتفاع ضغط الدم.',
        image: '/images/drugs/congestal.png'
      },
      {
        nameAr: 'وان تو ثري',
        nameEn: '123',
        slug: '123-tablets',
        activeIngredient: 'Paracetamol + Pseudoephedrine + Chlorpheniramine',
        priceText: '24.00 ج.م',
        usage: 'تخفيف أعراض البرد والرشح.',
        dosage: 'قرص كل 6 ساعات.',
        contraindications: 'مرضى الضغط والقلب.',
        image: '/images/drugs/123.png'
      }
    ]
  }
];

async function main() {
  console.log('Start seeding drugs...');

  for (const categoryData of drugCategories) {
    // Create or update category
    const category = await prisma.drugCategory.upsert({
      where: { name: categoryData.name },
      update: {},
      create: { name: categoryData.name },
    });

    console.log(`Created/Updated category: ${category.name}`);

    for (const drugData of categoryData.drugs) {
      await prisma.drug.upsert({
        where: { slug: drugData.slug },
        update: {
          nameAr: drugData.nameAr,
          nameEn: drugData.nameEn,
          activeIngredient: drugData.activeIngredient,
          priceText: drugData.priceText,
          usage: drugData.usage,
          dosage: drugData.dosage,
          contraindications: drugData.contraindications,
          categoryId: category.id,
          // image: drugData.image // Commented out until we have real images or logic to handle them
        },
        create: {
          nameAr: drugData.nameAr,
          nameEn: drugData.nameEn,
          slug: drugData.slug,
          activeIngredient: drugData.activeIngredient,
          priceText: drugData.priceText,
          usage: drugData.usage,
          dosage: drugData.dosage,
          contraindications: drugData.contraindications,
          categoryId: category.id,
          // image: drugData.image
        },
      });
      console.log(`  - Processed drug: ${drugData.nameAr}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
