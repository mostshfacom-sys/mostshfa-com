
'use client';

import { useState, useEffect } from 'react';
import { ComputerDesktopIcon, GlobeAltIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const SERVERS = [
  { label: 'الافتراضي (Next.js)', value: '' },
  { label: 'سيرفر محلي (3000)', value: 'http://localhost:3000' },
  { label: 'سيرفر محلي (3001)', value: 'http://localhost:3001' },
  { label: 'سيرفر تجريبي (Staging)', value: 'https://staging.mostshfa.com' },
];

export function ServerSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('api_url_override') || '';
    setCurrentUrl(saved);
  }, []);

  const handleSelect = (url: string) => {
    localStorage.setItem('api_url_override', url);
    setCurrentUrl(url);
    setIsOpen(false);
    // Reload to apply changes across all components
    window.location.reload();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl) {
      handleSelect(customUrl);
    }
  };

  const currentServerLabel = SERVERS.find(s => s.value === currentUrl)?.label || 'سيرفر مخصص';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 transition-all shadow-sm"
        title="تغيير السيرفر للتجربة"
      >
        <ComputerDesktopIcon className="w-4 h-4 text-teal-500" />
        <span className="hidden sm:inline">{currentServerLabel}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-4 z-[101] overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4 text-neutral-900 dark:text-white font-bold">
                <Cog8ToothIcon className="w-5 h-5 text-teal-500" />
                <span>إعدادات السيرفر</span>
              </div>

              <div className="space-y-1.5 mb-4">
                {SERVERS.map((server) => (
                  <button
                    key={server.value}
                    onClick={() => handleSelect(server.value)}
                    className={`w-full text-right px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                      currentUrl === server.value 
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{server.label}</span>
                    {currentUrl === server.value && (
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] text-neutral-500 font-bold px-1 uppercase tracking-wider">سيرفر مخصص (URL)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-teal-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-teal-500/20"
                  >
                    حفظ
                  </button>
                </div>
              </form>

              {currentUrl && (
                <div className="mt-4 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>تنبيه:</strong> أنت متصل حالياً بسيرفر مخصص. قد تختلف البيانات أو تظهر أخطاء إذا لم يكن السيرفر متاحاً.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
