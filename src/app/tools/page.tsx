'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Header, Footer, Breadcrumb } from '@/components/shared';
import LegacyToolsPage from './LegacyToolsPage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import BMICalculator from '@/components/medical-tools/BMICalculator';
import DiabetesRiskCalculator from '@/components/medical-tools/DiabetesRiskCalculator';
import HeartRateCalculator from '@/components/medical-tools/HeartRateCalculator';
import CalorieCalculator from '@/components/tools/CalorieCalculator';
import PregnancyCalculator from '@/components/tools/PregnancyCalculator';
import MedicineReminderTracker from '@/components/tools/MedicineReminderTracker';
import WeightTracker from '@/components/tools/WeightTracker';
import PressureLogTracker from '@/components/tools/PressureLogTracker';
import FoodDiaryTracker from '@/components/tools/FoodDiaryTracker';
import SleepTracker from '@/components/tools/SleepTracker';
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  FireIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ScaleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToolCategoryId =
  | 'all'
  | 'basic'
  | 'advanced'
  | 'weight'
  | 'nutrition'
  | 'fitness'
  | 'health'
  | 'women'
  | 'other';

type ToolType = 'calculator' | 'tracker';

interface ToolPreview {
  id: string;
  slug?: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  type: ToolType;
  isPro?: boolean;
  icon: typeof ScaleIcon;
  color: string;
  tags: string[];
  componentName?: string;
  source?: 'api' | 'static';
}

export default function ToolsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <LegacyToolsPage />
      </Suspense>
      <Footer />
    </>
  );
}

const categories: { id: ToolCategoryId; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'basic', label: 'أساسي' },
  { id: 'advanced', label: 'متقدمة' },
  { id: 'weight', label: 'وزن' },
  { id: 'nutrition', label: 'تغذية' },
  { id: 'fitness', label: 'لياقة' },
  { id: 'health', label: 'صحة' },
  { id: 'women', label: 'نساء' },
  { id: 'other', label: 'أخرى' },
];

