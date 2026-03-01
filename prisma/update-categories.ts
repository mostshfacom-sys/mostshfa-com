
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryMap: Record<string, string> = {
  // General Categories
  'cold products': 'أدوية البرد والأنفلونزا',
  'antipyretic': 'خافض للحرارة',
  'analgesic': 'مسكن للألم',
  'antibiotic': 'مضاد حيوي',
  'antibiotics': 'مضاد حيوي',
  'anti-infective': 'مضاد للعدوى',
  'vitamins': 'فيتامينات ومكملات',
  'vitamin': 'فيتامينات ومكملات',
  'minerals': 'معادن',
  'supplement': 'مكمل غذائي',
  'nutrition': 'تغذية علاجية',
  'amino acid': 'أحماض أمينية',
  'amino acids': 'أحماض أمينية',
  'albumin': 'ألبومين',
  'alpha amylase': 'ألفا أميليز',
  'enzyme': 'إنزيمات',
  
  // Systems
  'git': 'أدوية الجهاز الهضمي',
  'gastrointestinal': 'أدوية الجهاز الهضمي',
  'cardiovascular': 'أدوية القلب والأوعية الدموية',
  'hypertension': 'أدوية الضغط',
  'hypotension': 'أدوية الضغط المنخفض',
  'anti tachycardia': 'علاج تسارع ضربات القلب',
  'alpha and beta adrenergic agonist': 'منشطات ألفا وبيتا',
  'diabetes': 'أدوية السكر',
  'endocrine': 'أدوية الغدد الصماء',
  'dermatological': 'أدوية جلدية',
  'skin': 'أدوية جلدية',
  'anti-acne': 'علاج حب الشباب',
  'anti hair loss': 'علاج تساقط الشعر',
  'respiratory': 'أدوية الجهاز التنفسي',
  'cns': 'أدوية الجهاز العصبي',
  'neurology': 'أدوية الأعصاب',
  'musculoskeletal': 'أدوية العظام والعضلات',
  'nsaid': 'مضادات الالتهاب غير الستيرويدية',
  'ophthalmic': 'قطرات ومراهم للعين',
  'eye': 'أدوية العين',
  'dental': 'أدوية الأسنان',
  'oral care': 'العناية بالفم',
  'urology': 'أدوية المسالك البولية',
  'hormones': 'هرمونات',
  'oncology': 'أدوية الأورام',
  'cancer': 'أدوية الأورام',
  'psychiatry': 'أدوية نفسية',
  'rheumatology': 'أدوية الروماتيزم',
  'gynecology': 'أدوية النساء والولادة',
  'obstetrics': 'أدوية النساء والولادة',
  'pediatrics': 'أدوية الأطفال',
  'ent': 'أنف وأذن وحنجرة',
  'allergy': 'أدوية الحساسية',
  'ant allergic': 'مضاد للحساسية',
  
  'antineoplastic': 'أدوية الأورام',
  'chemotherapy': 'علاج كيماوي',
  'cytotoxic': 'علاج كيماوي',
  'hormonal therapy': 'علاج هرموني',
  'immunotherapy': 'علاج مناعي',
  'target therapy': 'علاج موجه',
  'kinase inhibitor': 'مثبطات الكيناز',
  'monoclonal antibody': 'أجسام مضادة وحيدة النسيلة',
  'antimetabolite': 'مضاد للأيض',
  'alkylating agent': 'عامل مؤلكل',
  'antimitotic': 'مضاد للانقسام',
  'topoisomerase inhibitor': 'مثبط التوبويزوميراز',
  'hormone antagonist': 'مضاد للهرمونات',
  'aromatase inhibitor': 'مثبط الأروماتاز',
  'antiandrogen': 'مضاد للأندروجين',
  'antiestrogen': 'مضاد للإستروجين',
  'lhrh agonist': 'ناهضات LHRH',
  'bisphosphonate': 'بيسفوسفونات',
  'bone resorption inhibitor': 'مثبط ارتشاف العظم',
  'calcium supplement': 'مكمل كالسيوم',
  'vitamin d': 'فيتامين د',
  'hematopoietic growth factor': 'عامل نمو مكون للدم',
  'colony stimulating factor': 'عامل تحفيز المستعمرات',
  'erythropoiesis stimulating agent': 'محفز تكوين الكريات الحمر',
  'thrombopoietin receptor agonist': 'ناهض مستقبل الثرومبوبويتين',
  'interferon': 'إنترفيرون',
  'interleukin': 'إنترلوكين',
  'vaccine': 'لقاح',
  'toxoid': 'ذوفان',
  'immunoglobulin': 'جلوبيولين مناعي',
  'antivenom': 'مضاد للسموم',
  'antitoxin': 'مضاد للسموم',
  'diagnostic agent': 'عامل تشخيصي',
  'contrast medium': 'وسط تباين',
  'radiopharmaceutical': 'مستحضرات صيدلانية مشعة',
  'surgical aid': 'مساعد جراحي',
  'medical device': 'جهاز طبي',
  'disinfectant': 'مطهر',
  'antiseptic': 'معقم',
  'sterilant': 'معقم',
  'preservative': 'مادة حافظة',
  'pharmaceutical aid': 'مساعد صيدلاني',
  'vehicle': 'سواغ',
  'solvent': 'مذيب',
  'ointment base': 'قاعدة مرهم',
  'emulsifying agent': 'عامل استحلاب',
  'suspending agent': 'عامل تعليق',
  'tablet binder': 'رابط للأقراص',
  'tablet disintegrant': 'مفتت للأقراص',
  'tablet lubricant': 'مزلق للأقراص',
  'capsule shell': 'غلاف كبسولة',
  'flavoring agent': 'منكه',
  'sweetening agent': 'محلي',
  'coloring agent': 'ملون',
  'coating agent': 'عامل تغليف',
  'plasticizer': 'ملدن',
  'stiffening agent': 'عامل تصلب',
  'humectant': 'مرطب',
  'surfactant': 'خافض للتوتر السطحي',
  'chelating agent': 'عامل استخلاب',
  'antioxidant': 'مضاد للأكسدة',
  'buffering agent': 'عامل منظم',
  'tonicity agent': 'عامل توتر',
  'viscosity increasing agent': 'عامل زيادة اللزوجة',
  'absorption enhancer': 'معزز امتصاص',
  'bioadhesive': 'لاصق حيوي',
  'controlled release agent': 'عامل تحرير محكم',
  'extended release agent': 'عامل تحرير ممتد',
  'delayed release agent': 'عامل تحرير مؤجل',
  'enteric coating': 'تغليف معوي',
  'film coating': 'تغليف غشائي',
  'sugar coating': 'تغليف سكري',
  'polishing agent': 'عامل تلميع',
  'printing ink': 'حبر طباعة',
  'gas': 'غاز',
  'oxygen': 'أكسجين',
  'nitrogen': 'نيتروجين',
  'carbon dioxide': 'ثاني أكسيد الكربون',
  'helium': 'هيليوم',
  'nitrous oxide': 'أكسيد النيتروز',
  'air': 'هواء',
  'water': 'ماء',
  'purified water': 'ماء منقى',
  'water for injection': 'ماء للحقن',
  'bacteriostatic water for injection': 'ماء للحقن كابح للبكتيريا',
  'sterile water for injection': 'ماء معقم للحقن',
  'sterile water for irrigation': 'ماء معقم للري',
  'sterile water for inhalation': 'ماء معقم للاستنشاق',
  'sodium chloride injection': 'حقن كلوريد الصوديوم',
  'dextrose injection': 'حقن دكستروز',
  'ringer injection': 'حقن رينجر',
  'lactated ringer injection': 'حقن رينجر لاكتات',
  'mannitol injection': 'حقن مانيتول',
  'potassium chloride injection': 'حقن كلوريد البوتاسيوم',
  'calcium gluconate injection': 'حقن غلوكونات الكالسيوم',
  'magnesium sulfate injection': 'حقن كبريتات المغنيسيوم',
  'sodium bicarbonate injection': 'حقن بيكربونات الصوديوم',
  'ammonium chloride injection': 'حقن كلوريد الأمونيوم',
  'sodium lactate injection': 'حقن لاكتات الصوديوم',
  'amino acid injection': 'حقن أحماض أمينية',
  'lipid emulsion': 'مستحلب دهني',
  'total parenteral nutrition': 'تغذية وريدية شاملة',
  'enteral nutrition': 'تغذية معوية',
  'oral rehydration solution': 'محلول معالجة الجفاف',
  'peritoneal dialysis solution': 'محلول غسيل كلوي بريتوني',
  'hemodialysis solution': 'محلول غسيل كلوي دموي',
  'irrigation solution': 'محلول ري',
  'ophthalmic irrigation solution': 'محلول ري للعين',
  'contact lens solution': 'محلول عدسات لاصقة',
  'tear substitute': 'بديل الدموع',
  'artificial saliva': 'لعاب صناعي',
  'dental product': 'منتج للأسنان',
  'mouthwash': 'غسول للفم',
  'toothpaste': 'معجون أسنان',
  'dental gel': 'جل للأسنان',
  'dental strip': 'شريط للأسنان',
  'lozenge': 'أقراص استحلاب',
  'throat spray': 'بخاخ للحلق',
  'nasal spray': 'بخاخ للأنف',
  'nasal drop': 'قطرة للأنف',
  'nasal gel': 'جل للأنف',
  'nasal wash': 'غسول للأنف',
  'ear drop': 'قطرة للأذن',
  'ear wax remover': 'مزيل شمع الأذن',
  'eye drop': 'قطرة للعين',
  'eye ointment': 'مرهم للعين',
  'eye gel': 'جل للعين',
  'eye wash': 'غسول للعين',
  'vaginal cream': 'كريم مهبلي',
  'vaginal gel': 'جل مهبلي',
  'vaginal suppository': 'تحاميل مهبلية',
  'vaginal tablet': 'أقراص مهبلية',
  'vaginal ring': 'حلقة مهبلية',
  'vaginal douche': 'دش مهبلي',
  'rectal suppository': 'تحاميل شرجية',
  'rectal ointment': 'مرهم شرجي',
  'rectal cream': 'كريم شرجي',
  'rectal gel': 'جل شرجي',
  'rectal foam': 'رغوة شرجية',
  'enema': 'حقنة شرجية',
  'topical cream': 'كريم موضعي',
  'topical ointment': 'مرهم موضعي',
  'topical gel': 'جل موضعي',
  'topical lotion': 'لوشن موضعي',
  'topical solution': 'محلول موضعي',
  'topical spray': 'بخاخ موضعي',
  'topical powder': 'بودرة موضعية',
  'topical foam': 'رغوة موضعية',
  'transdermal patch': 'لصقة جلدية',
  'shampoo': 'شامبو',
  'soap': 'صابون',
  'cleanser': 'منظف',
  'moisturizer': 'مرطب',
  'sunscreen': 'واقي شمس',
  'insect repellent': 'طارد للحشرات',
  'antiperspirant': 'مضاد للتعرق',
  'deodorant': 'مزيل عرق',
  'hair removal': 'إزالة الشعر',
  'hair growth': 'نمو الشعر',
  'hair color': 'صبغة شعر',
  'acne product': 'منتج لحب الشباب',
  'wart remover': 'مزيل للثآليل',
  'callus remover': 'مزيل للكالو',
  'corn remover': 'مزيل لمسمار القدم',
  'dandruff product': 'منتج للقشرة',
  'psoriasis product': 'منتج للصدفية',
  'eczema product': 'منتج للإكزيما',
  'fungal infection product': 'منتج للفطريات',
  'viral infection product': 'منتج للفيروسات',
  'bacterial infection product': 'منتج للبكتيريا',
  'parasitic infection product': 'منتج للطفيليات',
  'burn product': 'منتج للحروق',
  'wound care product': 'منتج للعناية بالجروح',
  'scar product': 'منتج للندبات',
  'stretch mark product': 'منتج لعلامات التمدد',
  'diaper rash product': 'منتج لالتهاب الحفاض',
  'baby powder': 'بودرة أطفال',
  'baby oil': 'زيت أطفال',
  'baby lotion': 'لوشن أطفال',
  'baby soap': 'صابون أطفال',
  'baby shampoo': 'شامبو أطفال',
  'teething gel': 'جل للتسنين',
  'colic drop': 'قطرة للمغص',
  'gas drop': 'قطرة للغازات',
  'vitamin drop': 'قطرة فيتامين',
  'iron drop': 'قطرة حديد',
  'electrolyte solution': 'محلول كهارل',
  'cough syrup': 'شراب للكحة',
  'cold syrup': 'شراب للبرد',
  'fever syrup': 'شراب للحرارة',
  'pain syrup': 'شراب للألم',
  'allergy syrup': 'شراب للحساسية',
  'vitamin syrup': 'شراب فيتامين',
  'mineral syrup': 'شراب معادن',
  'supplement syrup': 'شراب مكمل غذائي',
  'herbal syrup': 'شراب عشبي',
  'homeopathic syrup': 'شراب معالجة مثلية',
};

