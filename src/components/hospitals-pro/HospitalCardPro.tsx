'use client';

import { Hospital } from '@/types/hospital';
import { getMatchContextColors } from '@/lib/api/hospitals';
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
  TruckIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EntityImage } from '@/components/ui/EntityImage';
import { useState } from 'react';

interface HospitalCardProProps {
  hospital: Hospital & {
    beds?: number;
    has_ambulance?: boolean;
    wheelchair_accessible?: boolean;
  };
  searchQuery?: string;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function HospitalCardPro({ hospital, searchQuery, index, isFavorite = false, onToggleFavorite }: HospitalCardProProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Convert rating_avg to number safely
  const rating = typeof hospital.rating_avg === 'number' 
    ? hospital.rating_avg 
    : parseFloat(String(hospital.rating_avg || 0));
  
  const hasRating = rating > 0;
  
  const location = [hospital.governorate_name, hospital.city_name]
    .filter(Boolean)
    .join(' - ');

  // Get match context colors
  const matchColors = hospital.match_context 
    ? getMatchContextColors(hospital.match_context.color)
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
        href={`/hospitals-pro/${hospital.id}`}
        className="block group"
      >
        <article className="relative h-[480px] rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300">
          
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <EntityImage
              src={hospital.logo_url}
              alt={hospital.name_ar}
              entityType="hospital"
              entityId={hospital.id}
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
              {hospital.is_featured && (
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
              
              {hospital.has_emergency && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <ClockIcon className="w-3 h-3" />
                  طوارئ 24/7
                </motion.span>
              )}
              
              {hospital.has_ambulance && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <TruckIcon className="w-3 h-3" />
                  إسعاف
                </motion.span>
              )}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(hospital.id);
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                  isFavorite 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
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

          {/* Content - Bottom Aligned */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            {/* Type & Match Context */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-medium bg-white/20 text-white backdrop-blur-sm rounded-lg border border-white/10">
                {hospital.hospital_type_name_ar || 'مستشفى'}
              </span>
              
              {hospital.match_context && (
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${matchColors?.bg} ${matchColors?.text}`}>
                  <SparklesIcon className="w-3 h-3" />
                  {hospital.match_context.text}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
              {hospital.name_ar}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-primary-400" />
                <span className="line-clamp-1">{location || 'مصر'}</span>
              </div>
              
              {hasRating && (
                <div className="flex items-center gap-1 text-amber-400">
                  <StarIcon className="w-4 h-4" />
                  <span className="font-bold">{rating.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">({hospital.rating_count})</span>
                </div>
              )}
            </div>
            
            {/* Detailed Stats Row (New) */}
            <div className="flex items-center gap-3 mb-4 text-xs text-gray-300 border-t border-white/10 pt-3">
               {hospital.beds && hospital.beds > 0 && (
                 <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                   <BuildingOffice2Icon className="w-3 h-3 text-blue-400" />
                   <span>{hospital.beds} سرير</span>
                 </div>
               )}
               
               {hospital.wheelchair_accessible && (
                 <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                   <span className="text-emerald-400">♿</span>
                   <span>مجهز للكراسي</span>
                 </div>
               )}
               
               {hospital.phone && (
                 <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded ml-auto">
                   <PhoneIcon className="w-3 h-3 text-green-400" />
                   <span>متاح</span>
                 </div>
               )}
            </div>

            {/* Specialties (Horizontal Scroll) */}
            {hospital.specialties && hospital.specialties.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {hospital.specialties.slice(0, 3).map((spec) => (
                  <span 
                    key={spec.id}
                    className="px-2.5 py-1 text-xs text-gray-300 bg-white/5 rounded-md border border-white/5 whitespace-nowrap"
                  >
                    {spec.name_ar}
                  </span>
                ))}
                {hospital.specialties.length > 3 && (
                  <span className="px-2.5 py-1 text-xs text-gray-400 bg-white/5 rounded-md border border-white/5 whitespace-nowrap">
                    +{hospital.specialties.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}