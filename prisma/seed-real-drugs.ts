
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Expanded Keyword Map for Intelligent Classification
const keywordMap: Record<string, string[]> = {
  'مضاد حيوي': ['antibiotic', 'anti-biotic', 'bacterial', 'infection', 'amoxicillin', 'clavulanic', 'azithromycin', 'ciprofloxacin', 'cefixime', 'ceftriaxone', 'doxycycline', 'levofloxacin', 'metronidazole'],
  'مسكنات ومضادات الالتهاب': ['analgesic', 'pain', 'nsaid', 'anti-inflammatory', 'paracetamol', 'ibuprofen', 'diclofenac', 'ketoprofen', 'naproxen', 'aspirin', 'meloxicam', 'celecoxib', 'etoricoxib', 'indomethacin'],
  'أدوية البرد والأنفلونزا': ['cold', 'flu', 'influenza', 'congestion', 'cough', 'pseudoephedrine', 'chlorpheniramine', 'dextromethorphan', 'guaifenesin', 'paracetamol', 'caffeine'],
  'فيتامينات ومكملات': ['vitamin', 'supplement', 'mineral', 'calcium', 'iron', 'magnesium', 'zinc', 'omega', 'fish oil', 'multivitamin', 'b12', 'd3', 'folic acid', 'biotin'],
  'أدوية الجهاز الهضمي': ['gastro', 'stomach', 'acid', 'reflux', 'ulcer', 'gerd', 'proton', 'pump', 'omeprazole', 'pantoprazole', 'lansoprazole', 'esomeprazole', 'antacid', 'digestive', 'enzyme', 'spasm', 'hyoscine', 'mebeverine'],
  'أدوية الضغط والقلب': ['hypertension', 'blood pressure', 'cardio', 'heart', 'beta blocker', 'calcium channel', 'ace inhibitor', 'sartan', 'bisoprolol', 'amlodipine', 'valsartan', 'losartan', 'enalapril', 'lisinopril', 'captopril', 'atenolol', 'concor'],
  'أدوية السكر': ['diabetes', 'insulin', 'sugar', 'glucose', 'metformin', 'sitagliptin', 'vildagliptin', 'glimepiride', 'gliclazide', 'pioglitazone', 'empagliflozin', 'dapagliflozin'],
  'أدوية الحساسية': ['allergy', 'antihistamine', 'loratadine', 'cetirizine', 'fexofenadine', 'desloratadine', 'levocetirizine', 'histamine'],
  'أدوية نفسية وعصبية': ['psych', 'neuro', 'depression', 'anxiety', 'antidepressant', 'antipsychotic', 'ssri', 'sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'venlafaxine', 'duloxetine', 'amitriptyline', 'alprazolam', 'clonazepam', 'diazepam', 'pregabalin', 'gabapentin'],
  'أدوية جلدية': ['skin', 'derma', 'topical', 'cream', 'ointment', 'gel', 'acne', 'eczema', 'fungal', 'psoriasis', 'cortisone', 'betamethasone', 'mometasone', 'hydrocortisone', 'fusidic', 'clindamycin', 'adapalene', 'isotretinoin'],
  'أدوية العظام والعضلات': ['muscle', 'bone', 'joint', 'arthritis', 'osteoporosis', 'relaxant', 'tizanidine', 'baclofen', 'orphenadrine', 'methocarbamol', 'dantrolene', 'glucosamine', 'chondroitin', 'calcium', 'alendronate'],
  'أدوية النساء والولادة': ['women', 'gyne', 'pregnancy', 'contraceptive', 'birth control', 'hormone', 'estrogen', 'progesterone', 'menopause', 'folic', 'iron'],
  'أدوية المسالك البولية': ['urology', 'urinary', 'kidney', 'stone', 'prostate', 'tamsulosin', 'finasteride', 'nitrofurantoin', 'fosfomycin'],
  'قطرات ومراهم للعين': ['eye', 'drop', 'ophthalmic', 'vision', 'tears', 'dry eye', 'glaucoma', 'timolol', 'brimonidine', 'dorzolamide', 'latanoprost', 'travoprost', 'tobramycin', 'dexamethasone', 'prednisolone'],
  'أدوية الأطفال': ['pediatric', 'baby', 'child', 'infant', 'syrup', 'drops', 'suspension'],
};

// Helper to check if text contains any keyword
const containsKeyword = (text: string, keywords: string[]): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k.toLowerCase()));
};

