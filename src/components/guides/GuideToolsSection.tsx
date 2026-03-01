'use client';

import { useState } from 'react';
import { 
  ChevronLeftIcon, 
  WrenchScrewdriverIcon,
  XMarkIcon,
  CalculatorIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  PhoneIcon,
  FireIcon,
  SparklesIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  CloudIcon,
  HeartIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { GuideConfig } from '@/config/guide-config';
import { getToolComponent } from './GuideToolsImplementation';

// Import tool components (we might need to refactor LegacyToolsPage to export these or copy logic)
// For now, we will implement the logic directly here for the common tools to ensure they work immediately.

const iconMap: Record<string, any> = {
  calculator: CalculatorIcon,
  calendar: CalendarIcon,
  chat: ChatBubbleBottomCenterTextIcon,
  phone: PhoneIcon,
  fire: FireIcon,
  sparkles: SparklesIcon,
  water: BeakerIcon,
  clipboard: ClipboardDocumentCheckIcon,
  wind: CloudIcon,
  scale: ScaleIcon,
  heart: HeartIcon,
  clock: ClockIcon,
  trending: ArrowTrendingUpIcon,
  bolt: BoltIcon,
  chart: ChartBarIcon,
  default: WrenchScrewdriverIcon
};

interface GuideToolsSectionProps {
  guide: Omit<GuideConfig, 'icon'>;
}

export default function GuideToolsSection({ guide }: GuideToolsSectionProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Remove all local state for calculators (moved to GuideToolsImplementation)

  if (!guide.tools || guide.tools.length === 0) return null;

  return (
    <>
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${guide.theme.bgLight}`}>
                <WrenchScrewdriverIcon className={`w-6 h-6 ${guide.theme.text}`} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">أدوات مساعدة</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guide.tools.map((tool, idx) => {
                const ToolIcon = iconMap[tool.icon] || iconMap.default;
                return (
                    <button 
                        key={idx} 
                        onClick={() => {
                            setActiveTool(tool.title);
                            setActiveToolId(tool.href);
                        }}
                        className="group block h-full text-right w-full text-slate-900"
                    >
                        <div className={`h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-${guide.color}-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-sm`}>
                            <div className={`w-12 h-12 rounded-xl ${guide.theme.bgLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <ToolIcon className={`w-6 h-6 ${guide.theme.text}`} />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 text-slate-900 dark:text-white group-hover:${guide.theme.text} transition-colors`}>{tool.title}</h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 flex-grow leading-relaxed">{tool.description}</p>
                            <span className={`text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:${guide.theme.text} flex items-center gap-1 mt-auto`}>
                                ابدأ الاستخدام <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
      </section>

      {/* Tool Modal */}
      {activeTool && activeToolId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveTool(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeTool}</h3>
              <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {getToolComponent(activeToolId, guide)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
