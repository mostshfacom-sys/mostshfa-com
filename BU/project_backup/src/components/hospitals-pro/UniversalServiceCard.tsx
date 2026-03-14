'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  HomeIcon,
  ComputerDesktopIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// Types
// ============================================================================

interface Hospital {
  id: number;
  nameAr: string;
  nameEn?: string;
  slug: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  logo?: string;
  description?: string;
  hasEmergency: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  lat?: number;
  lng?: number;
  isVerified?: boolean;
  type?: {
    nameAr: string;
    nameEn?: string;
    icon?: string;
    color?: string;
  };
  governorate?: {
    nameAr: string;
  };
  city?: {
    nameAr: string;
  };
  specialties?: Array<{
    nameAr: string;
    nameEn?: string;
  }>;
  metadata?: any;
  workingHours?: any;
  services?: any;
  emergencyServices?: any;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  languagesSpoken?: any;
}

// ============================================================================
// Service Card Props
// ============================================================================

interface UniversalServiceCardProps {
  hospital: Hospital;
  variant?: 'grid' | 'list' | 'compact';
  showComparison?: boolean;
  showFavorites?: boolean;
  highlightTerms?: string[];
  onHospitalClick?: (hospital: Hospital) => void;
  onFavoriteToggle?: (hospitalId: number, isFavorite: boolean) => void;
  onComparisonToggle?: (hospitalId: number, isSelected: boolean) => void;
  onShare?: (hospital: Hospital) => void;
  isFavorite?: boolean;
  isInComparison?: boolean;
  showDistance?: boolean;
  distance?: number;
  className?: string;
}

// ============================================================================
// Universal Service Card Component
// ============================================================================

