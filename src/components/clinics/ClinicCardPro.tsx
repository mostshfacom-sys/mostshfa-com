
'use client';

import { Clinic } from '@/types/clinic';
import { getMatchContextColors } from '@/lib/api/clinics';
import { motion } from 'framer-motion';
import { 
  MapPinIcon, 
  PhoneIcon, 
  StarIcon,
  BuildingOffice2Icon,
  ClockIcon,
  HeartIcon as HeartSolid,
  FireIcon,
  ShareIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EntityImage } from '@/components/ui/EntityImage';
import { useState } from 'react';

interface ClinicCardProProps {
  clinic: Clinic;
  searchQuery?: string;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function ClinicCardPro({ clinic, searchQuery, index, isFavorite = false, onToggleFavorite }: ClinicCardProProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const rating = typeof clinic.ratingAvg === 'number' 
    ? clinic.ratingAvg 
    : parseFloat(String(clinic.ratingAvg || 0));
  
  const hasRating = rating > 0;
  
  const location = [clinic.governorate?.nameAr, clinic.city?.nameAr]
    .filter(Boolean)
    .join(' - ');

  // Get match context colors
  const matchColors = clinic.match_context 
    ? getMatchContextColors(clinic.match_context.color)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link 
        href={`/clinics/${clinic.slug}`}
        className="block group"
      >
        <article className="relative h-[480px] rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300">
          
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <EntityImage
              src={clinic.image || clinic.logo}
              alt={clinic.nameAr}
              entityType="clinic"
              entityId={clinic.id}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
          </div>

          {/* Top Badges - Always Visible */}
          <div className="relative z-10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-2">
              {clinic.isFeatured && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <FireIcon className="w-3 h-3" />
                  مميز
                </motion.span>
              )}
              
              {clinic.isOpen && (
                <span className="px-3 py-1.5 text-xs font-bold bg-green-500/90 backdrop-blur-md text-white rounded-full shadow-lg flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  مفتوح
                </span>
              )}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(clinic.id);
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                  isFavorite 
                    ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isFavorite ? (
                  <HeartSolid className="w-5 h-5" />
                ) : (
                  <HeartOutline className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Content Area - Bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 z-10">
            <div className="space-y-4">
              
              {/* Match Context Badge (Search Highlighting) */}
              {clinic.match_context && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md mb-2 ${matchColors?.bg} ${matchColors?.text} ${matchColors?.border}`}
                >
                  <SparklesIcon className="w-3 h-3" />
                  <span>مطابق في {clinic.match_context.type}: </span>
                  <span className="underline decoration-wavy underline-offset-2">
                    {clinic.match_context.text || searchQuery}
                  </span>
                </motion.div>
              )}

              {/* Title & Rating */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-teal-400 transition-colors line-clamp-2">
                    {clinic.nameAr}
                  </h3>
                  {hasRating && (
                    <div className="flex items-center gap-1 bg-amber-400/90 text-black px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                      <StarIcon className="w-3.5 h-3.5" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-neutral-300 text-sm mb-2">
                  <MapPinIcon className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="truncate">{location || 'مصر'}</span>
                </div>

                {/* Consultation Fee & Waiting Time */}
                <div className="flex items-center gap-4 text-neutral-400 text-[11px] font-bold mb-3">
                  {clinic.consultationFee && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-teal-400">الكشف:</span>
                      <span className="text-white">{clinic.consultationFee} ج.م</span>
                    </div>
                  )}
                  {clinic.waitingTime && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-amber-400">الانتظار:</span>
                      <span className="text-white">{clinic.waitingTime}</span>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {clinic.specialties && clinic.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {clinic.specialties.slice(0, 3).map(spec => (
                      <span 
                        key={spec.id}
                        className="px-2 py-1 bg-white/10 text-white/90 text-xs rounded-md border border-white/10"
                      >
                        {spec.nameAr}
                      </span>
                    ))}
                    {clinic.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-md border border-white/5">
                        +{clinic.specialties.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // Call handler
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-teal-900/20"
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>اتصل الآن</span>
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors backdrop-blur-md border border-white/10">
                  <span>التفاصيل</span>
                  <ShareIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
