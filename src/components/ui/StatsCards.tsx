'use client';

import React from 'react';

// Simple SVG Icons
const HospitalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsCardsProps {
  totalHospitals: number;
  emergencyCount: number;
  featuredCount: number;
  verifiedCount: number;
  averageRating?: number;
  isLoading?: boolean;
  className?: string;
}

export default function StatsCards({
  totalHospitals,
  emergencyCount,
  featuredCount,
  verifiedCount,
  averageRating = 0,
  isLoading = false,
  className = ''
}: StatsCardsProps) {
  
  const stats: StatCard[] = [
    {
      title: 'إجمالي المستشفيات',
      value: isLoading ? '...' : totalHospitals.toLocaleString('ar-EG'),
      subtitle: 'مستشفى متاح',
      icon: <HospitalIcon className="h-8 w-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: 'خدمات طوارئ',
      value: isLoading ? '...' : emergencyCount.toLocaleString('ar-EG'),
      subtitle: `${totalHospitals > 0 ? Math.round((emergencyCount / totalHospitals) * 100) : 0}% من المستشفيات`,
      icon: <HeartIcon className="h-8 w-8" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: {
        value: 8,
        isPositive: true
      }
    },
    {
      title: 'مستشفيات مميزة',
      value: isLoading ? '...' : featuredCount.toLocaleString('ar-EG'),
      subtitle: `${totalHospitals > 0 ? Math.round((featuredCount / totalHospitals) * 100) : 0}% مميزة`,
      icon: <StarIcon className="h-8 w-8" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: {
        value: 15,
        isPositive: true
      }
    },
    {
      title: 'مستشفيات موثقة',
      value: isLoading ? '...' : verifiedCount.toLocaleString('ar-EG'),
      subtitle: `${totalHospitals > 0 ? Math.round((verifiedCount / totalHospitals) * 100) : 0}% موثقة`,
      icon: <CheckCircleIcon className="h-8 w-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: {
        value: 5,
        isPositive: true
      }
    }
  ];

  // إضافة بطاقة التقييم إذا كان متاحاً
  if (averageRating > 0) {
    stats.push({
      title: 'متوسط التقييم',
      value: isLoading ? '...' : averageRating.toFixed(1),
      subtitle: 'من 5 نجوم',
      icon: <StarIcon className="h-8 w-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: {
        value: 3,
        isPositive: true
      }
    });
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`
            ${stat.bgColor} p-4 rounded-xl border border-opacity-20 
            hover:shadow-md transition-all duration-300 group
            ${isLoading ? 'animate-pulse' : 'animate-fade-in'}
          `}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Icon and Trend */}
          <div className="flex items-center justify-between mb-3">
            <div className={`${stat.color} ${stat.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            
            {stat.trend && !isLoading && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUpIcon className={`h-3 w-3 ${
                  stat.trend.isPositive ? '' : 'rotate-180'
                }`} />
                <span>+{stat.trend.value}%</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className={`text-2xl font-bold ${stat.color} group-hover:scale-105 transition-transform duration-300`}>
                {stat.value}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-sm font-medium text-gray-900 mb-1">
            {stat.title}
          </div>

          {/* Subtitle */}
          {stat.subtitle && (
            <div className="text-xs text-gray-600">
              {isLoading ? (
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                stat.subtitle
              )}
            </div>
          )}

          {/* Progress Bar for Percentages */}
          {stat.subtitle && stat.subtitle.includes('%') && !isLoading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                    stat.color.replace('text-', 'bg-')
                  }`}
                  style={{ 
                    width: `${totalHospitals > 0 ? 
                      stat.title.includes('طوارئ') ? (emergencyCount / totalHospitals) * 100 :
                      stat.title.includes('مميزة') ? (featuredCount / totalHospitals) * 100 :
                      stat.title.includes('موثقة') ? (verifiedCount / totalHospitals) * 100 : 0
                    : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}