const staticToolsBase: Omit<ToolPreview, 'source'>[] = [
  {
    id: 'bmi',
    name: 'مؤشر كتلة الجسم',
    description: 'احسب BMI بدقة واعرف تصنيف وزنك والتوصيات المناسبة.',
    componentName: 'BMICalculator',
    category: 'basic',
    type: 'calculator',
    icon: ScaleIcon,
    color: 'text-blue-600 bg-blue-50',
    tags: ['وزن', 'تقييم', 'صحة'],
  },
  {
    id: 'calories',
    name: 'حاسبة السعرات',
    description: 'حدد احتياجك اليومي من السعرات وخطة التغذية المناسبة.',
    componentName: 'CalorieCalculator',
    category: 'nutrition',
    type: 'calculator',
    icon: FireIcon,
    color: 'text-orange-600 bg-orange-50',
    tags: ['تغذية', 'حرق', 'هدف'],
  },
  {
    id: 'water',
    name: 'حاسبة الماء',
    description: 'احسب كمية الماء الأنسب لجسمك حسب النشاط والوزن.',
    category: 'basic',
    type: 'calculator',
    icon: BeakerIcon,
    color: 'text-cyan-600 bg-cyan-50',
    tags: ['ترطيب', 'صحة'],
  },
  {
    id: 'heart-rate',
    name: 'معدل ضربات القلب',
    description: 'اعرف نطاقات ضربات القلب المستهدفة لكل تمرين.',
    componentName: 'HeartRateCalculator',
    category: 'fitness',
    type: 'calculator',
    icon: HeartIcon,
    color: 'text-rose-600 bg-rose-50',
    tags: ['لياقة', 'قلب'],
  },
  {
    id: 'medicine-reminder',
    name: 'تذكير الأدوية',
    description: 'تابع جدول الأدوية والجرعات مع تنبيهات ذكية.',
    componentName: 'MedicineReminderTracker',
    category: 'advanced',
    type: 'tracker',
    isPro: true,
    icon: BellAlertIcon,
    color: 'text-purple-600 bg-purple-50',
    tags: ['متقدم', 'أدوية', 'تنبيهات'],
  },
  {
    id: 'weight-tracker',
    name: 'متتبع الوزن',
    description: 'سجل وزنك وراقب التغيرات مع مؤشرات التقدم.',
    componentName: 'WeightTracker',
    category: 'weight',
    type: 'tracker',
    isPro: true,
    icon: ChartBarIcon,
    color: 'text-emerald-600 bg-emerald-50',
    tags: ['متقدم', 'وزن', 'إحصائيات'],
  },
  {
    id: 'pressure-log',
    name: 'سجل الضغط',
    description: 'احتفظ بقراءات ضغط الدم واحصل على تقييم فوري.',
    componentName: 'PressureLogTracker',
    category: 'health',
    type: 'tracker',
    isPro: true,
    icon: HeartIcon,
    color: 'text-red-600 bg-red-50',
    tags: ['متقدم', 'ضغط الدم'],
  },
  {
    id: 'food-diary',
    name: 'مفكرة الطعام',
    description: 'سجل وجباتك وتتبع السعرات والمغذيات اليومية.',
    componentName: 'FoodDiaryTracker',
    category: 'nutrition',
    type: 'tracker',
    isPro: true,
    icon: BeakerIcon,
    color: 'text-amber-600 bg-amber-50',
    tags: ['متقدم', 'تغذية', 'وجبات'],
  },
  {
    id: 'sleep-tracker',
    name: 'متتبع النوم',
    description: 'راقب ساعات النوم وجودته مع تحليل أسبوعي.',
    componentName: 'SleepTracker',
    category: 'health',
    type: 'tracker',
    isPro: true,
    icon: MoonIcon,
    color: 'text-indigo-600 bg-indigo-50',
    tags: ['متقدم', 'نوم', 'راحة'],
  },
  {
    id: 'blood-sugar',
    name: 'تقييم سكر الدم',
    description: 'قيّم مستوى السكر واحصل على إرشادات عامة.',
    componentName: 'DiabetesRiskCalculator',
    category: 'health',
    type: 'calculator',
    icon: BeakerIcon,
    color: 'text-pink-600 bg-pink-50',
    tags: ['صحة', 'سكر'],
  },
  {
    id: 'pregnancy',
    name: 'حاسبة الحمل',
    description: 'احسبي موعد الولادة والمتابعة الأسبوعية للحمل.',
    componentName: 'PregnancyCalculator',
    category: 'women',
    type: 'calculator',
    icon: HeartIcon,
    color: 'text-fuchsia-600 bg-fuchsia-50',
    tags: ['نساء', 'حمل'],
  },
  {
    id: 'cycle',
    name: 'الدورة الشهرية',
    description: 'تتبعي الدورة ومواعيد الخصوبة بطريقة مبسطة.',
    category: 'women',
    type: 'tracker',
    icon: CalendarDaysIcon,
    color: 'text-rose-600 bg-rose-50',
    tags: ['نساء', 'تتبع'],
  },
  {
    id: 'walking',
    name: 'مسافة المشي',
    description: 'احسب المسافة والسعرات المحروقة بعد كل مشي.',
    category: 'fitness',
    type: 'calculator',
    icon: ArrowTrendingUpIcon,
    color: 'text-teal-600 bg-teal-50',
    tags: ['لياقة', 'حركة'],
  },
];

const staticTools: ToolPreview[] = staticToolsBase.map((tool) => ({
  ...tool,
  source: 'static',
}));

const typeLabels: Record<ToolType, string> = {
  calculator: 'حاسبة',
  tracker: 'متتبع',
};

interface MedicalToolApi {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  toolType?: string | null;
  componentName?: string | null;
  icon?: string | null;
  medicalSpecialties?: string[];
  targetConditions?: string[];
  accuracyLevel?: string | null;
  isFeatured?: boolean | null;
}

const normalizeText = (value?: string | null) =>
  (value ?? '').toString().trim().toLowerCase();

const normalizeComponentKey = (value: string) =>
  value.toLowerCase().replace(/[\s_]+/g, '');