// Helper to generate meaningful usage text if missing
function generateUsage(activeIngredient: string, categoryName: string, drugName: string): string {
  let usage = '';
  
  if (categoryName) {
     if (categoryName.includes('مضاد حيوي')) usage = 'مضاد حيوي واسع المجال يستخدم لعلاج العدوى البكتيرية المختلفة. يجب استشارة الطبيب لتحديد الجرعة المناسبة.';
     else if (categoryName.includes('مسكن')) usage = 'مسكن فعال للألم وخافض للحرارة، يستخدم لتخفيف الصداع وآلام الجسم.';
     else if (categoryName.includes('برد')) usage = 'علاج فعال لأعراض البرد والأنفلونزا، يساعد في تخفيف الرشح واحتقان الأنف والصداع.';
     else if (categoryName.includes('فيتامين') || categoryName.includes('مكمل')) usage = 'مكمل غذائي يحتوي على فيتامينات ومعادن لتعزيز الصحة العامة والمناعة.';
     else if (categoryName.includes('هضمي') || categoryName.includes('معدة')) usage = 'يستخدم لعلاج مشاكل الجهاز الهضمي، الحموضة، أو التقلصات المعوية.';
     else if (categoryName.includes('ضغط')) usage = 'دواء لعلاج ارتفاع ضغط الدم، يعمل على تنظيم ضغط الدم وحماية القلب.';
     else if (categoryName.includes('سكر')) usage = 'دواء لتنظيم مستوى السكر في الدم، يستخدم ضمن خطة علاجية لمرضى السكري.';
     else if (categoryName.includes('حساسية')) usage = 'مضاد للحساسية، يستخدم لتخفيف الحكة والطفح الجلدي وأعراض الحساسية الموسمية.';
     else if (categoryName.includes('جلدية')) usage = 'مستحضر موضعي للعناية بالجلد وعلاج المشاكل الجلدية المختلفة.';
     else if (categoryName.includes('أطفال')) usage = 'مستحضر مخصص للأطفال، آمن وفعال عند الالتزام بالجرعات المحددة.';
     else if (categoryName.includes('نساء')) usage = 'مستحضر خاص بصحة المرأة، يستخدم تحت إشراف طبي.';
     else if (categoryName.includes('عين')) usage = 'قطرة أو مرهم للعين، يستخدم لعلاج التهابات أو جفاف العين.';
     else usage = `يستخدم هذا الدواء لعلاج الحالات الطبية المرتبطة بتصنيف ${categoryName}، ويرجى استشارة الطبيب أو الصيدلي للمزيد من التفاصيل.`;
  } else {
     usage = 'يرجى مراجعة النشرة الداخلية للدواء أو استشارة الطبيب لمعرفة دواعي الاستعمال الدقيقة.';
  }

  if (activeIngredient) {
     usage += ` (المادة الفعالة: ${activeIngredient})`;
  }

  return usage;
}

function determineCategory(categoryName: string, activeIngredient: string, drugName: string, usage: string): string {
  // 1. Try explicit category mapping first
  if (categoryName) {
    const translated = translateCategory(categoryName);
    if (translated !== 'عام' && translated !== categoryName) return translated;
  }

  // 2. Try keyword matching
  for (const [catName, keywords] of Object.entries(keywordMap)) {
    if (
      containsKeyword(activeIngredient || '', keywords) ||
      containsKeyword(drugName || '', keywords) ||
      containsKeyword(usage || '', keywords)
    ) {
      return catName;
    }
  }

  // 3. Fallback to translated category (which might be 'عام')
  return translateCategory(categoryName);
}

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

