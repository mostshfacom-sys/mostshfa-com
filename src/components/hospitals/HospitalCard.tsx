import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { EntityImage } from '@/components/ui/EntityImage';
import type { Hospital } from '@/types';

interface HospitalCardProps {
  hospital: Hospital;
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  return (
    <Link href={`/hospitals/${hospital.slug}`}>
      <Card variant="hover" padding="none" className="h-full">
        {/* Image */}
        <div className="relative h-40">
          <EntityImage
            src={hospital.logo}
            alt={hospital.nameAr}
            entityType="hospital"
            entityId={hospital.id}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Featured Badge */}
          {hospital.isFeatured && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="warning" size="sm">مميز</Badge>
            </div>
          )}
          
          {/* Emergency Badge */}
          {hospital.hasEmergency && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="danger" size="sm">طوارئ 24 ساعة</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {hospital.nameAr}
          </h3>
          
          {/* Type */}
          {hospital.type && (
            <p className="text-sm text-gray-500 mb-2">
              {hospital.type.nameAr}
            </p>
          )}
          
          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">
              {hospital.governorate?.nameAr}
              {hospital.city && ` - ${hospital.city.nameAr}`}
            </span>
          </div>
          
          {/* Rating & Phone */}
          <div className="flex items-center justify-between">
            <Rating 
              value={Number(hospital.ratingAvg)} 
              size="sm" 
              showCount 
              count={hospital.ratingCount} 
            />
            
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>اتصل</span>
              </a>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