export const UniversalServiceCard: React.FC<UniversalServiceCardProps> = ({
  hospital,
  variant = 'grid',
  showComparison = true,
  showFavorites = true,
  highlightTerms = [],
  onHospitalClick,
  onFavoriteToggle,
  onComparisonToggle,
  onShare,
  isFavorite = false,
  isInComparison = false,
  showDistance = false,
  distance,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get current status
  const isOpen = getCurrentStatus(hospital);
  
  // Get hospital-specific features
  const features = getHospitalFeatures(hospital);
  
  // Handle click
  const handleClick = () => {
    if (onHospitalClick) {
      onHospitalClick(hospital);
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(hospital.id, !isFavorite);
    }
  };

  // Handle comparison toggle
  const handleComparisonToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComparisonToggle) {
      onComparisonToggle(hospital.id, !isInComparison);
    }
  };

  // Handle share
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(hospital);
    }
  };

  // Highlight text
  const highlightText = (text: string) => {
    if (highlightTerms.length === 0) return text;
    
    let highlightedText = text;
    highlightTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Render based on variant
  if (variant === 'compact') {
    return <CompactServiceCard {...{ hospital, features, isOpen, handleClick, className }} />;
  }

  if (variant === 'list') {
    return (
      <ListServiceCard 
        hospital={hospital}
        features={features}
        isOpen={isOpen}
        imageError={imageError}
        setImageError={setImageError}
        highlightText={highlightText}
        showDistance={showDistance}
        distance={distance}
        showFavorites={showFavorites}
        showComparison={showComparison}
        isFavorite={isFavorite}
        isInComparison={isInComparison}
        handleClick={handleClick}
        handleFavoriteToggle={handleFavoriteToggle}
        handleComparisonToggle={handleComparisonToggle}
        handleShare={handleShare}
        className={className}
      />
    );
  }

  // Grid variant (default)
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-cyan-50">
        {hospital.logo && !imageError ? (
          <Image
            src={hospital.logo}
            alt={hospital.nameAr}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🏥
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge isOpen={isOpen} />
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-3 left-3 flex gap-2">
          {showFavorites && (
            <button
              onClick={handleFavoriteToggle}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              {isFavorite ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}
          
          {showComparison && (
            <button
              onClick={handleComparisonToggle}
              className={`p-2 backdrop-blur-sm rounded-full transition-colors ${
                isInComparison 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/90 text-gray-600 hover:bg-white'
              }`}
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Features Badges */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {features.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md"
              title={feature.label}
            >
              <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
            </div>
          ))}
          {features.length > 3 && (
            <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-600">
              +{features.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {highlightText(hospital.nameAr)}
            </h3>
            {hospital.nameEn && (
              <p className="text-sm text-gray-500 truncate">
                {highlightText(hospital.nameEn)}
              </p>
            )}
          </div>
          
          {hospital.isVerified && (
            <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
          )}
        </div>

        {/* Rating */}
        <div className="mb-3">
          <CompactRating 
            rating={hospital.ratingAvg} 
            count={hospital.ratingCount}
            size="sm"
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {hospital.city?.nameAr}، {hospital.governorate?.nameAr}
          </span>
          {showDistance && distance && (
            <span className="text-blue-600 font-medium">
              ({distance.toFixed(1)} كم)
            </span>
          )}
        </div>

        {/* Type and Specialties */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {hospital.type && (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {hospital.type.nameAr}
              </span>
            )}
            {hospital.specialties?.slice(0, 2).map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
              >
                {specialty.nameAr}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {hospital.phone && (
              <div className="flex items-center gap-1">
                <PhoneIcon className="w-4 h-4" />
                <span>هاتف</span>
              </div>
            )}
            
            {hospital.hasEmergency && (
              <div className="flex items-center gap-1 text-red-600">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>طوارئ</span>
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Compact Service Card
// ============================================================================

interface CompactServiceCardProps {
  hospital: Hospital;
  features: any[];
  isOpen: boolean;
  handleClick: () => void;
  className: string;
}

const CompactServiceCard: React.FC<CompactServiceCardProps> = ({
  hospital,
  features,
  isOpen,
  handleClick,
  className,
}) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
    onClick={handleClick}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-blue-50">
        🏥
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate">{hospital.nameAr}</h3>
          {hospital.isVerified && (
            <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CompactRating rating={hospital.ratingAvg} count={hospital.ratingCount} size="sm" />
          <span>•</span>
          <span className="truncate">{hospital.city?.nameAr}</span>
        </div>
      </div>
      
      <StatusBadge isOpen={isOpen} size="sm" />
    </div>
  </div>
);

// ============================================================================
// List Service Card
// ============================================================================

interface ListServiceCardProps {
  hospital: Hospital;
  features: any[];
  isOpen: boolean;
  imageError: boolean;
  setImageError: (error: boolean) => void;
  highlightText: (text: string) => any;
  showDistance: boolean;
  distance?: number;
  showFavorites: boolean;
  showComparison: boolean;
  isFavorite: boolean;
  isInComparison: boolean;
  handleClick: () => void;
  handleFavoriteToggle: (e: React.MouseEvent) => void;
  handleComparisonToggle: (e: React.MouseEvent) => void;
  handleShare: (e: React.MouseEvent) => void;
  className: string;
}

const ListServiceCard: React.FC<ListServiceCardProps> = ({
  hospital,
  features,
  isOpen,
  imageError,
  setImageError,
  highlightText,
  showDistance,
  distance,
  showFavorites,
  showComparison,
  isFavorite,
  isInComparison,
  handleClick,
  handleFavoriteToggle,
  handleComparisonToggle,
  handleShare,
  className,
}) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
    onClick={handleClick}
  >
    <div className="flex gap-4">
      {/* Image */}
      <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg overflow-hidden flex-shrink-0">
        {hospital.logo && !imageError ? (
          <Image
            src={hospital.logo}
            alt={hospital.nameAr}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🏥
          </div>
        )}
        
        <div className="absolute top-1 right-1">
          <StatusBadge isOpen={isOpen} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {highlightText(hospital.nameAr)}
              </h3>
              {hospital.isVerified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <CompactRating 
              rating={hospital.ratingAvg} 
              count={hospital.ratingCount}
              size="sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 ml-2">
            {showFavorites && (
              <button
                onClick={handleFavoriteToggle}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                {isFavorite ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {showComparison && (
              <button
                onClick={handleComparisonToggle}
                className={`p-1.5 transition-colors ${
                  isInComparison 
                    ? 'text-blue-500' 
                    : 'text-gray-400 hover:text-blue-500'
                }`}
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleShare}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {hospital.city?.nameAr}، {hospital.governorate?.nameAr}
          </span>
          {showDistance && distance && (
            <span className="text-blue-600 font-medium">
              ({distance.toFixed(1)} كم)
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {features.slice(0, 4).map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full"
              style={{ 
                backgroundColor: feature.color + '20',
                color: feature.color,
              }}
            >
              <feature.icon className="w-3 h-3" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
  isOpen: boolean;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isOpen, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div
      className={`rounded-full font-medium ${sizeClasses[size]} ${
        isOpen
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isOpen ? 'مفتوح' : 'مغلق'}
    </div>
  );
};

// ============================================================================
// Compact Rating Component
// ============================================================================

interface CompactRatingProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md';
}

const CompactRating: React.FC<CompactRatingProps> = ({ rating, count, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`${iconSize} ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-gray-600 font-medium">
        {rating.toFixed(1)}
      </span>
      <span className="text-gray-500">
        ({count.toLocaleString('ar-EG')})
      </span>
    </div>
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

const getCurrentStatus = (hospital: Hospital): boolean => {
  // Simple implementation - assume most hospitals are open during day
  const currentHour = new Date().getHours();
  return currentHour >= 6 && currentHour <= 22;
};

const getHospitalFeatures = (hospital: Hospital) => {
  const features: Array<{ icon: any; label: string; color: string }> = [];

  if (hospital.hasEmergency) {
    features.push({ icon: ExclamationTriangleIcon, label: 'طوارئ', color: '#ef4444' });
  }

  if (hospital.isVerified) {
    features.push({ icon: CheckBadgeIcon, label: 'محقق', color: '#3b82f6' });
  }

  if (hospital.isFeatured) {
    features.push({ icon: StarIcon, label: 'مميز', color: '#f59e0b' });
  }

  if (hospital.parkingAvailable) {
    features.push({ icon: BuildingOffice2Icon, label: 'مواقف', color: '#10b981' });
  }

  if (hospital.wheelchairAccessible) {
    features.push({ icon: UserGroupIcon, label: 'إمكانية وصول', color: '#8b5cf6' });
  }

  return features;
};

export default UniversalServiceCard;