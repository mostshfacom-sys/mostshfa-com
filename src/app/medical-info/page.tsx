import { Header, Footer, Breadcrumb } from '@/components/shared';
import { Suspense } from 'react';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import UniversalHeaderClient, { type HeaderCounterConfig } from '@/components/shared/UniversalHeaderClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EntityCardImage } from '@/components/ui/EntityImage';
import { DailyTipActions } from './DailyTipActions';
import VideoScrollRow from './VideoScrollRow';
import VisualTipsRow from './VisualTipsRow';
import { formatDuration, syncYoutubeVideosOnce } from '@/lib/youtube/youtubeSync';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'المعلومات الطبية | مستشفى.كوم',
  description:
    'مكتبة معرفية عربية تجمع أهم المعلومات الطبية: مقالات موثوقة، أدلة مبسطة، ونصائح عملية تساعدك على فهم صحتك واتخاذ قرار أفضل.',
  openGraph: {
    title: 'المعلومات الطبية | مستشفى.كوم',
    description:
      'استكشف مكتبة المعلومات الطبية: مقالات طبية، تصنيفات، ومسارات قراءة مختصرة تساعدك على التعلم بسرعة.',
  },
};

type SeededRandom = () => number;

const hashStringToSeed = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number): SeededRandom => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T,>(items: T[], rng: SeededRandom) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

type VisualTipSlide = {
  id: string;
  title: string;
  lines: string[];
  accent: string;
  background: string;
  icon: string;
};

