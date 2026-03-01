'use client';

import { PhoneIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { InteractiveMap } from '@/components/maps';
import { GuideConfig } from '@/config/guide-config';

interface FirstAidSectionProps {
  guide: Omit<GuideConfig, 'icon'>;
}

const EMERGENCY_NUMBERS = [
  { number: '123', label: 'الإسعاف', description: 'للحالات الطبية الطارئة والحوادث', icon: '🚑' },
  { number: '122', label: 'النجدة', description: 'للحالات الأمنية الطارئة', icon: '🚓' },
  { number: '180', label: 'المطافي', description: 'للحرائق والحوادث', icon: '🚒' },
  { number: '137', label: 'السموم', description: 'مركز السموم (طوارئ)', icon: '☠️' },
];

export default function FirstAidSection({ guide }: FirstAidSectionProps) {
  return (
    <section className="mb-20 space-y-16">
      
      {/* Emergency Numbers Grid */}
      <div id="emergency-numbers" className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] p-8 md:p-12 border border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <PhoneIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">أرقام الطوارئ في مصر</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">احفظ هذه الأرقام، قد تنقذ حياة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EMERGENCY_NUMBERS.map((item) => (
            <a 
              key={item.number} 
              href={`tel:${item.number}`}
              className="flex items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/20 hover:shadow-lg hover:border-red-300 transition-all group"
            >
              <div className="text-4xl ml-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.label}</h3>
                  <span className="text-2xl font-black text-red-600 dark:text-red-400 font-mono tracking-widest">{item.number}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div>
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <MapPinIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">أقرب نقاط الإسعاف والمستشفيات</h2>
        </div>
        <div className="rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 relative">
            <InteractiveMap 
                entityTypes={['ambulance']}
                showSearch={true}
                showDirections={true}
            />
            {/* Overlay to indicate this is focusing on emergency */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 z-[1000]">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">يظهر نقاط الإسعاف القريبة</span>
            </div>
        </div>
      </div>

      {/* Rich Info / Instructions */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">تعليمات هامة قبل وصول الإسعاف</h3>
            </div>
            <ul className="space-y-4">
                {[
                    'تأكد من سلامة المكان حول المصاب أولاً.',
                    'لا تحرك المصاب إلا إذا كان في خطر محدق (حريق مثلاً).',
                    'تحقق من الوعي والتنفس.',
                    'اضغط على الجرح النازف بقطعة قماش نظيفة.',
                    'هدئ المصاب وتحدث معه باستمرار.',
                    'أرسل شخصاً لانتظار سيارة الإسعاف في مكان واضح.'
                ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{i + 1}</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
                    </li>
                ))}
            </ul>
        </div>
        
        {/* Added extra info card for balance */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] p-8 border border-blue-100 dark:border-blue-900/30">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xl">ℹ️</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ماذا تقول لموظف الإسعاف؟</h3>
            </div>
            <ul className="space-y-4">
                 {[
                    'حدد موقعك بدقة (اسم الشارع، رقم العقار، علامة مميزة).',
                    'صف حالة المصاب (واعي/غير واعي، يتنفس/لا يتنفس، ينزف).',
                    'اذكر عدد المصابين وأعمارهم التقريبية.',
                    'لا تغلق الخط حتى يطلب منك الموظف ذلك.'
                ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-2.5"></span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </section>
  );
}
