import Link from 'next/link';

const sections = [
  {
    title: 'التحكم العام',
    description: 'إعدادات الهيدر العامة التي تنطبق على كل الصفحات عند تفعيلها.',
    items: [
      {
        href: '/admin/master-banner',
        label: 'بانر الماستر',
        description: 'يطبق على جميع الصفحات عند تحديده.',
        tone: 'bg-sky-50 text-sky-700',
        icon: '🎛️',
      },
    ],
  },
  {
    title: 'الأقسام الرئيسية',
    description: 'تحكم في بانرات الأدلة والخدمات الأساسية.',
    items: [
      {
        href: '/admin/hospitals-banner',
        label: 'بانر المستشفيات',
        description: 'دليل المستشفيات والخدمات الطبية.',
        tone: 'bg-emerald-50 text-emerald-700',
        icon: '🏥',
      },
      {
        href: '/admin/clinics-banner',
        label: 'بانر العيادات',
        description: 'دليل العيادات والتخصصات.',
        tone: 'bg-green-50 text-green-700',
        icon: '🏢',
      },
      {
        href: '/admin/labs-banner',
        label: 'بانر المعامل',
        description: 'خدمات المعامل والتحاليل.',
        tone: 'bg-purple-50 text-purple-700',
        icon: '🧪',
      },
      {
        href: '/admin/pharmacies-banner',
        label: 'بانر الصيدليات',
        description: 'دليل الصيدليات وخدمات الدواء.',
        tone: 'bg-red-50 text-red-700',
        icon: '💊',
      },
      {
        href: '/admin/doctors-banner',
        label: 'بانر الأطباء',
        description: 'دليل الأطباء والمتخصصين.',
        tone: 'bg-cyan-50 text-cyan-700',
        icon: '👨‍⚕️',
      },
      {
        href: '/admin/drugs-banner',
        label: 'بانر الأدوية',
        description: 'قاعدة بيانات الأدوية.',
        tone: 'bg-yellow-50 text-yellow-700',
        icon: '💉',
      },
      {
        href: '/admin/emergency-banner',
        label: 'بانر الطوارئ',
        description: 'صفحة خدمات الطوارئ.',
        tone: 'bg-orange-50 text-orange-700',
        icon: '🚑',
      },
      {
        href: '/admin/nursing-banner',
        label: 'بانر التمريض',
        description: 'خدمات التمريض المنزلي.',
        tone: 'bg-emerald-50 text-emerald-700',
        icon: '🩺',
      },
      {
        href: '/admin/home-banner',
        label: 'بانر الرئيسية',
        description: 'الهيدر الرئيسي للصفحة الرئيسية.',
        tone: 'bg-slate-50 text-slate-700',
        icon: '🏠',
      },
      {
        href: '/admin/directories-banner',
        label: 'بانر الأدلة الطبية',
        description: 'صفحة الأدلة الطبية الشاملة.',
        tone: 'bg-teal-50 text-teal-700',
        icon: '📚',
      },
      {
        href: '/admin/tools-banner',
        label: 'بانر الأدوات الطبية',
        description: 'صفحة الأدوات الطبية الذكية.',
        tone: 'bg-violet-50 text-violet-700',
        icon: '🧰',
      },
      {
        href: '/admin/medical-info-banner',
        label: 'بانر المعلومات الطبية',
        description: 'صفحة المعلومات الطبية.',
        tone: 'bg-sky-50 text-sky-700',
        icon: '🧠',
      },
      {
        href: '/admin/medical-videos-banner',
        label: 'بانر الفيديوهات الطبية',
        description: 'صفحة الفيديوهات الطبية.',
        tone: 'bg-indigo-50 text-indigo-700',
        icon: '🎥',
      },
    ],
  },
  {
    title: 'المحتوى والمقالات',
    description: 'بانرات صفحات المقالات والتصنيفات.',
    items: [
      {
        href: '/admin/articles-banner',
        label: 'بانر المقالات',
        description: 'المقالات الطبية.',
        tone: 'bg-rose-50 text-rose-700',
        icon: '📰',
      },
      {
        href: '/admin/articles-categories-banner',
        label: 'بانر تصنيفات المقالات',
        description: 'تصنيفات المقالات الطبية.',
        tone: 'bg-pink-50 text-pink-700',
        icon: '🗂️',
      },
    ],
  },
  {
    title: 'الصفحات المعلوماتية',
    description: 'تحكم في بانرات الصفحات التعريفية والخدمية.',
    items: [
      {
        href: '/admin/about-banner',
        label: 'بانر من نحن',
        description: 'صفحة التعريف بالمنصة.',
        tone: 'bg-indigo-50 text-indigo-700',
        icon: 'ℹ️',
      },
      {
        href: '/admin/contact-banner',
        label: 'بانر اتصل بنا',
        description: 'صفحة التواصل والدعم.',
        tone: 'bg-emerald-50 text-emerald-700',
        icon: '☎️',
      },
      {
        href: '/admin/privacy-banner',
        label: 'بانر سياسة الخصوصية',
        description: 'صفحة الخصوصية.',
        tone: 'bg-slate-50 text-slate-700',
        icon: '🔒',
      },
      {
        href: '/admin/terms-banner',
        label: 'بانر الشروط والأحكام',
        description: 'صفحة الشروط والأحكام.',
        tone: 'bg-amber-50 text-amber-700',
        icon: '📜',
      },
      {
        href: '/admin/search-banner',
        label: 'بانر البحث',
        description: 'صفحة البحث العامة.',
        tone: 'bg-blue-50 text-blue-700',
        icon: '🔎',
      },
    ],
  },
];

export default function HeaderSettingsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات الهيدر</h1>
        <p className="text-gray-600">
          اختر الصفحة المطلوبة لضبط بانر الهيدر الخاص بها. كل صفحة لها إعدادات مستقلة.
        </p>
      </header>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-gray-100 p-4 transition hover:shadow-md hover:border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.tone}`}>
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