const VISUAL_TIP_SLIDES: VisualTipSlide[] = [
  {
    id: 'hydration',
    title: 'ترطيب يومي متوازن',
    lines: ['اشرب 6-8 أكواب ماء', 'وزّعها على مدار اليوم'],
    accent: '#38bdf8',
    background: '#e0f2fe',
    icon: '💧',
  },
  {
    id: 'sleep',
    title: 'نوم ثابت أفضل صحة',
    lines: ['7-8 ساعات نوم ليلاً', 'وثّب موعد النوم والاستيقاظ'],
    accent: '#a78bfa',
    background: '#ede9fe',
    icon: '🌙',
  },
  {
    id: 'movement',
    title: 'حركة خفيفة كل يوم',
    lines: ['30 دقيقة مشي سريع', 'تقلل التوتر وتحسن الدورة'],
    accent: '#34d399',
    background: '#dcfce7',
    icon: '🚶‍♀️',
  },
  {
    id: 'breakfast',
    title: 'فطور متوازن',
    lines: ['أضف بروتين + ألياف', 'لتثبيت الطاقة حتى الظهر'],
    accent: '#f59e0b',
    background: '#fef3c7',
    icon: '🥣',
  },
  {
    id: 'pressure',
    title: 'راقب ضغط الدم',
    lines: ['إذا كان لديك تاريخ مرضي', 'سجل القياسات أسبوعياً'],
    accent: '#f87171',
    background: '#fee2e2',
    icon: '🩺',
  },
  {
    id: 'sugar',
    title: 'سكر الدم يحتاج روتين',
    lines: ['قياسات منتظمة + غذاء متوازن', 'تقلل المفاجآت اليومية'],
    accent: '#fb7185',
    background: '#ffe4e6',
    icon: '🩸',
  },
  {
    id: 'vitamin-d',
    title: 'فيتامين د أهم مما تتخيل',
    lines: ['تعرّض للشمس بحكمة', 'وافحص المستوى عند التعب'],
    accent: '#f97316',
    background: '#ffedd5',
    icon: '☀️',
  },
  {
    id: 'posture',
    title: 'قعدة صحية للظهر',
    lines: ['غيّر وضعيتك كل 45 دقيقة', 'واستخدم دعم أسفل الظهر'],
    accent: '#60a5fa',
    background: '#dbeafe',
    icon: '🪑',
  },
  {
    id: 'salt',
    title: 'خفّض الملح تدريجياً',
    lines: ['استبدل الملح بالأعشاب', 'واحذر الأغذية المصنعة'],
    accent: '#4ade80',
    background: '#ecfccb',
    icon: '🧂',
  },
  {
    id: 'stress',
    title: 'إدارة التوتر',
    lines: ['تنفس عميق 4 مرات', 'وقطع الشاشة 10 دقائق'],
    accent: '#c084fc',
    background: '#f3e8ff',
    icon: '🧘‍♂️',
  },
  {
    id: 'checkups',
    title: 'فحوصات دورية ذكية',
    lines: ['افحص ضغطك وسكرك سنوياً', 'وخُذ استشارة عند أي تغيير'],
    accent: '#22d3ee',
    background: '#cffafe',
    icon: '🧪',
  },
  {
    id: 'eyes',
    title: 'راحة العينين',
    lines: ['قاعدة 20-20-20 مفيدة', 'كل 20 دقيقة انظر بعيداً'],
    accent: '#38bdf8',
    background: '#e0f2fe',
    icon: '👀',
  },
  {
    id: 'walk',
    title: 'الأكل بوعي',
    lines: ['امضغ ببطء وتوقف عند الشبع', 'الجسم يعطيك إشارة واضحة'],
    accent: '#f472b6',
    background: '#fce7f3',
    icon: '🍽️',
  },
  {
    id: 'fruits',
    title: 'ألوان في طبقك',
    lines: ['أضف 3 ألوان من الخضار', 'لتحصل على عناصر أكثر'],
    accent: '#fb7185',
    background: '#ffe4e6',
    icon: '🥗',
  },
  {
    id: 'hydration-signs',
    title: 'اشارات الجفاف المبكرة',
    lines: ['صداع، جفاف فم، تركيز أقل', 'ابدأ بالماء أولاً'],
    accent: '#0ea5e9',
    background: '#e0f2fe',
    icon: '💦',
  },
  {
    id: 'breathing',
    title: 'تنفس بعمق',
    lines: ['شهيق 4 ثوانٍ، زفير 6 ثوانٍ', 'كررها 5 مرات'],
    accent: '#5eead4',
    background: '#ccfbf1',
    icon: '🌬️',
  },
  {
    id: 'steps',
    title: 'خطواتك اليومية مهمة',
    lines: ['ابدأ بـ 5000 خطوة', 'وزدها تدريجياً'],
    accent: '#34d399',
    background: '#dcfce7',
    icon: '👣',
  },
  {
    id: 'headache',
    title: 'الصداع المتكرر',
    lines: ['احرص على النوم والماء', 'وسجل المحفزات اليومية'],
    accent: '#f97316',
    background: '#ffedd5',
    icon: '🧠',
  },
  {
    id: 'meds',
    title: 'مواعيد الدواء',
    lines: ['اضبط تنبيهاً ثابتاً', 'ولا تضاعف الجرعة عند النسيان'],
    accent: '#6366f1',
    background: '#e0e7ff',
    icon: '💊',
  },
  {
    id: 'stretch',
    title: 'مرّن عضلاتك',
    lines: ['تمارين إطالة قصيرة صباحاً', 'تحسن مرونة الجسم'],
    accent: '#f59e0b',
    background: '#fef3c7',
    icon: '🤸‍♀️',
  },
  {
    id: 'fiber',
    title: 'الألياف صديق الهضم',
    lines: ['خضار + حبوب كاملة يومياً', 'تقلل الانتفاخ وتثبت الطاقة'],
    accent: '#22c55e',
    background: '#dcfce7',
    icon: '🥬',
  },
  {
    id: 'screen-breaks',
    title: 'استراحات للشاشة',
    lines: ['قاعدة 20-20-20 للعين', 'تخفف إجهاد النظر'],
    accent: '#0ea5e9',
    background: '#e0f2fe',
    icon: '👀',
  },
  {
    id: 'handwash',
    title: 'نظافة اليدين',
    lines: ['20 ثانية بالصابون', 'قبل الأكل وبعده'],
    accent: '#38bdf8',
    background: '#cffafe',
    icon: '🧼',
  },
  {
    id: 'vitamin-c',
    title: 'مناعة قوية',
    lines: ['خضار وفواكه ملونة', 'تدعم دفاعات الجسم'],
    accent: '#f97316',
    background: '#ffedd5',
    icon: '🍊',
  },
  {
    id: 'balanced-plate',
    title: 'طبق متوازن',
    lines: ['نصفه خضار', 'وربع بروتين + ربع نشويات'],
    accent: '#8b5cf6',
    background: '#ede9fe',
    icon: '🍽️',
  },
  {
    id: 'salt-reduce',
    title: 'قلل الملح',
    lines: ['اقل من ملعقة صغيرة يومياً', 'احمِ القلب والضغط'],
    accent: '#f43f5e',
    background: '#ffe4e6',
    icon: '🧂',
  },
  {
    id: 'blood-check',
    title: 'فحص دوري ذكي',
    lines: ['تحليل شامل سنوياً', 'يكشف المخاطر مبكراً'],
    accent: '#4f46e5',
    background: '#e0e7ff',
    icon: '🧪',
  },
  {
    id: 'sun-safety',
    title: 'شمس آمنة',
    lines: ['10-15 دقيقة صباحاً', 'واستخدم واقي الشمس'],
    accent: '#f59e0b',
    background: '#fef3c7',
    icon: '🧴',
  },
  {
    id: 'sleep-routine',
    title: 'روتين نوم ثابت',
    lines: ['خفف الإضاءة قبل النوم', 'ابتعد عن المنبهات'],
    accent: '#6366f1',
    background: '#e0e7ff',
    icon: '🛌',
  },
  {
    id: 'snacks',
    title: 'وجبات خفيفة ذكية',
    lines: ['مكسرات + فاكهة', 'أفضل من السكريات'],
    accent: '#f97316',
    background: '#ffedd5',
    icon: '🥜',
  },
  {
    id: 'steps',
    title: 'خطوات أكثر يومياً',
    lines: ['هدف 6000-8000 خطوة', 'تحسن الدورة والطاقة'],
    accent: '#10b981',
    background: '#d1fae5',
    icon: '👟',
  },
  {
    id: 'calcium',
    title: 'صحة العظام',
    lines: ['كالسيوم + فيتامين د', 'يحافظ على القوة'],
    accent: '#38bdf8',
    background: '#e0f2fe',
    icon: '🦴',
  },
  {
    id: 'hydrate-summer',
    title: 'الترطيب في الحر',
    lines: ['زود الماء مع الحرارة', 'واختصر المشروبات السكرية'],
    accent: '#06b6d4',
    background: '#cffafe',
    icon: '🧊',
  },
  {
    id: 'post-meal',
    title: 'حركة بعد الأكل',
    lines: ['10 دقائق مشي خفيف', 'تحسن الهضم والسكر'],
    accent: '#22c55e',
    background: '#dcfce7',
    icon: '🚶',
  },
  {
    id: 'breathing',
    title: 'تنفس هادئ',
    lines: ['شهيق 4 ثوانٍ', 'زفير 6 ثوانٍ'],
    accent: '#0ea5e9',
    background: '#e0f2fe',
    icon: '🌬️',
  },
  {
    id: 'stretch-break',
    title: 'استراحة تمدد',
    lines: ['مد الرقبة والكتفين', 'كل ساعة عمل'],
    accent: '#f59e0b',
    background: '#fef3c7',
    icon: '🙆‍♂️',
  },
];