const toolComponentMap: Record<string, ComponentType> = {
  bmicalculator: BMICalculator,
  bmi: BMICalculator,
  'bmi-calculator': BMICalculator,
  diabetesriskcalculator: DiabetesRiskCalculator,
  diabetesrisk: DiabetesRiskCalculator,
  'diabetes-risk': DiabetesRiskCalculator,
  heartratecalculator: HeartRateCalculator,
  heartrate: HeartRateCalculator,
  'heart-rate': HeartRateCalculator,
  caloriecalculator: CalorieCalculator,
  calories: CalorieCalculator,
  'calorie-calculator': CalorieCalculator,
  pregnancycalculator: PregnancyCalculator,
  pregnancy: PregnancyCalculator,
  medicineremindertracker: MedicineReminderTracker,
  medicinereminder: MedicineReminderTracker,
  'medicine-reminder': MedicineReminderTracker,
  weighttracker: WeightTracker,
  'weight-tracker': WeightTracker,
  pressurelogtracker: PressureLogTracker,
  pressurelog: PressureLogTracker,
  'pressure-log': PressureLogTracker,
  fooddiarytracker: FoodDiaryTracker,
  fooddiary: FoodDiaryTracker,
  'food-diary': FoodDiaryTracker,
  sleeptracker: SleepTracker,
  'sleep-tracker': SleepTracker,
};

const resolveToolComponent = (tool: ToolPreview) => {
  const keys = [tool.componentName, tool.slug, tool.id]
    .filter(Boolean)
    .map((value) => normalizeComponentKey(String(value)));

  for (const key of keys) {
    const component = toolComponentMap[key];
    if (component) return component;
  }

  return null;
};

const categoryColorMap: Record<ToolCategoryId, string> = {
  all: 'text-primary-600 bg-primary-50',
  basic: 'text-blue-600 bg-blue-50',
  advanced: 'text-purple-600 bg-purple-50',
  weight: 'text-emerald-600 bg-emerald-50',
  nutrition: 'text-orange-600 bg-orange-50',
  fitness: 'text-teal-600 bg-teal-50',
  health: 'text-red-600 bg-red-50',
  women: 'text-fuchsia-600 bg-fuchsia-50',
  other: 'text-gray-600 bg-gray-50',
};

const resolveColor = (category: ToolCategoryId) =>
  categoryColorMap[category] ?? categoryColorMap.other;

const resolveIcon = (value?: string | null): typeof ScaleIcon => {
  const iconKey = normalizeText(value);

  if (!iconKey) return SparklesIcon;
  if (iconKey.includes('scale') || iconKey.includes('weight') || iconKey.includes('bmi')) return ScaleIcon;
  if (iconKey.includes('heart') || iconKey.includes('pressure') || iconKey.includes('cardio')) return HeartIcon;
  if (iconKey.includes('fire') || iconKey.includes('calorie') || iconKey.includes('burn')) return FireIcon;
  if (iconKey.includes('water') || iconKey.includes('beaker') || iconKey.includes('hydration')) return BeakerIcon;
  if (iconKey.includes('bell') || iconKey.includes('reminder')) return BellAlertIcon;
  if (iconKey.includes('chart') || iconKey.includes('tracker') || iconKey.includes('log')) return ChartBarIcon;
  if (iconKey.includes('moon') || iconKey.includes('sleep')) return MoonIcon;
  if (iconKey.includes('calendar') || iconKey.includes('pregnancy') || iconKey.includes('cycle')) return CalendarDaysIcon;
  if (iconKey.includes('walk') || iconKey.includes('step')) return ArrowTrendingUpIcon;

  return SparklesIcon;
};

const resolveToolType = (tool: MedicalToolApi): ToolType => {
  const toolTypeValue = normalizeText(tool.toolType);
  const componentKey = normalizeText(tool.componentName);

  if (['tracker', 'tracking', 'log', 'متتبع', 'سجل'].some((key) => toolTypeValue.includes(key))) {
    return 'tracker';
  }

  if (['calculator', 'calc', 'حاسبة'].some((key) => toolTypeValue.includes(key))) {
    return 'calculator';
  }

  if (componentKey.includes('tracker')) return 'tracker';
  return 'calculator';
};

