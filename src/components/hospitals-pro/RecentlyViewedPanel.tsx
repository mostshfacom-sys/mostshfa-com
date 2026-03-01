'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Image from 'next/image';
import Link from 'next/link';

export function RecentlyViewedPanel() {
  const { recentHospitals, clearRecent } = useRecentlyViewed();

  if (recentHospitals.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-neutral-900 dark:text-white">
            شاهدت مؤخراً
          </h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            ({recentHospitals.length})
          </span>
        </div>
        
        <button
          onClick={clearRecent}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          مسح الكل
        </button>
      </div>

      {/* Hospitals List */}
      <div className="p-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          <AnimatePresence>
            {recentHospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/hospitals-pro/${hospital.id}`}
                  className="block group"
                >
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors w-32">
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                      {hospital.logo_url ? (
                        <Image
                          src={hospital.logo_url}
                          alt={hospital.name_ar}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🏥
                        </div>
                      )}
                    </div>
                    
                    {/* Name */}
                    <p className="text-sm font-medium text-neutral-900 dark:text-white text-center line-clamp-2 leading-tight">
                      {hospital.name_ar}
                    </p>
                    
                    {/* Type */}
                    {hospital.hospital_type_name_ar && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center line-clamp-1">
                        {hospital.hospital_type_name_ar}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}