const VISUAL_TIP_PALETTE = [
  { accent: '#38bdf8', background: '#e0f2fe', icon: '💡' },
  { accent: '#f59e0b', background: '#fef3c7', icon: '🌟' },
  { accent: '#6366f1', background: '#e0e7ff', icon: '🫶' },
  { accent: '#22c55e', background: '#dcfce7', icon: '🌿' },
  { accent: '#f97316', background: '#ffedd5', icon: '🧡' },
  { accent: '#10b981', background: '#d1fae5', icon: '✅' },
  { accent: '#ec4899', background: '#fce7f3', icon: '💗' },
];

const buildLinesFromText = (text: string, maxChars = 26, maxLines = 2) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const words = cleaned.split(' ');
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    if (lines.length >= maxLines) return;
    const next = `${current} ${word}`.trim();
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (lines.length < maxLines && current) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
};

const buildVisualTipFromText = (title: string, content: string, seedKey: string) => {
  const palette = VISUAL_TIP_PALETTE[hashStringToSeed(seedKey) % VISUAL_TIP_PALETTE.length];
  const lines = buildLinesFromText(content || title);
  return {
    id: seedKey,
    title: title || 'معلومة مصورة',
    lines: lines.length ? lines : ['معلومة صحية مختصرة'],
    accent: palette.accent,
    background: palette.background,
    icon: palette.icon,
  };
};

