'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ScaleIcon } from '@heroicons/react/24/solid';
import { useCompare } from '@/hooks/useCompare';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const router = useRouter();

  if (compareList.length === 0) {
    return null;
  }

  const compareUrl = `/compare?items=${encodeURIComponent(JSON.stringify(compareList.map(h => ({ id: h.id, type: 'hospital' as const }))))}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-800 border-t-2 border-teal-500 shadow-2xl"
      >
        <div className="container mx-auto px-6 py-4 max-w-[1920px]">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <ScaleIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-neutral-900 dark:text-white">
                مقارنة المستشفيات ({compareList.length}/3)
              </h3>
            </div>

            {/* Hospitals */}
            <div className="flex items-center gap-3 flex-1 overflow-x-auto">
              {compareList.map((hospital) => (
                <div
                  key={hospital.id}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg"
                >
                  {hospital.logo_url && (
                    <Image
                      src={hospital.logo_url}
                      alt={hospital.name_ar}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                    {hospital.name_ar}
                  </span>
                  <button
                    onClick={() => removeFromCompare(hospital.id)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {compareList.length >= 2 && (
                <button
                  onClick={() => router.push(compareUrl)}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors whitespace-nowrap"
                >
                  مقارنة الآن
                </button>
              )}
              <button
                onClick={clearCompare}
                className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                مسح الكل
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}