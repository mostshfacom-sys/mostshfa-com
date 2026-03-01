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
  FireIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { EntityImage } from '@/components/ui/EntityImage';

interface HospitalCardListProps {
  hospital: Hospital;
  searchQuery?: string;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

export function HospitalCardList({ hospital, searchQuery, index, isFavorite = false, onToggleFavorite }: HospitalCardListProps) {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="h-full"
    >
      <Link 
        href={`/hospitals-pro/${hospital.id}`}
        className="block group h-full"
      >
        <article className="flex h-full gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 dark:hover:border-teal-500">
          
          {/* Image */}
          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
            <EntityImage
              src={hospital.logo_url}
              alt={hospital.name_ar}
              entityType="hospital"
              entityId={hospital.id}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="128px"
            />
            
            {/* Rating Overlay */}
            {hasRating && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 px-2 py-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-md">
                <StarIcon className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col space-y-2">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {hospital.name_ar}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {hospital.match_context && matchColors && (
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${matchColors.bg} ${matchColors.text} ${matchColors.border}`}>
                  <span>تطابق في: {hospital.match_context.type}</span>
                </div>
              )}

              {hospital.is_featured && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-md flex items-center gap-1">
                  <FireIcon className="w-3 h-3" />
                  مميز
                </span>
              )}

              {hospital.is_open && (
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-md flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  مفتوح
                </span>
              )}

              {hospital.has_emergency && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-md flex items-center gap-1">
                  <HeartSolid className="w-3 h-3" />
                  طوارئ
                </span>
              )}
            </div>

            {/* Hospital Type */}
            {hospital.hospital_type_name_ar && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <BuildingOffice2Icon className="w-4 h-4" />
                <span>{hospital.hospital_type_name_ar}</span>
              </div>
            )}
            
            {/* Location */}
            {location && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <MapPinIcon className="w-4 h-4" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}

            {/* Specialties */}
            {hospital.specialties && hospital.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hospital.specialties.slice(0, 4).map((specialty) => (
                  <span
                    key={specialty.id}
                    className="px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-md"
                  >
                    {specialty.name_ar}
                  </span>
                ))}
                {hospital.specialties.length > 4 && (
                  <span className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-md">
                    +{hospital.specialties.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Bottom Row: Actions */}
            <div className="flex items-center justify-between gap-3 pt-1 mt-auto">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                {hospital.branches_count > 0 && (
                  <span>{hospital.branches_count} فرع</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Favorite Button */}
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleFavorite(hospital.id);
                    }}
                    className={`p-1.5 rounded-md transition-all ${
                      isFavorite
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 hover:text-red-500'
                    }`}
                    aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    {isFavorite ? (
                      <HeartSolid className="w-4 h-4" />
                    ) : (
                      <HeartOutline className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {hospital.phone && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `tel:${hospital.phone}`;
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    <PhoneIcon className="w-3 h-3" />
                    اتصل
                  </button>
                )}
                
                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 text-xs font-medium group-hover:gap-2 transition-all">
                  <span>التفاصيل</span>
                  <ChevronLeftIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}