function translateCategory(englishCategory: string): string {
  if (!englishCategory) return 'عام';
  const lower = englishCategory.toLowerCase().trim();
  
  // Direct match
  if (categoryMap[lower]) return categoryMap[lower];
  
  // Partial match - Check longest keys first to avoid partial overlap issues
  const keys = Object.keys(categoryMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) return categoryMap[key];
  }
  
  return englishCategory; // Return original if no translation found
}

async function main() {
  console.log('Starting category translation update...');
  
  const categories = await prisma.drugCategory.findMany();
  console.log(`Found ${categories.length} categories to check.`);
  
  let updatedCount = 0;
  
  for (const cat of categories) {
    // Force translate even if it looks like it might have some Arabic but mostly English
    // Or just re-run translation on everything that isn't purely Arabic
    
    // Improved check: if it contains any English letters, try to translate it
    if (/[a-zA-Z]/.test(cat.name)) {
      const translatedName = translateCategory(cat.name);
      
      if (translatedName !== cat.name && !/[a-zA-Z]/.test(translatedName)) {
        // If translation resulted in a purely Arabic name (or at least changed it)
        
        // Check if translated category already exists to merge
        const existingArabicCat = await prisma.drugCategory.findFirst({
          where: { name: translatedName }
        });
        
        if (existingArabicCat) {
          console.log(`Merging '${cat.name}' into existing '${translatedName}'...`);
          // Move drugs to the existing Arabic category
          await prisma.drug.updateMany({
            where: { categoryId: cat.id },
            data: { categoryId: existingArabicCat.id }
          });
          // Delete the old English category
          await prisma.drugCategory.delete({
            where: { id: cat.id }
          });
        } else {
          console.log(`Renaming '${cat.name}' to '${translatedName}'...`);
          // Just rename
          await prisma.drugCategory.update({
            where: { id: cat.id },
            data: { name: translatedName }
          });
        }
        updatedCount++;
      } else if (/[a-zA-Z]/.test(cat.name)) {
         // If still English after translation attempts, rename to "عام" or merge with "عام"
         // This is a safety net for unknown categories to avoid showing English to user
         console.log(`Fallback: Merging unknown English category '${cat.name}' into 'عام'...`);
         
         const generalCat = await prisma.drugCategory.upsert({
            where: { name: 'عام' },
            update: {},
            create: { name: 'عام' }
         });
         
         await prisma.drug.updateMany({
            where: { categoryId: cat.id },
            data: { categoryId: generalCat.id }
         });
         
         await prisma.drugCategory.delete({
            where: { id: cat.id }
         });
         updatedCount++;
      }
    }
  }
  
  console.log(`Finished. Updated/Merged ${updatedCount} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