const buildVisualTipImage = (slide: VisualTipSlide) => {
  const lines = slide.lines
    .map((line, index) => `<tspan x="50%" dy="${index === 0 ? 0 : 36}">${line}</tspan>`)
    .join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
      <rect width="900" height="540" rx="36" fill="${slide.background}" />
      <circle cx="780" cy="90" r="90" fill="${slide.accent}" opacity="0.18" />
      <circle cx="140" cy="460" r="120" fill="${slide.accent}" opacity="0.14" />
      <text x="50%" y="115" text-anchor="middle" font-size="56" font-family="Tajawal, Arial, sans-serif">${slide.icon}</text>
      <text x="50%" y="200" text-anchor="middle" font-size="40" font-weight="700" fill="#0f172a" font-family="Tajawal, Arial, sans-serif">${slide.title}</text>
      <text x="50%" y="300" text-anchor="middle" font-size="30" fill="#0f172a" font-family="Tajawal, Arial, sans-serif">${lines}</text>
      <rect x="300" y="420" width="300" height="8" rx="4" fill="${slide.accent}" opacity="0.6" />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

type VideoHighlight = {
  id: string;
  title: string;
  duration?: string;
  doctor?: string;
  href: string;
  thumbnail?: string;
  tag?: string;
  videoId?: string;
};

const FALLBACK_MEDICAL_VIDEOS: VideoHighlight[] = [
  {
    id: 'video-1',
    title: 'نصائح سريعة للوقاية من نزلات البرد',
    duration: '05:45',
    doctor: 'د. رانيا سامي',
    href: 'https://www.youtube.com/watch?v=3Nt3O3D0X3I',
    thumbnail: 'https://img.youtube.com/vi/3Nt3O3D0X3I/hqdefault.jpg',
    tag: 'مناعة',
    videoId: '3Nt3O3D0X3I',
  },
  {
    id: 'video-2',
    title: 'تمارين تنفس لتهدئة التوتر',
    duration: '04:12',
    doctor: 'د. خالد يوسف',
    href: 'https://www.youtube.com/watch?v=9s59a7q3MDA',
    thumbnail: 'https://img.youtube.com/vi/9s59a7q3MDA/hqdefault.jpg',
    tag: 'صحة نفسية',
    videoId: '9s59a7q3MDA',
  },
  {
    id: 'video-3',
    title: 'دليل سريع للفحص الدوري',
    duration: '06:05',
    doctor: 'د. ندى سالم',
    href: 'https://www.youtube.com/watch?v=vxwzQn1FZs4',
    thumbnail: 'https://img.youtube.com/vi/vxwzQn1FZs4/hqdefault.jpg',
    tag: 'فحوصات',
    videoId: 'vxwzQn1FZs4',
  },
  {
    id: 'video-4',
    title: 'كيف تختار وجبة متوازنة؟',
    duration: '07:22',
    doctor: 'د. هبة جمال',
    href: 'https://www.youtube.com/watch?v=K2VZ9M3L8oI',
    thumbnail: 'https://img.youtube.com/vi/K2VZ9M3L8oI/hqdefault.jpg',
    tag: 'تغذية',
    videoId: 'K2VZ9M3L8oI',
  },
];

type InfoTopic =
  | 'all'
  | 'emergency'
  | 'drugs'
  | 'tests'
  | 'lifestyle'
  | 'women'
  | 'kids'
  | 'chronic'
  | 'mental';

function resolveTopic(value?: string | string[]): InfoTopic {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === 'emergency' ||
    raw === 'drugs' ||
    raw === 'tests' ||
    raw === 'lifestyle' ||
    raw === 'women' ||
    raw === 'kids' ||
    raw === 'chronic' ||
    raw === 'mental'
  ) {
    return raw;
  }
  return 'all';
}

type MedicalInfoSection = {
  id: string;
  topic: Exclude<InfoTopic, 'all'>;
  title: string;
  description: string;
  href: string;
  icon: string;
  tags: string[];
};

const TOPIC_FILTERS: Array<{ id: InfoTopic; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'emergency', label: 'طوارئ' },
  { id: 'drugs', label: 'أدوية' },
  { id: 'tests', label: 'فحوصات' },
  { id: 'lifestyle', label: 'نمط حياة' },
  { id: 'chronic', label: 'أمراض مزمنة' },
  { id: 'women', label: 'صحة المرأة' },
  { id: 'kids', label: 'صحة الطفل' },
  { id: 'mental', label: 'صحة نفسية' },
];

const MEDICAL_INFO_SECTIONS: MedicalInfoSection[] = [
  {
    id: 'emergency-first-aid',
    topic: 'emergency',
    title: 'الإسعافات الأولية والطوارئ',
    description: 'متى تتجه للطوارئ؟ خطوات أولية سريعة وروابط مباشرة للخدمات والأرقام المهمة.',
    href: '/emergency',
    icon: '🚑',
    tags: ['إسعاف', 'نزيف', 'حروق', 'إغماء', 'ضيق تنفس'],
  },
  {
    id: 'safe-medicine',
    topic: 'drugs',
    title: 'استخدم الدواء بأمان',
    description: 'ابحث عن الدواء، البدائل، والتداخلات الدوائية الشائعة قبل الاستخدام.',
    href: '/drugs',
    icon: '💊',
    tags: ['جرعة', 'بدائل', 'تداخلات', 'حساسية'],
  },
  {
    id: 'tests-and-labs',
    topic: 'tests',
    title: 'الفحوصات والتحاليل',
    description: 'افهم التحاليل الشائعة وكيف تستعد لها، ثم اعثر على أقرب معمل موثوق.',
    href: '/directories',
    icon: '🧪',
    tags: ['تحاليل', 'سكر', 'دهون', 'CBC', 'فيتامين د'],
  },
  {
    id: 'daily-tracking',
    topic: 'lifestyle',
    title: 'متابعة يومية وقياسات',
    description: 'حاسبات ومتتبعات تساعدك على فهم أرقامك الصحية ومتابعتها بانتظام.',
    href: '/tools',
    icon: '🧰',
    tags: ['BMI', 'ضغط', 'سكر', 'وزن', 'نوم'],
  },
  {
    id: 'blood-pressure',
    topic: 'chronic',
    title: 'ضغط الدم',
    description: 'متى يكون الضغط مرتفعاً؟ كيف تتابعه؟ وما العلامات التي تستدعي مراجعة الطبيب؟',
    href: '/search?q=ضغط',
    icon: '🫀',
    tags: ['ضغط', 'قلب', 'دوخة', 'صداع'],
  },
  {
    id: 'diabetes',
    topic: 'chronic',
    title: 'السكر والتمثيل الغذائي',
    description: 'مؤشرات السكر، الأعراض الشائعة، والمتابعة الذكية مع نمط حياة مناسب.',
    href: '/search?q=سكر',
    icon: '🩸',
    tags: ['سكر', 'HbA1c', 'عطش', 'إرهاق'],
  },
  {
    id: 'women-health',
    topic: 'women',
    title: 'صحة المرأة',
    description: 'دورة شهرية، حمل، رضاعة، وفحوصات دورية موصى بها حسب العمر.',
    href: '/search?q=صحة المرأة',
    icon: '👩‍⚕️',
    tags: ['حمل', 'دورة', 'رضاعة', 'تحاليل'],
  },
  {
    id: 'kids-health',
    topic: 'kids',
    title: 'صحة الطفل',
    description: 'علامات تستدعي الانتباه، تغذية الطفل، ومتى تحتاج مراجعة طبيب أطفال.',
    href: '/search?q=صحة الطفل',
    icon: '🧒',
    tags: ['حمى', 'سعال', 'تغذية', 'تطعيمات'],
  },
  {
    id: 'mental-health',
    topic: 'mental',
    title: 'الصحة النفسية',
    description: 'قلق، توتر، نوم، وإرشادات بسيطة تساعدك على تحسين جودة حياتك.',
    href: '/search?q=توتر',
    icon: '🧠',
    tags: ['قلق', 'اكتئاب', 'نوم', 'توتر'],
  },
];

