
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapIcon } from '@heroicons/react/24/outline';
import { ClinicInteractiveMap } from './ClinicInteractiveMap';
import type { Clinic } from '@/types/clinic';

interface MapViewButtonProps {
  clinics?: Clinic[];
  compact?: boolean;
  className?: string;
}

export function MapViewButton({ clinics = [], compact = false, className = '' }: MapViewButtonProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowMap(true)}
        className={`${
          compact
            ? 'flex flex-col items-center justify-center gap-1 px-2 py-2 text-[10px]'
            : 'flex items-center gap-2 px-4 py-3 text-sm'
        } bg-gradient-to-r from-cyan-500/40 to-blue-500/40 hover:from-cyan-500/50 hover:to-blue-500/50 backdrop-blur-md border-2 border-cyan-400/50 hover:border-cyan-400/70 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40 whitespace-nowrap cursor-pointer ${className}`}
        type="button"
        title="عرض العيادات على الخريطة"
      >
        <MapIcon className={compact ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
        <span className={compact ? 'text-[10px] leading-tight' : ''}>عرض الخريطة</span>
        {!compact && (
          <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
        )}
      </motion.button>

      <AnimatePresence>
        {showMap && (
          <ClinicInteractiveMap 
            clinics={clinics}
            onClose={() => setShowMap(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
