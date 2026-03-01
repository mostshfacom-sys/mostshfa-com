'use client';

import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  ClockIcon,
  TruckIcon,
  UserPlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import type { Pharmacy, PharmacyFilters, FilterOption } from '@/types/pharmacy';

interface PharmacySmartHeaderProps {
  headerTotalCount: number;
  headerOpenCount: number;
  header24hCount: number;
  resultsCount: number;
  openCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  pharmacies: Pharmacy[];
  filters?: PharmacyFilters;
  onFiltersChange?: (filters: PharmacyFilters) => void;
}

const HEADER_BACKGROUND_FALLBACK = 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=1600&q=80';

function CompactStat({ 
  value, 
  label, 
  icon: Icon,
}: { 
  value: number; 
  label: string; 
  icon: any;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formattedValue = safeValue.toLocaleString('ar-EG');

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl transition-all"
    >
      <div className="p-2 bg-white/20 rounded-xl">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black text-white leading-none">
          {formattedValue}
        </span>
        <span className="text-xs text-white/70 font-medium">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

function QuickFilterButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border transition-all whitespace-nowrap ${
        active
          ? 'bg-white/30 border-white/50 text-white shadow-lg'
          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-bold text-sm">{label}</span>
    </motion.button>
  );
}

export function PharmacySmartHeader({
  headerTotalCount,
  headerOpenCount,
  header24hCount,
  resultsCount,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
}: PharmacySmartHeaderProps) {
  
  const applyQuickFilter = (kind: 'open' | '24h' | 'delivery' | 'nursing' | 'featured') => {
    if (!onFiltersChange) return;
    const base: PharmacyFilters = {
      ...(filters || {}),
      page: 1,
    };
    switch (kind) {
      case 'open': base.isOpen = !filters?.isOpen; break;
      case '24h': base.is24h = !filters?.is24h; break;
      case 'delivery': base.hasDelivery = !filters?.hasDelivery; break;
      case 'nursing': base.hasNursing = !filters?.hasNursing; break;
      case 'featured': base.isFeatured = !filters?.isFeatured; break;
    }
    onFiltersChange(base);
  };

  return (
    <div className="relative bg-teal-900 pt-32 pb-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${HEADER_BACKGROUND_FALLBACK})` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-teal-950/90 via-teal-900/80 to-neutral-50 dark:to-neutral-900" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-6xl mx-auto">
          {/* Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="space-y-4 text-center lg:text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/20 backdrop-blur-md border border-teal-400/30 rounded-full text-teal-100 text-sm font-bold"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>دليل الصيدليات المعتمد</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl lg:text-6xl font-black text-white"
              >
                ابحث عن <span className="text-teal-400">أقرب صيدلية</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-teal-100/80 max-w-2xl"
              >
                تصفح أكثر من 500 صيدلية في جميع محافظات مصر، مع تفاصيل التوصيل والخدمات التمريضية.
              </motion.p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <CompactStat value={headerTotalCount} label="صيدلية مسجلة" icon={BoltIcon} />
              <CompactStat value={header24hCount} label="خدمة 24 ساعة" icon={ClockIcon} />
              <CompactStat value={headerOpenCount || resultsCount} label="متاحة الآن" icon={SparklesIcon} />
            </div>
          </div>

          {/* Search & Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative group">
                <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-teal-400 group-focus-within:text-teal-300 transition-colors" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث باسم الصيدلية أو المنطقة..."
                  className="w-full pr-14 pl-6 py-4 bg-white/10 border-2 border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:bg-white/20 focus:border-teal-400/50 focus:outline-none transition-all text-lg"
                />
                {searchValue && (
                  <button 
                    onClick={() => onSearchChange('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* View & Sort Controls */}
              <div className="flex items-center gap-2">
                <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-teal-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    <Squares2X2Icon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-teal-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    <ListBulletIcon className="w-6 h-6" />
                  </button>
                </div>

                <select
                  value={sortValue}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="bg-white/10 text-white border-2 border-white/10 px-4 py-4 rounded-2xl focus:outline-none focus:border-teal-400/50 cursor-pointer font-bold"
                >
                  <option value="-rating_avg" className="text-neutral-900">الأعلى تقييماً</option>
                  <option value="name_ar" className="text-neutral-900">الاسم (أ-ي)</option>
                  <option value="-createdAt" className="text-neutral-900">المضافة حديثاً</option>
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
              <span className="text-white/60 text-sm font-bold ml-2">وصول سريع:</span>
              <QuickFilterButton 
                label="مفتوح الآن" 
                icon={SparklesIcon} 
                active={filters?.isOpen} 
                onClick={() => applyQuickFilter('open')} 
              />
              <QuickFilterButton 
                label="24 ساعة" 
                icon={ClockIcon} 
                active={filters?.is24h} 
                onClick={() => applyQuickFilter('24h')} 
              />
              <QuickFilterButton 
                label="خدمة توصيل" 
                icon={TruckIcon} 
                active={filters?.hasDelivery} 
                onClick={() => applyQuickFilter('delivery')} 
              />
              <QuickFilterButton 
                label="خدمات تمريضية" 
                icon={UserPlusIcon} 
                active={filters?.hasNursing} 
                onClick={() => applyQuickFilter('nursing')} 
              />
              <QuickFilterButton 
                label="صيدليات مميزة" 
                icon={StarIcon} 
                active={filters?.isFeatured} 
                onClick={() => applyQuickFilter('featured')} 
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