async function getMedicalInfoData({
  q,
  topic,
  page = 1,
  categoryId,
}: {
  q: string;
  topic: InfoTopic;
  page: number;
  categoryId?: number;
}) {
  const normalizedQuery = q.trim().toLowerCase();
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  // Build health tips query
  const healthTipsWhere: any = {
    isActive: true,
  };
  
  if (normalizedQuery) {
    healthTipsWhere.OR = [
      { titleAr: { contains: q.trim() } },
      { contentAr: { contains: q.trim() } },
    ];
  }
  
  if (categoryId) {
    healthTipsWhere.categoryId = categoryId;
  }

  // Get health tips with pagination
  const [healthTips, totalCount] = await Promise.all([
    prisma.healthTip.findMany({
      where: healthTipsWhere,
      include: {
        category: {
          select: { id: true, nameAr: true, slug: true }
        }
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.healthTip.count({ where: healthTipsWhere })
  ]);

  // Get total count of all active health tips (for "الكل" button)
  const totalAllTips = await prisma.healthTip.count({
    where: { isActive: true }
  });

  // Get available categories for filtering
  const categories = await prisma.articleCategory.findMany({
    where: {
      healthTips: {
        some: { isActive: true }
      }
    },
    select: {
      id: true,
      nameAr: true,
      slug: true,
      _count: {
        select: {
          healthTips: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { nameAr: 'asc' }
  });

  // Keep existing sections for quick navigation
  const sections = MEDICAL_INFO_SECTIONS.filter((section) => {
    if (topic !== 'all' && section.topic !== topic) return false;
    if (!normalizedQuery) return true;
    const haystack = `${section.title} ${section.description} ${section.tags.join(' ')}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const today = new Date();
  const dayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(
    today.getUTCDate()
  ).padStart(2, '0')}`;
  const seed = hashStringToSeed(`${dayKey}::${topic}::${normalizedQuery}`);
  const rng = mulberry32(seed);
  const requestSeed = hashStringToSeed(`${Date.now()}-${Math.random()}`);
  const requestRng = mulberry32(requestSeed);

  const allTipsForDaily = await prisma.healthTip.findMany({
    where: { isActive: true },
    include: {
      category: {
        select: { id: true, nameAr: true, slug: true }
      }
    },
    orderBy: { id: 'asc' }
  });
  const shuffledDailyTips = allTipsForDaily.length ? seededShuffle(allTipsForDaily, requestRng) : [];
  const dailyTips = shuffledDailyTips;
  const dailyTipIndex = dailyTips.length ? Math.floor(requestRng() * dailyTips.length) : 0;

  // Get suggested articles (keep existing functionality)
  const articlesWhere: any = {
    isPublished: true,
  };
  if (normalizedQuery) {
    articlesWhere.OR = [
      { title: { contains: q.trim() } },
      { excerpt: { contains: q.trim() } },
      { content: { contains: q.trim() } },
    ];
  }

  const articleCandidates = await prisma.article.findMany({
    where: articlesWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      image: true,
      publishedAt: true,
      createdAt: true,
      category: { select: { nameAr: true, slug: true } },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 24,
  });

  const suggestedArticles = seededShuffle(articleCandidates, rng).slice(0, 6);

  let visualTipRecords: Array<{
    id: number;
    titleAr: string;
    contentAr: string | null;
    imageUrl: string | null;
    sortOrder: number;
  }> = [];

  try {
    visualTipRecords = await prisma.visualTip.findMany({
      where: { isActive: true },
      select: { id: true, titleAr: true, contentAr: true, imageUrl: true, sortOrder: true },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    });
  } catch {
    visualTipRecords = [];
  }

  const visualFromDb = visualTipRecords.map((tip) => {
    if (tip.imageUrl) {
      return {
        id: `visual-${tip.id}`,
        title: tip.titleAr,
        src: tip.imageUrl,
      };
    }
    const slide = buildVisualTipFromText(
      tip.titleAr,
      tip.contentAr ?? '',
      `visual-${tip.id}-${tip.sortOrder}`
    );
    return {
      id: `visual-${tip.id}`,
      title: tip.titleAr,
      src: buildVisualTipImage(slide),
    };
  });

  const visualFallback = VISUAL_TIP_SLIDES.map((slide) => ({
    id: slide.id,
    title: slide.title,
    src: buildVisualTipImage(slide),
  }));

  const visualCandidates = [...visualFromDb, ...visualFallback];
  const visualSeeded = seededShuffle(visualCandidates, requestRng);
  const targetVisualCount = Math.max(200, visualSeeded.length);
  const visualSlides = Array.from({ length: targetVisualCount }, (_, index) => {
    const base = visualSeeded[index % visualSeeded.length];
    return { ...base, id: `${base.id}-${index}` };
  });

  let videoCandidates: VideoHighlight[] = [];
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (channelId) {
    await syncYoutubeVideosOnce(channelId);
    const videos = await prisma.youtubeVideo.findMany({
      where: { channelId },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 16,
    });
    videoCandidates = videos.map((video) => ({
      id: `youtube-${video.videoId}`,
      title: video.title,
      duration: formatDuration(video.durationSec),
      doctor: video.channelTitle ?? 'قناة يوتيوب',
      href: video.videoUrl,
      thumbnail: video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
      tag: 'فيديو طبي',
      videoId: video.videoId,
    }));
  }
  if (!videoCandidates.length) {
    videoCandidates = FALLBACK_MEDICAL_VIDEOS;
  }

  const videoSlides = seededShuffle(videoCandidates, requestRng).slice(0, 8);
  const resultsCount =
    healthTips.length + suggestedArticles.length + dailyTips.length + visualSlides.length + videoSlides.length;

  return {
    healthTips,
    categories,
    sections,
    dailyTips,
    dailyTipIndex,
    visualSlides,
    videoSlides,
    suggestedArticles,
    totalCount,
    totalAllTips,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    resultsCount,
  };
}

export default async function MedicalInfoPage({
  searchParams,
}: {
  searchParams?: { 
    q?: string | string[]; 
    topic?: string | string[];
    page?: string | string[];
    categoryId?: string | string[];
  };
}) {
  const qRaw = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const q = typeof qRaw === 'string' ? qRaw : '';
  const topic = resolveTopic(searchParams?.topic);
  
  const pageRaw = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = typeof pageRaw === 'string' ? parseInt(pageRaw, 10) || 1 : 1;
  
  const categoryIdRaw = Array.isArray(searchParams?.categoryId) ? searchParams?.categoryId[0] : searchParams?.categoryId;
  const categoryId = typeof categoryIdRaw === 'string' ? parseInt(categoryIdRaw, 10) || undefined : undefined;

  const buildLink = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const trimmed = q.trim();
    if (trimmed) params.set('q', trimmed);
    if (topic !== 'all') params.set('topic', topic);
    if (page > 1) params.set('page', page.toString());
    if (categoryId) params.set('categoryId', categoryId.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    const qs = params.toString();
    return qs ? `/medical-info?${qs}` : '/medical-info';
  };

  const data = await getMedicalInfoData({ q, topic, page, categoryId });

  const headerCounters: HeaderCounterConfig[] = [];

  const quickFilters = TOPIC_FILTERS.map((filter) => ({
    id: `topic-${filter.id}`,
    label: filter.label,
    active: filter.id === topic,
    href: buildLink({ topic: filter.id === 'all' ? undefined : filter.id }),
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <Suspense fallback={<div className="container-custom py-6" />}>
          <UniversalHeaderClient
            prefix="medicalInfo"
            title="المعلومات الطبية"
            subtitle="مكتبة معرفية عربية تجمع المقالات والإرشادات والأدلة الطبية في مكان واحد."
            counters={headerCounters}
            quickFilters={quickFilters}
            resultsCount={data.resultsCount}
            resultsLabel="معلومة طبية"
            showResultsCount
            showViewToggle={false}
            showVoiceSearch
            showMapButton={false}
            searchPlaceholder="ابحث داخل المعلومات الطبية..."
            searchParamKey="q"
            searchAction="/medical-info"
            resetPageOnSearch={false}
            useBannerText
            className="mb-10"
            titleClassName="whitespace-nowrap text-[2.4rem] sm:text-4xl leading-none"
          />
        </Suspense>

        <div className="container-custom pb-12">
          <Breadcrumb items={[{ label: 'المعلومات الطبية' }]} className="mb-6" />

          {data.dailyTips.length > 0 && (
            <section id="daily-tip" className="mb-12">
              <DailyTipActions tips={data.dailyTips} initialIndex={data.dailyTipIndex} />
            </section>
          )}

          <section id="health-tips" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">المعلومات الطبية</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {data.totalCount} معلومة طبية موثوقة من قاعدة البيانات
                </p>
              </div>
            </div>

            {data.categories.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildLink({ categoryId: undefined })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      !categoryId
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100/90 dark:bg-neutral-800 text-emerald-900 dark:text-neutral-300 hover:bg-emerald-200/90 dark:hover:bg-neutral-700'
                    }`}
                  >
                    الكل ({data.totalAllTips})
                  </Link>
                  {data.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={buildLink({ categoryId: cat.id.toString() })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        categoryId === cat.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100/90 dark:bg-neutral-800 text-emerald-900 dark:text-neutral-300 hover:bg-emerald-200/90 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {cat.nameAr} ({cat._count.healthTips})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Health Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.healthTips.map((tip) => (
                <Card
                  key={tip.id}
                  variant="hover"
                  className="h-full bg-gradient-to-br from-white via-emerald-100/70 to-white shadow-sm transition-shadow hover:shadow-md dark:from-slate-950 dark:via-emerald-950/35 dark:to-slate-900 dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)]"
                >
                  <div className="p-4">
                    {tip.category && (
                      <Badge variant="secondary" size="sm" className="mb-2">
                        {tip.category.nameAr}
                      </Badge>
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                      {tip.titleAr}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-200 line-clamp-3">
                      {tip.contentAr.length > 150 
                        ? `${tip.contentAr.substring(0, 150)}...` 
                        : tip.contentAr}
                    </p>
                    {tip.image && (
                      <div className="mt-3">
                        <img 
                          src={tip.image} 
                          alt={tip.titleAr} 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {data.healthTips.length === 0 && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                لا توجد معلومات مطابقة حالياً.
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={buildLink({ page: (page - 1).toString() })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    السابق
                  </Link>
                )}
                
                <span className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                  صفحة {page} من {data.totalPages}
                </span>
                
                {page < data.totalPages && (
                  <Link
                    href={buildLink({ page: (page + 1).toString() })}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    التالي
                  </Link>
                )}
              </div>
            )}
          </section>

          <section id="smart-paths" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <p className="text-sm font-semibold text-emerald-600">مسارات ذكية</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  ابدأ رحلة صحية منظمة خلال دقائق
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                  اختر المسار المناسب لتحصل على معلومات مركزة وروابط مباشرة.
                </p>
              </div>
              <Link
                href="/search"
                className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                بحث شامل
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  title: 'حالات طارئة',
                  description: 'إرشادات سريعة + أرقام هامة',
                  href: '/emergency',
                  tone: 'from-rose-100/90 via-white to-rose-50 dark:from-rose-950/40 dark:via-slate-900/90 dark:to-slate-950',
                  icon: '🚨',
                  action: 'اذهب للطوارئ',
                },
                {
                  title: 'دواء وبدائل',
                  description: 'ابحث عن دواءك وتداخلاته',
                  href: '/drugs',
                  tone: 'from-indigo-100/90 via-white to-indigo-50 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-slate-950',
                  icon: '💊',
                  action: 'افتح دليل الأدوية',
                },
                {
                  title: 'قياسات ونتائج',
                  description: 'حاسبات ومتتبعات يومية دقيقة',
                  href: '/tools',
                  tone: 'from-purple-100/90 via-white to-purple-50 dark:from-purple-950/40 dark:via-slate-900/90 dark:to-slate-950',
                  icon: '📈',
                  action: 'ابدأ المتابعة',
                },
                {
                  title: 'محتوى مرئي',
                  description: 'صور وفيديوهات طبية مركزة',
                  href: '/medical-videos',
                  tone: 'from-sky-100/90 via-white to-sky-50 dark:from-sky-950/40 dark:via-slate-900/90 dark:to-slate-950',
                  icon: '🎥',
                  action: 'شاهد الآن',
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  <Card
                    className={`h-full bg-gradient-to-br ${item.tone} shadow-sm transition-shadow hover:shadow-md dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)]`}
                  >
                    <div className="p-5 flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{item.icon}</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">مسار سريع</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-200 mt-2">{item.description}</p>
                      </div>
                      <span className="mt-auto text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                        {item.action}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section id="visual-info" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <p className="text-sm font-semibold text-emerald-600">محتوى مرئي</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">معلومة مصورة</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  بطاقات عربية جاهزة للحفظ والمشاركة ({data.visualSlides.length} بطاقة).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-white/5 text-emerald-700 dark:text-emerald-200">
                تحديثات مستمرة
              </span>
            </div>
            <VisualTipsRow slides={data.visualSlides} />
          </section>

          <section id="video-info" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <p className="text-sm font-semibold text-emerald-600">مختارات مرئية</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">معلومة في فيديو</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  فيديوهات طبية قصيرة قابلة للتشغيل مباشرة من الصفحة.
                </p>
              </div>
              <Link href="/medical-videos" className="text-emerald-600 hover:underline">
                كل الفيديوهات
              </Link>
            </div>
            <VideoScrollRow videos={data.videoSlides} />
          </section>

          <section id="quick-nav" className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تنقل سريع</h2>
              <p className="text-slate-600 dark:text-slate-300">
                روابط مباشرة للخدمات والأدوات الطبية الهامة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.sections.map((section) => (
                <Link key={section.id} href={section.href} className="block">
                  <Card
                    variant="hover"
                    className="h-full bg-gradient-to-br from-white via-emerald-100/60 to-lime-50/50 shadow-sm transition-shadow hover:shadow-md dark:from-slate-950 dark:via-emerald-950/30 dark:to-slate-900 dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{section.icon}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary" size="sm">
                            {TOPIC_FILTERS.find((t) => t.id === section.topic)?.label ?? 'موضوع'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{section.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-200">{section.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {section.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="info" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {data.sections.length === 0 && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">لا توجد نتائج مطابقة حالياً.</div>
            )}
          </section>

          
          <section id="suggested" className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">مقالات مقترحة (للتوسع)</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  اختيارات خفيفة للتعمّق بعد تحديد القسم المناسب.
                </p>
              </div>
              <Link href="/articles" className="text-primary-600 hover:underline">
                صفحة المقالات
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.suggestedArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="block">
                  <Card
                    variant="hover"
                    className="h-full overflow-hidden bg-gradient-to-br from-white via-emerald-100/60 to-sky-50/50 shadow-sm transition-shadow hover:shadow-md dark:from-slate-950 dark:via-emerald-950/30 dark:to-slate-900 dark:shadow-[0_18px_40px_-28px_rgba(16,185,129,0.35)]"
                  >
                    <EntityCardImage src={article.image} alt={article.title} entityType="article" entityId={article.id} />
                    <div className="p-4">
                      {article.category?.nameAr && (
                        <Badge variant="secondary" size="sm" className="mb-2">
                          {article.category.nameAr}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-200 line-clamp-3">
                        {article.excerpt || 'اقرأ المزيد من المعلومات والنصائح الطبية.'}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {data.suggestedArticles.length === 0 && (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">لا توجد مقالات متاحة حالياً.</div>
            )}
          </section>

          <section id="important-links" className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">روابط مهمة</h2>
              <p className="text-slate-600 dark:text-slate-300">انتقل بسرعة إلى الصفحات الأكثر استخداماً على الموقع.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'الأدلة الطبية',
                  description: 'المستشفيات، العيادات، المعامل، الصيدليات، التمريض، والأدوية.',
                  href: '/directories',
                  icon: '📚',
                },
                {
                  title: 'الفيديوهات الطبية',
                  description: 'فيديوهات طبية قصيرة ومفيدة مع تحديث تلقائي من قناة يوتيوب.',
                  href: '/medical-videos',
                  icon: '🎥',
                },
                {
                  title: 'الطوارئ الطبية',
                  description: 'أرقام مهمة ومقالات إسعافات أولية ومستشفيات طوارئ.',
                  href: '/emergency',
                  icon: '🚑',
                },
                {
                  title: 'الأدوات الطبية',
                  description: 'حاسبات ومتتبعات صحية تساعدك على المتابعة اليومية.',
                  href: '/tools',
                  icon: '🧰',
                },
                {
                  title: 'دليل الأدوية',
                  description: 'معلومات الأدوية والبدائل والتداخلات الدوائية.',
                  href: '/drugs',
                  icon: '💊',
                },
                {
                  title: 'البحث العام',
                  description: 'ابحث عن خدمة أو معلومة طبية في كل أقسام الموقع.',
                  href: '/search',
                  icon: '🔎',
                },
                {
                  title: 'تواصل معنا',
                  description: 'اقتراحات، شكاوى، أو شراكات طبية.',
                  href: '/contact',
                  icon: '☎️',
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  <Card
                    variant="hover"
                    className="h-full bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{item.icon}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <Card className="bg-yellow-50 dark:bg-yellow-500/10" padding="lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center dark:bg-yellow-500/20 dark:text-yellow-200">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-1">تنبيه طبي</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    المعلومات المعروضة للتثقيف العام ولا تغني عن استشارة الطبيب المختص. عند وجود أعراض مقلقة أو
                    حالة طارئة، يرجى التوجه للطوارئ فوراً.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