// Configuration for Batch Processing
const START_ID_GLOBAL = 1;
const END_ID_GLOBAL = 60000;
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000;
const RETRY_LIMIT = 5; // Increased retry limit
const RETRY_DELAY_MS = 5000; // 5 seconds wait before retry
const MAX_CONSECUTIVE_FAILURES = 5000;

// Helper to wait
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchDrugData(id: number) {
  try {
    const url = `https://dwaprices.com/med.php?id=${id}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Check if valid page (title should contain name)
    const title = $('title').text();
    if (!title || title.includes('Error') || title.includes('Not Found')) return null;

    // Extract Data
    // The site structure based on snippets seems to have tables. 
    // We need to be flexible with selectors as we don't have the full DOM inspection.
    // Based on snippet: "الاسم التجاري" followed by value.
    
    const getTextByLabel = (labelPattern: RegExp): string => {
      let foundText = '';
      $('td, th, div, span, p').each((_, el) => {
        if ($(el).text().match(labelPattern)) {
          // Try next sibling or cell
          const next = $(el).next().text().trim();
          if (next) foundText = next;
          // Or if in a table, next td
          const nextTd = $(el).closest('td').next('td').text().trim();
          if (nextTd) foundText = nextTd;
        }
      });
      return foundText;
    };

    // More robust extraction strategy based on the text content provided in search result
    // The page has a table with "البيان" and "التفاصيل"
    
    let nameEn = '';
    let nameAr = '';
    let activeIngredient = '';
    let categoryName = '';
    let price = '';
    let oldPrice = '';
    let unitPrice = '';
    let units = '';
    let company = '';
    let usage = '';
    let barcode = '';
    let lastUpdated = '';
    
    // Extract barcode separately as it might be outside the main table
    const barcodeMatch = $.html().match(/الباركود الدولي\s*(\d+)/);
    if (barcodeMatch && barcodeMatch[1]) {
        barcode = barcodeMatch[1];
    }

    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        if (label.includes('الاسم التجاري')) nameEn = value;
        if (label.includes('الاسم العلمي')) activeIngredient = value;
        if (label.includes('التصنيف')) categoryName = value;
        if (label.includes('الشركة المنتجة')) company = value;
        if (label.includes('السعر الجديد')) price = value;
        if (label.includes('السعر القديم')) oldPrice = value;
        if (label.includes('سعر الوحدة')) unitPrice = value;
        if (label.includes('عدد الوحدات')) units = value;
        if (label.includes('آخر تحديث')) lastUpdated = value;
        if (label.includes('دواعي الاستعمال')) usage = value;
        if (label.includes('رمز الباركود') && !barcode) barcode = value;
      }
    });

    // Arabic name often in the title or header
    // Title format: "سعر [Arabic Name] | [Year] [English Name] [ID]"
    // Example: "سعر بانادول اكيوت هيد كولد 20 قرص ... | 2026 panadol ..."
    const titleParts = title.split('|');
    if (titleParts.length > 0) {
      const arPart = titleParts[0].replace('سعر', '').replace('2026', '').trim();
      nameAr = arPart;
    }

    // Extract Image
    let imageUrl = '';
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && (src.includes('upload') || src.includes('med_images')) && !src.includes('logo') && !src.includes('icon')) {
        imageUrl = src.startsWith('http') ? src : `https://dwaprices.com/${src}`;
        return false; // break
      }
    });
    
    // Translate category
    const translatedCategory = determineCategory(categoryName, activeIngredient, nameEn, usage);

    // Clean up price
    const priceMatch = price.match(/(\d+(\.\d+)?)/);
    const priceVal = priceMatch ? priceMatch[0] + ' ج.م' : '';

    if (!nameEn && !nameAr) return null;
    if (nameAr.includes('ششش') || nameAr.length < 3) return null; // Filter bad data
    
    // STRICT PRICE VALIDATION - User requested: "لا اريد ادوية ليس بها سعر"
    if (!priceVal || priceVal === '0 ج.م' || priceVal === '0.00 ج.م' || priceVal.trim() === '') {
       // console.log(`Skipping drug ${id} because it has no price.`);
       return null;
    }

    // Improve usage text if weak or missing
    let finalUsage = usage;
    
    // Fallback to pharmacology if available and usage is empty
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        // 1. Try to find Arabic Usage (دواعي استعمال)
        if (text.includes('دواعي استعمال دواء') || text.includes('Indication')) {
            const nextP = $(el).next('p');
            if (nextP.length) {
                const val = nextP.text().trim();
                if (val && val.length > 2) finalUsage = val;
            }
        }
        // 2. Fallback to Pharmacology if usage is still empty
        if (!finalUsage && (text.includes('الفارماكولوجي') || text.includes('Pharmacology'))) {
            const nextP = $(el).next('p');
            if (nextP.length) {
                const val = nextP.text().trim();
                if (val && val.length > 2) finalUsage = val;
            }
        }
    });

    // Only generate if absolutely no data found and user accepts it (but user said NO generated data)
    // So we will try to use active ingredient description if available, otherwise keep it minimal
    if (!finalUsage || finalUsage.length < 5 || finalUsage.includes('N/A')) {
        // finalUsage = generateUsage(activeIngredient, translatedCategory, nameEn); // DISABLED PER USER REQUEST
        if (activeIngredient) {
             finalUsage = `المادة الفعالة: ${activeIngredient}`;
        } else {
             finalUsage = '';
        }
    }

    return {
      id,
      nameAr: nameAr || nameEn,
      nameEn: nameEn,
      activeIngredient,
      categoryName: translatedCategory,
      company,
      priceText: priceVal,
      oldPrice,
      unitPrice,
      units,
      barcode,
      lastUpdatedPrice: lastUpdated,
      usage: finalUsage,
      image: imageUrl,
      slug: (nameEn || `drug-${id}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${id}`
    };

  } catch (error) {
    // console.error(`Failed to fetch ${id}:`, error.message);
    return null;
  }
}

