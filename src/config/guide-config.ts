import {
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

export interface GuideConfig {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  color: string;
  gradient: string;
  icon: ComponentType<{ className?: string }>;
  headerIcon: 'star' | 'heart' | 'shield' | 'check' | 'group' | 'building' | 'clock';
  heroImage: string;
  relatedSpecialties?: string[];
  featuredTopics?: string[];
  actionButton?: {
    label: string;
    href: string;
    icon?: string;
  };
  tools?: Array<{
    title: string;
    description: string;
    href: string;
    icon: string;
  }>;
  theme: {
    primary: string;
    text: string;
    bgLight: string;
    button: string;
    icon: string;
    border: string;
  };
}

export const GUIDES: Record<string, GuideConfig> = {
  'beauty-health': {
    slug: 'beauty-health',
    title: 'دليل الصحة والجمال',
    subtitle: 'كل ما يهمك للعناية بالبشرة، الشعر، والجمال الطبيعي.',
    description: 'نصائح طبية موثوقة للجمال، العناية بالبشرة والشعر، وأحدث الإجراءات التجميلية.',
    keywords: ['جمال', 'بشرة', 'شعر', 'تجميل', 'نضارة', 'عناية', 'beauty', 'skin', 'hair', 'cosmetic'],
    color: 'rose',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    icon: SparklesIcon,
    headerIcon: 'star',
    heroImage: '/images/guides/beauty.jpg',
    relatedSpecialties: ['dermatology', 'plastic-surgery', 'cosmetics'],
    featuredTopics: ['حب الشباب', 'العناية بالشعر', 'التجاعيد', 'تفتيح البشرة', 'روتين يومي', 'عمليات تجميل'],
    tools: [
      { title: 'تحليل نوع البشرة', description: 'اعرفي نوع بشرتك والمنتجات المناسبة لها', href: '/tools/skin-analysis', icon: 'sparkles' },
      { title: 'حاسبة كمية الماء', description: 'احسبي احتياجك اليومي للماء لنضارة البشرة', href: '/tools/water-intake', icon: 'water' },
      { title: 'روتين العناية', description: 'بناء روتين يومي مخصص لبشرتك', href: '/tools/routine-builder', icon: 'clipboard' },
      { title: 'ماسكات طبيعية', description: 'وصفات ماسكات طبيعية حسب نوع البشرة', href: '/tools/natural-masks', icon: 'beaker' },
      { title: 'فحص مسامية الشعر', description: 'اختبار منزلي لمعرفة مسامية الشعر', href: '/tools/hair-porosity', icon: 'sparkles' },
      { title: 'حاسبة واقي الشمس', description: 'متى يجب إعادة وضع واقي الشمس؟', href: '/tools/sunscreen-calc', icon: 'clock' },
      { title: 'متتبع الدورة', description: 'تأثير الدورة الشهرية على البشرة', href: '/tools/period-skin', icon: 'calendar' },
      { title: 'مكونات مستحضرات', description: 'تحليل مكونات مستحضرات التجميل', href: '/tools/ingredients-checker', icon: 'search' },
      { title: 'تمارين الوجه', description: 'تمارين يوجا الوجه لشد البشرة', href: '/tools/face-yoga', icon: 'smile' },
      { title: 'تكلفة العمليات', description: 'تقدير تكلفة عمليات التجميل', href: '/tools/cosmetic-cost', icon: 'calculator' }
    ],
    theme: {
      primary: '#e11d48',
      text: 'text-rose-600',
      bgLight: 'bg-rose-50',
      button: 'bg-rose-600 hover:bg-rose-700',
      icon: 'text-rose-600',
      border: 'border-rose-200',
    }
  },
  'mental-health': {
    slug: 'mental-health',
    title: 'دليل الصحة النفسية',
    subtitle: 'نحو توازن نفسي وحياة أكثر هدوءاً واستقراراً.',
    description: 'مقالات ومعلومات حول الصحة النفسية، القلق، الاكتئاب، وكيفية التعامل مع ضغوط الحياة.',
    keywords: ['نفسي', 'اكتئاب', 'قلق', 'توتر', 'صحة نفسية', 'mental', 'psychology', 'stress', 'anxiety'],
    color: 'violet',
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    icon: HeartIcon,
    headerIcon: 'heart',
    heroImage: '/images/guides/mental.jpg',
    relatedSpecialties: ['psychiatry', 'neurology', 'behavioral-therapy'],
    featuredTopics: ['القلق', 'الاكتئاب', 'الوسواس القهري', 'اضطرابات النوم', 'الضغط النفسي', 'التنمية الذاتية'],
    tools: [
      { title: 'اختبار القلق', description: 'قيم مستوى القلق لديك', href: '/tools/anxiety-test', icon: 'clipboard' },
      { title: 'تمارين التنفس', description: 'أداة مساعدة للاسترخاء والتنفس العميق', href: '/tools/breathing', icon: 'wind' },
      { title: 'مقياس الاكتئاب', description: 'اختبار أولي لتقييم حالة الاكتئاب', href: '/tools/depression-test', icon: 'chart' },
      { title: 'متتبع المزاج', description: 'سجل حالتك المزاجية يومياً', href: '/tools/mood-tracker', icon: 'smile' },
      { title: 'حاسبة النوم', description: 'أفضل أوقات النوم والاستيقاظ', href: '/tools/sleep-calc', icon: 'clock' },
      { title: 'اختبار الضغط', description: 'قيم مستوى الضغط النفسي (Stress)', href: '/tools/stress-test', icon: 'bolt' },
      { title: 'مفكرة الامتنان', description: 'دون 3 أشياء تمتن لها يومياً', href: '/tools/gratitude', icon: 'book' },
      { title: 'مؤقت التأمل', description: 'جلسات تأمل موجهة', href: '/tools/meditation', icon: 'sparkles' },
      { title: 'اختبار ADHD', description: 'تقييم أعراض تشتت الانتباه', href: '/tools/adhd-test', icon: 'clipboard' },
      { title: 'تقييم الإرهاق', description: 'هل تعاني من الاحتراق الوظيفي؟', href: '/tools/burnout-test', icon: 'fire' }
    ],
    theme: {
      primary: '#7c3aed',
      text: 'text-violet-600',
      bgLight: 'bg-violet-50',
      button: 'bg-violet-600 hover:bg-violet-700',
      icon: 'text-violet-600',
      border: 'border-violet-200',
    }
  },
  'first-aid': {
    slug: 'first-aid',
    title: 'دليل الإسعافات الأولية',
    subtitle: 'كن مستعداً لأي طارئ.. ثوانٍ قد تنقذ حياة.',
    description: 'خطوات عملية للتعامل مع الحالات الطارئة، الحروق، الجروح، والاختناق.',
    keywords: ['إسعاف', 'طوارئ', 'حروق', 'جروح', 'اختناق', 'إنعاش', 'first aid', 'emergency', 'cpr'],
    color: 'red',
    gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
    icon: ShieldCheckIcon,
    headerIcon: 'shield',
    heroImage: '/images/guides/first-aid.jpg',
    relatedSpecialties: ['emergency-medicine', 'critical-care'],
    featuredTopics: ['الحروق', 'الكسور', 'الاختناق', 'الإنعاش القلبي', 'لدغات الحشرات', 'التسمم'],
    actionButton: {
      label: 'أرقام الطوارئ',
      href: '/emergency',
      icon: 'phone'
    },
    tools: [
      { title: 'أرقام الطوارئ', description: 'قائمة سريعة بجميع أرقام الطوارئ', href: '/tools/emergency-numbers', icon: 'phone' },
      { title: 'دليل الإنعاش CPR', description: 'خطوات الإنعاش القلبي الرئوي', href: '/tools/cpr-guide', icon: 'heart' },
      { title: 'تقييم الحروق', description: 'تحديد درجة الحرق وكيفية التعامل معه', href: '/tools/burn-assess', icon: 'fire' },
      { title: 'اختبار السكتة', description: 'اختبار FAST للتعرف على السكتة الدماغية', href: '/tools/stroke-test', icon: 'clock' },
      { title: 'دليل التسمم', description: 'ماذا تفعل في حالة بلع مواد سامة', href: '/tools/poison-guide', icon: 'shield' },
      { title: 'حقيبة الإسعاف', description: 'قائمة مرجعية لمحتويات حقيبة الإسعاف', href: '/tools/first-aid-kit', icon: 'clipboard' },
      { title: 'تحديد موقعي', description: 'إرسال موقعك الحالي للطوارئ', href: '/tools/location-share', icon: 'map' },
      { title: 'مؤقت الضغط', description: 'مؤقت لسرعة ضغطات الصدر في CPR', href: '/tools/cpr-timer', icon: 'clock' },
      { title: 'دليل الاختناق', description: 'طريقة هيملك للكبار والأطفال', href: '/tools/choking', icon: 'user' },
      { title: 'أقرب مستشفى', description: 'تحديد أقرب مستشفى طوارئ', href: '/tools/nearest-hospital', icon: 'building' }
    ],
    theme: {
      primary: '#ef4444',
      text: 'text-red-600',
      bgLight: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600',
      border: 'border-red-200',
    }
  },
  'sexual-health': {
    slug: 'sexual-health',
    title: 'دليل الصحة الجنسية',
    subtitle: 'معلومات طبية علمية لصحة أفضل وعلاقة زوجية ناجحة.',
    description: 'توعية صحية شاملة حول الصحة الإنجابية والجنسية بأسلوب علمي ومحترم.',
    keywords: ['جنسي', 'تناسلي', 'ذكورة', 'نساء', 'خصوبة', 'sexual', 'reproductive', 'fertility'],
    color: 'sky',
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    icon: FireIcon,
    headerIcon: 'heart',
    heroImage: '/images/guides/sexual-health.jpg',
    relatedSpecialties: ['andrology', 'gynecology', 'urology'],
    featuredTopics: ['الصحة الإنجابية', 'وسائل منع الحمل', 'الأمراض المنقولة جنسياً', 'العقم', 'سن اليأس'],
    tools: [
      { title: 'حاسبة التبويض', description: 'معرفة أيام التبويض وفرص الحمل', href: '/tools/ovulation-calc', icon: 'calendar' },
      { title: 'متتبع الدورة', description: 'متابعة انتظام الدورة الشهرية', href: '/tools/period-tracker', icon: 'clock' },
      { title: 'اختبار الخصوبة', description: 'تقييم أولي لعوامل الخصوبة', href: '/tools/fertility-test', icon: 'chart' },
      { title: 'وسائل منع الحمل', description: 'مساعد اختيار الوسيلة الأنسب', href: '/tools/contraceptive', icon: 'shield' },
      { title: 'تمارين كيجل', description: 'دليل ومؤقت لتمارين عضلات الحوض', href: '/tools/kegel', icon: 'bolt' },
      { title: 'تقييم الصحة الجنسية', description: 'استبيان للصحة الجنسية للرجال', href: '/tools/sexual-health-men', icon: 'clipboard' },
      { title: 'حاسبة الحمل', description: 'موعد الولادة المتوقع وعمر الجنين', href: '/tools/pregnancy-calc', icon: 'user' },
      { title: 'مؤشر كتلة الجسم', description: 'تأثير الوزن على الصحة الإنجابية', href: '/tools/bmi', icon: 'scale' },
      { title: 'فحص ذاتي', description: 'دليل الفحص الذاتي للكشف المبكر', href: '/tools/self-exam', icon: 'eye' },
      { title: 'استشارة سرية', description: 'حجز موعد استشارة أونلاين', href: '/tools/consultation', icon: 'chat' }
    ],
    theme: {
      primary: '#0ea5e9',
      text: 'text-sky-600',
      bgLight: 'bg-sky-50',
      button: 'bg-sky-600 hover:bg-sky-700',
      icon: 'text-sky-600',
      border: 'border-sky-200',
    }
  },
  'fitness-health': {
    slug: 'fitness-health',
    title: 'دليل اللياقة البدنية',
    subtitle: 'جسمك أمانة.. حافظ عليه بالرياضة والتغذية السليمة.',
    description: 'برامج رياضية، نصائح تغذية، وأنظمة غذائية لحياة صحية ونشيطة.',
    keywords: ['لياقة', 'رياضة', 'تغذية', 'رجيم', 'دايت', 'تخسيس', 'fitness', 'diet', 'nutrition', 'gym'],
    color: 'emerald',
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    icon: BoltIcon,
    headerIcon: 'check',
    heroImage: '/images/guides/fitness.jpg',
    relatedSpecialties: ['nutrition', 'physiotherapy', 'sports-medicine'],
    featuredTopics: ['تخسيس', 'زيادة الوزن', 'كمال الأجسام', 'تمارين منزلية', 'المكملات الغذائية', 'نظام الكيتو'],
    tools: [
      { title: 'حاسبة السعرات', description: 'احسب احتياجك اليومي من السعرات الحرارية', href: '/tools/calories', icon: 'fire' },
      { title: 'مؤشر كتلة الجسم', description: 'اعرف مؤشر كتلة جسمك (BMI) والوزن المثالي', href: '/tools/bmi', icon: 'scale' },
      { title: 'مناطق النبض', description: 'حساب نبضات القلب لحرق الدهون', href: '/tools/heart-zones', icon: 'heart' },
      { title: 'حاسبة البروتين', description: 'كم جرام بروتين تحتاج يومياً؟', href: '/tools/protein-calc', icon: 'calculator' },
      { title: 'نسبة الدهون', description: 'تقدير نسبة الدهون في الجسم', href: '/tools/body-fat', icon: 'chart' },
      { title: 'شرب الماء', description: 'حاسبة احتياج الماء للرياضيين', href: '/tools/water-sport', icon: 'water' },
      { title: 'السعرات المحروقة', description: 'حساب السعرات المحروقة في التمارين', href: '/tools/burned-calories', icon: 'fire' },
      { title: 'الوزن الأقصى 1RM', description: 'حساب أقصى وزن لتكرار واحد', href: '/tools/one-rep-max', icon: 'bolt' },
      { title: 'مؤقت التمارين', description: 'مؤقت للتدريب المتقطع (Tabata)', href: '/tools/workout-timer', icon: 'clock' },
      { title: 'تقسيم الماكروز', description: 'حاسبة المغذيات (كارب، بروتين، دهون)', href: '/tools/macros', icon: 'chart' }
    ],
    theme: {
      primary: '#10b981',
      text: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      icon: 'text-emerald-600',
      border: 'border-emerald-200',
    }
  },
};