const inferCategory = (tool: MedicalToolApi): ToolCategoryId => {
  const accuracy = normalizeText(tool.accuracyLevel);

  if (['basic', 'أساسي', 'اساسي'].some((key) => accuracy.includes(key))) return 'basic';
  if (['advanced', 'متقدم', 'متقدمة', 'احترافي'].some((key) => accuracy.includes(key))) return 'advanced';

  const searchable = [
    tool.toolType,
    tool.componentName,
    tool.nameAr,
    tool.nameEn,
    ...(tool.medicalSpecialties ?? []),
    ...(tool.targetConditions ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));

  const includesAny = (keywords: string[]) =>
    searchable.some((value) => keywords.some((keyword) => value.includes(keyword)));

  if (includesAny(['weight', 'وزن', 'bmi'])) return 'weight';
  if (includesAny(['nutrition', 'تغذية', 'calorie', 'سعر', 'food', 'meal', 'غذاء'])) return 'nutrition';
  if (includesAny(['fitness', 'لياقة', 'exercise', 'رياضة', 'walk', 'heart-rate', 'نبض'])) return 'fitness';
  if (includesAny(['women', 'نساء', 'pregnancy', 'حمل', 'cycle', 'دورة'])) return 'women';
  if (includesAny(['health', 'صحة', 'pressure', 'سكر', 'diabetes', 'blood', 'sleep', 'نوم'])) return 'health';
  if (includesAny(['tracker', 'متتبع', 'log', 'سجل'])) return 'advanced';

  return 'other';
};

const mapMedicalTool = (tool: MedicalToolApi): ToolPreview => {
  const category = inferCategory(tool);
  const type = resolveToolType(tool);
  const tags = Array.from(
    new Set(
      [
        ...(tool.medicalSpecialties ?? []),
        ...(tool.targetConditions ?? []),
        tool.accuracyLevel,
        tool.toolType,
      ]
        .filter(Boolean)
        .map((value) => String(value))
    )
  );

  return {
    id: tool.slug || tool.id,
    slug: tool.slug ?? undefined,
    name: tool.nameAr || tool.nameEn || 'أداة طبية',
    description: tool.descriptionAr || tool.descriptionEn || 'تفاصيل الأداة غير متوفرة حالياً.',
    category,
    type,
    isPro:
      Boolean(tool.isFeatured) ||
      normalizeText(tool.accuracyLevel).includes('advanced') ||
      type === 'tracker',
    icon: resolveIcon(tool.icon ?? tool.componentName ?? tool.toolType ?? tool.nameAr),
    color: resolveColor(category),
    tags: tags.length ? tags : ['صحة'],
    componentName: tool.componentName ?? undefined,
    source: 'api',
  };
};

const mergeTools = (apiTools: ToolPreview[], staticList: ToolPreview[]) => {
  const toolMap = new Map<string, ToolPreview>();

  const addTool = (tool: ToolPreview) => {
    const key = normalizeComponentKey(String(tool.componentName || tool.slug || tool.id));
    if (!toolMap.has(key)) {
      toolMap.set(key, tool);
    }
  };

  apiTools.forEach(addTool);
  staticList.forEach(addTool);

  return Array.from(toolMap.values());
};

