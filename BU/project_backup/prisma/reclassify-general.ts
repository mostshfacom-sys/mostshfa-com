import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive mapping of keywords (Arabic & English) to Arabic Category Names
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

async function main() {
  console.log('Starting reclassification of "عام" drugs...');

  // 1. Get the "General" category ID
  const generalCategory = await prisma.drugCategory.findFirst({
    where: { name: 'عام' },
  });

  if (!generalCategory) {
    console.log('No "عام" category found. Nothing to do.');
    return;
  }

  // 2. Fetch all drugs in "General"
  const generalDrugs = await prisma.drug.findMany({
    where: { categoryId: generalCategory.id },
  });

  console.log(`Found ${generalDrugs.length} drugs in "عام". Processing...`);

  let movedCount = 0;

  for (const drug of generalDrugs) {
    let newCategoryName: string | null = null;

    // Check against our map
    for (const [categoryName, keywords] of Object.entries(keywordMap)) {
      if (
        containsKeyword(drug.activeIngredient || '', keywords) ||
        containsKeyword(drug.nameEn || '', keywords) ||
        containsKeyword(drug.usage || '', keywords)
      ) {
        newCategoryName = categoryName;
        break; // Found a match, stop checking other categories
      }
    }

    if (newCategoryName) {
      // Find or create the new category
      const targetCategory = await prisma.drugCategory.upsert({
        where: { name: newCategoryName },
        update: {},
        create: { name: newCategoryName },
      });

      // Update the drug
      await prisma.drug.update({
        where: { id: drug.id },
        data: { categoryId: targetCategory.id },
      });

      console.log(`Moved "${drug.nameEn}" from "عام" to "${newCategoryName}"`);
      movedCount++;
    }
  }

  console.log(`Finished. Moved ${movedCount} drugs out of ${generalDrugs.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
