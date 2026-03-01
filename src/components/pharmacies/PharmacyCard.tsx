'use client';

import { motion } from 'framer-motion';
import { 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon,
  HeartIcon as HeartSolid,
  TruckIcon,
  BeakerIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { EntityImage } from '@/components/ui/EntityImage';
import { useState } from 'react';

interface PharmacyCardProps {
  pharmacy: any;
  searchQuery?: string;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function PharmacyCard({ pharmacy, searchQuery, index, isFavorite = false, onToggleFavorite }: PharmacyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const location = [pharmacy.governorate?.nameAr, pharmacy.city?.nameAr]
    .filter(Boolean)
    .join(' - ');

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
        href={`/pharmacies/${pharmacy.id}`}
        className="block group"
      >
        <article className="relative h-[420px] rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300">
          
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <EntityImage
              src={pharmacy.logo}
              alt={pharmacy.nameAr}
              entityType="pharmacy"
              entityId={pharmacy.id}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
          </div>

          {/* Top Badges */}
          <div className="relative z-10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-2">
              {pharmacy.is24h && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <ClockIcon className="w-3 h-3" />
                  24 ساعة
                </motion.span>
              )}
              
              {pharmacy.hasDeliveryService && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <TruckIcon className="w-3 h-3" />
                  توصيل
                </motion.span>
              )}

              {pharmacy.hasNursingService && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-full shadow-lg flex items-center gap-1"
                >
                  <BeakerIcon className="w-3 h-3" />
                  خدمات تمريض
                </motion.span>
              )}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(pharmacy.id);
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
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
              {pharmacy.nameAr}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-primary-400" />
                <span className="line-clamp-1">{location || 'مصر'}</span>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-2 text-xs text-gray-300 border-t border-white/10 pt-3">
               {pharmacy.phone && (
                 <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                   <PhoneIcon className="w-3 h-3 text-green-400" />
                   <span>{pharmacy.phone}</span>
                 </div>
               )}
               
               {pharmacy.hotline && (
                 <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                   <PhoneIcon className="w-3 h-3 text-red-400" />
                   <span>{pharmacy.hotline}</span>
                 </div>
               )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
