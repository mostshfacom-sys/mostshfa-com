export type ThemeMode = 'light' | 'dark' | 'system';

export interface NavbarItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
  isFeatured?: boolean;
  isExternal?: boolean;
}

export interface NavbarSection {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  isEnabled: boolean;
  items: NavbarItem[];
}

export interface NavbarConfig {
  version: number;
  brand: {
    label: string;
    href: string;
  };
  primaryLinks: NavbarItem[];
  sections: {
    directories: NavbarSection;
    tools: NavbarSection;
    articles: NavbarSection & {
      useAutoCategories?: boolean;
      autoCount?: number;
    };
  };
  actions: {
    showSearch: boolean;
    showThemeToggle: boolean;
    showContact: boolean;
    showAuth: boolean;
  };
  contactLink: NavbarItem;
}

export const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  version: 1,
  brand: {
    label: 'مستشفى.كوم',
    href: '/',
  },
  primaryLinks: [
    {
      id: 'home',
      label: 'الرئيسية',
      href: '/',
      icon: 'home',
    },
  ],
  sections: {
    directories: {
      id: 'directories',
      label: 'الأدلة الطبية',
      description: 'دلائل الخدمات الطبية الأساسية في مصر',
      icon: 'directory',
      isEnabled: true,
      items: [
        {
          id: 'directories-index',
          label: 'جميع الأدلة الطبية',
          href: '/directories',
          description: 'صفحة مجمعة لكل الأدلة الطبية',
          icon: 'directory',
          isFeatured: true,
        },
        {
          id: 'beauty-health',
          label: 'دليل الصحة والجمال',
          href: '/beauty-health',
          description: 'العناية بالبشرة والشعر والجمال الطبيعي',
          icon: 'sparkles',
        },
        {
          id: 'mental-health',
          label: 'دليل الصحة النفسية',
          href: '/mental-health',
          description: 'الهدوء والدعم النفسي ونصائح التوازن',
          icon: 'mind',
        },
        {
          id: 'first-aid',
          label: 'دليل الإسعافات الأولية',
          href: '/first-aid',
          description: 'خطوات الطوارئ والإسعاف السريع',
          icon: 'shield',
        },
        {
          id: 'sexual-health',
          label: 'دليل الصحة الجنسية',
          href: '/sexual-health',
          description: 'معلومات توعوية للصحة الإنجابية',
          icon: 'heart',
        },
        {
          id: 'fitness-health',
          label: 'دليل اللياقة البدنية',
          href: '/fitness-health',
          description: 'برامج لياقة وتغذية لحياة صحية',
          icon: 'fitness',
        },
        {
          id: 'drugs',
          label: 'دليل الأدوية',
          href: '/drugs',
          description: 'بحث شامل عن الأدوية',
          icon: 'pill',
        },
        {
          id: 'hospitals-pro',
          label: 'دليل المستشفيات',
          href: '/hospitals-pro',
          description: 'تجربة متقدمة للمستشفيات',
          icon: 'sparkles',
          isFeatured: true,
        },
        {
          id: 'emergency',
          label: 'دليل الطوارئ',
          href: '/emergency',
          description: 'أقسام الطوارئ وأرقام الإسعاف',
          icon: 'emergency',
        },
        {
          id: 'clinics',
          label: 'دليل العيادات',
          href: '/clinics',
          description: 'اختر العيادة المناسبة',
          icon: 'clinic',
        },
        {
          id: 'pharmacies',
          label: 'دليل الصيدليات',
          href: '/pharmacies',
          description: 'صيدليات تعمل بالقرب منك',
          icon: 'pharmacy',
        },
        {
          id: 'labs',
          label: 'دليل المعامل',
          href: '/labs',
          description: 'نتائج تحاليل موثوقة',
          icon: 'lab',
        },
        {
          id: 'doctors',
          label: 'دليل الأطباء',
          href: '/doctors',
          description: 'ابحث عن الأطباء حسب التخصص',
          icon: 'clinic',
        },
        {
          id: 'map',
          label: 'خريطة الخدمات',
          href: '/map',
          description: 'استعرض النقاط الطبية على الخريطة',
          icon: 'directory',
        },
        {
          id: 'nursing',
          label: 'دليل التمريض',
          href: '/nursing',
          description: 'خدمات تمريض منزلية',
          icon: 'nursing',
        },
      ],
    },
    tools: {
      id: 'tools',
      label: 'الأدوات الطبية',
      description: 'أدوات ذكية للصحة والمتابعة اليومية',
      icon: 'tools',
      isEnabled: true,
      items: [
        {
          id: 'weightTracker',
          label: 'متتبع الوزن',
          href: '/tools?tool=weightTracker',
          description: 'سجل وزنك يومياً',
          icon: 'chart',
          isFeatured: true,
        },
        {
          id: 'medicineReminder',
          label: 'تذكير الدواء',
          href: '/tools?tool=medicineReminder',
          description: 'جدول جرعات الأدوية',
          icon: 'clipboard',
          isFeatured: true,
        },
        {
          id: 'bmi',
          label: 'حاسبة BMI',
          href: '/tools?tool=bmi',
          description: 'احسب مؤشر الكتلة',
          icon: 'scale',
        },
        {
          id: 'calories',
          label: 'السعرات الحرارية',
          href: '/tools?tool=calories',
          description: 'احسب احتياجك اليومي',
          icon: 'bolt',
        },
        {
          id: 'bloodPressure',
          label: 'ضغط الدم',
          href: '/tools?tool=bloodPressure',
          description: 'تقييم قراءة الضغط',
          icon: 'heart',
        },
        {
          id: 'water',
          label: 'شرب الماء',
          href: '/tools?tool=water',
          description: 'الكمية المناسبة يومياً',
          icon: 'water',
        },
        {
          id: 'more-tools',
          label: 'جميع الأدوات الطبية',
          href: '/tools',
          description: 'استكشف جميع الأدوات المتقدمة',
          icon: 'sparkles',
          isFeatured: true,
        },
      ],
    },
    articles: {
      id: 'articles',
      label: 'المقالات الطبية',
      description: 'الأقسام الأكثر قراءة',
      icon: 'article',
      isEnabled: true,
      useAutoCategories: true,
      autoCount: 6,
      items: [
        {
          id: 'all-articles',
          label: 'عرض جميع المقالات',
          href: '/articles',
          description: 'استكشف كل المقالات الطبية',
          icon: 'article',
          isFeatured: true,
        },
        {
          id: 'nutrition',
          label: 'التغذية الصحية',
          href: '/articles?category=nutrition',
          description: 'خطط غذائية ونصائح يومية',
          icon: 'nutrition',
        },
        {
          id: 'mental-health',
          label: 'الصحة النفسية',
          href: '/articles?category=mental-health',
          description: 'راحة البال والهدوء',
          icon: 'mind',
        },
        {
          id: 'women-health',
          label: 'صحة المرأة',
          href: '/articles?category=women-health',
          description: 'رعاية شاملة للمرأة',
          icon: 'woman',
        },
        {
          id: 'chronic',
          label: 'الأمراض المزمنة',
          href: '/articles?category=chronic',
          description: 'إرشادات للمتابعة اليومية',
          icon: 'shield',
        },
        {
          id: 'kids-health',
          label: 'صحة الأطفال',
          href: '/articles?category=kids-health',
          description: 'نصائح للأمهات والآباء',
          icon: 'kids',
        },
        {
          id: 'fitness',
          label: 'اللياقة البدنية',
          href: '/articles?category=fitness',
          description: 'حركة ونشاط يومي',
          icon: 'fitness',
        },
        {
          id: 'medical-info',
          label: 'المعلومات الطبية',
          href: '/medical-info',
          description: 'محتوى طبي يومي وإرشادات موثوقة',
          icon: 'article',
        },
        {
          id: 'medical-videos',
          label: 'الفيديوهات الطبية',
          href: '/medical-videos',
          description: 'فيديوهات توعوية وتمارين صحية',
          icon: 'article',
        },
        {
          id: 'all-categories',
          label: 'عرض جميع التصنيفات',
          href: '/articles/categories',
          description: 'استكشف جميع التصنيفات الطبية',
          icon: 'article',
          isFeatured: true,
        },
      ],
    },
  },
  actions: {
    showSearch: true,
    showThemeToggle: true,
    showContact: true,
    showAuth: true,
  },
  contactLink: {
    id: 'contact',
    label: 'اتصل بنا',
    href: '/contact',
    icon: 'phone',
  },
};

export const getDefaultNavbarConfig = (): NavbarConfig =>
  JSON.parse(JSON.stringify(DEFAULT_NAVBAR_CONFIG)) as NavbarConfig;