async function fetchDrugDataWithRetry(id: number, retries = 0): Promise<any | null> {
  try {
    return await fetchDrugData(id);
  } catch (error) {
    if (retries < RETRY_LIMIT) {
      console.log(`[Retry ${retries + 1}/${RETRY_LIMIT}] Network error for ID ${id}. Retrying in ${RETRY_DELAY_MS/1000}s...`);
      await wait(RETRY_DELAY_MS);
      return fetchDrugDataWithRetry(id, retries + 1);
    }
    console.error(`[Failed] ID ${id} failed after ${RETRY_LIMIT} retries.`);
    return null;
  }
}

// Function to quickly check if a batch range is valid
async function checkBatchValidity(startId: number, endId: number): Promise<boolean> {
    try {
        // Check only the first, middle, and last ID of the batch
        const checkIds = [startId, Math.floor((startId + endId) / 2), endId];
        for (const id of checkIds) {
             const url = `https://dwaprices.com/med.php?id=${id}`;
             const response = await axios.head(url, { 
                timeout: 3000,
                validateStatus: (status) => status < 500 // Accept all status codes to avoid throwing
             });
             // If we get a valid response (even 404 might mean page exists but no drug), 
             // but usually a real dead zone times out or returns specific error.
             // However, for dwaprices, a missing ID often returns 200 OK with "Not Found" text.
             // So HEAD request might not be enough. Let's do a quick GET on the first one.
             if (response.status === 200) return true; 
        }
        return false;
    } catch (e) {
        return false;
    }
}