function LegacyToolsGridPage() {
  const [tools, setTools] = useState<ToolPreview[]>(staticTools);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId>('all');
  const [activeTool, setActiveTool] = useState<ToolPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ActiveToolComponent = useMemo(
    () => (activeTool ? resolveToolComponent(activeTool) : null),
    [activeTool]
  );

  useEffect(() => {
    let isMounted = true;

    const loadTools = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/medical-tools?pageSize=100', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tools: ${response.status}`);
        }

        const data = await response.json();
        const apiTools = (data?.results ?? data ?? []) as MedicalToolApi[];
        const mappedTools = apiTools.map(mapMedicalTool);

        if (isMounted) {
          setTools(mergeTools(mappedTools, staticTools));
        }
      } catch (error) {
        console.error('Error loading medical tools:', error);
        if (isMounted) {
          setTools(staticTools);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTools();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryStats = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        count:
          category.id === 'all'
            ? tools.length
            : tools.filter((tool) => tool.category === category.id).length,
      })),
    [tools]
  );

  const filteredTools = useMemo(() => {
    const term = searchTerm.trim();
    return tools.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      const matchesSearch =
        !term ||
        [tool.name, tool.description, ...tool.tags].some((value) =>
          value.toLowerCase().includes(term.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, tools]);

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/10 translate-x-1/3 translate-y-1/3" />
          <div className="container-custom relative py-12 md:py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 px-4 py-2 rounded-full text-sm mb-4">
                <SparklesIcon className="w-4 h-4" />
                منصة الأدوات الطبية الذكية
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                أدوات صحية دقيقة لمتابعة حالتك يومياً
              </h1>
              <p className="text-primary-100 text-lg leading-relaxed">
                اكتشف حاسبات صحية متقدمة ومتتبعات ذكية للوزن والنوم والأدوية. كل الأدوات مصممة
                لتمنحك رؤية أوضح عن صحتك بطريقة بسيطة وآمنة.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'أداة متاحة', value: tools.length },
                  {
                    label: 'أدوات متقدمة',
                    value: tools.filter((tool) => tool.isPro).length,
                  },
                  { label: 'تصنيفات', value: categories.length - 1 },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-white/10 border border-white/20 p-4"
                  >
                    <div className="text-2xl font-semibold">{stat.value}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container-custom py-8">
          <Breadcrumb items={[{ label: 'الأدوات الطبية' }]} className="mb-6" />

          {/* Search & Categories */}
          <Card className="mb-8" padding="lg">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <Input
                  label="ابحث عن أداة"
                  placeholder="ابحث بالاسم، النوع، أو الفئة الصحية"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  إعادة الضبط
                </Button>
                <Button type="button">تصفية الأدوات</Button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categoryStats.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                    activeCategory === category.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  <span>{category.label}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Tools Grid */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">الأدوات المتاحة</h2>
              <p className="text-sm text-gray-500">
                عرض {filteredTools.length} من {tools.length} أداة
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700">
                <SparklesIcon className="w-4 h-4" />
                {isLoading ? 'جاري تحديث الأدوات...' : 'تحديثات أسبوعية للأدوات'}
              </span>
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <Card className="text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-4">
                <MagnifyingGlassIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">جرّب تعديل كلمات البحث أو اختيار فئة أخرى.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                const ToolIcon = tool.icon;
                const toolComponent = resolveToolComponent(tool);
                const isAvailable = Boolean(toolComponent);
                return (
                  <Card
                    key={tool.id}
                    variant={isAvailable ? 'hover' : 'default'}
                    className={cn('flex flex-col h-full', isAvailable && 'cursor-pointer')}
                    onClick={() => {
                      if (isAvailable) setActiveTool(tool);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', tool.color)}>
                        <ToolIcon className="w-6 h-6" />
                      </div>
                      {tool.isPro && (
                        <Badge variant="warning" size="sm">
                          متقدمة
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{tool.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="primary" size="sm">
                        {categories.find((cat) => cat.id === tool.category)?.label}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {typeLabels[tool.type]}
                      </Badge>
                      {tool.tags.slice(0, 1).map((tag) => (
                        <Badge key={tag} variant="info" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {isAvailable ? 'جاهزة للاستخدام' : 'جاهزة للربط'}
                      </span>
                      <Button
                        type="button"
                        variant={isAvailable ? 'primary' : 'outline'}
                        size="sm"
                        disabled={!isAvailable}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isAvailable) setActiveTool(tool);
                        }}
                      >
                        {isAvailable ? 'ابدأ الآن' : 'قريباً'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-10">
            <Card className="bg-yellow-50 border border-yellow-200" padding="lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                  <HeartIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-1">تنبيه طبي</h3>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    الأدوات تساعد على المتابعة والتوعية ولا تغني عن استشارة الطبيب المختص. عند وجود
                    أعراض مقلقة، يرجى التواصل مع مقدم الرعاية الصحية.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {activeTool && ActiveToolComponent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setActiveTool(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeTool.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{activeTool.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-96px)]">
                {ActiveToolComponent && <ActiveToolComponent />}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