async function main() {
  console.log('Starting MASSIVE real data fetch from dwaprices.com...');
  
  // Dynamic Start ID
  const lastDrug = await prisma.drug.findFirst({ orderBy: { id: 'desc' } });
  let currentId = Math.max(START_ID_GLOBAL, lastDrug ? lastDrug.id + 1 : START_ID_GLOBAL);
  // Ensure we don't start before 42000 if we know first 42k are empty, but here we use MAX_ID + 1 or START_ID_GLOBAL
  
  // If we are far ahead, maybe user wants to continue from there.
  // But if the script was stopped, we should probably check if there are gaps?
  // For now, let's just continue from max ID + 1 to avoid re-scraping existing
  
  console.log(`Resuming from ID: ${currentId} (Target End: ${END_ID_GLOBAL})`);

  let totalProcessed = 0;
  let totalSaved = 0;
  let consecutiveFailures = 0;

  for (let i = currentId; i <= END_ID_GLOBAL; i += BATCH_SIZE) {
    // Check if we should stop due to consecutive failures
    // Optimization: If we hit many failures, try to SKIP ahead faster
    if (consecutiveFailures >= 500) { // If 500 failures in a row (10 empty batches)
      console.log(`Hit ${consecutiveFailures} consecutive failures. Skipping ahead 1000 IDs...`);
      i += 1000;
      consecutiveFailures = 0; // Reset counter
      continue;
    }

    const batchIds = Array.from({ length: Math.min(BATCH_SIZE, END_ID_GLOBAL - i + 1) }, (_, k) => i + k);
    console.log(`Processing Batch: ${batchIds[0]} - ${batchIds[batchIds.length - 1]}`);

    const promises = batchIds.map(async (id) => {
        // Optimization: Check if drug already exists by ID suffix or legacyId to avoid duplicates
        // Assuming slug format ends with "-{id}"
        const existing = await prisma.drug.findFirst({
            where: {
                slug: { endsWith: `-${id}` }
            },
            select: { id: true }
        });

        if (existing) {
            // process.stdout.write('s'); // s for skipped
            return null;
        }

        return fetchDrugDataWithRetry(id);
    });
    const results = await Promise.all(promises);

    let batchSaved = 0;
    for (const data of results) {
      if (data) {
        batchSaved++;
        // Upsert Category
        const category = await prisma.drugCategory.upsert({
          where: { name: data.categoryName },
          update: {},
          create: { name: data.categoryName },
        });

        // Upsert Drug
        await prisma.drug.upsert({
          where: { slug: data.slug },
          update: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            activeIngredient: data.activeIngredient,
            priceText: data.priceText,
            oldPrice: data.oldPrice,
            unitPrice: data.unitPrice,
            barcode: data.barcode,
            units: data.units,
            company: data.company,
            lastUpdatedPrice: data.lastUpdatedPrice,
            categoryId: category.id,
            usage: data.usage,
            image: data.image
          },
          create: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            slug: data.slug,
            activeIngredient: data.activeIngredient,
            priceText: data.priceText,
            oldPrice: data.oldPrice,
            unitPrice: data.unitPrice,
            barcode: data.barcode,
            units: data.units,
            company: data.company,
            lastUpdatedPrice: data.lastUpdatedPrice,
            categoryId: category.id,
            usage: data.usage,
            image: data.image
          },
        });
        totalSaved++;
      }
      totalProcessed++;
    }

    if (batchSaved > 0) {
      consecutiveFailures = 0; // Reset counter if we found data in this batch
    } else {
      consecutiveFailures += BATCH_SIZE; // Increment counter if batch was empty
    }

    if (totalProcessed % 500 === 0) {
      console.log(`Progress: ${totalProcessed}/${END_ID_GLOBAL} processed. Saved: ${totalSaved} drugs. (Consecutive Failures: ${consecutiveFailures})`);
    }

    // Delay between batches
    await wait(DELAY_BETWEEN_BATCHES);
  }

  console.log(`Finished. Total Saved: ${totalSaved} drugs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
