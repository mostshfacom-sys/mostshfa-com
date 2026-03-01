'use client';

import React, { useState, useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ClockIcon,
  FunnelIcon,
  HeartIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  MicrophoneIcon,
  StarIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { InteractiveMap } from '@/components/maps/InteractiveMap';
import type { EntityType } from '@/components/maps/MapContainer';

// ============================================================================
// Counter Animation Hook
// ============================================================================

const useCounterAnimation = (targetValue: number, duration: number = 2000) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = currentValue;
    const difference = targetValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const newValue = Math.round(startValue + (difference * easeOutCubic));
      
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return currentValue;
};

// ============================================================================
// Counter Data Interface
// ============================================================================

export interface CounterData {
  id: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  isHighlighted?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// ============================================================================
// Quick Filter Config Interface
// ============================================================================

export interface QuickFilterConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

const heartbeatPathA =
  'M-200 40 L0 40 L40 40 L60 20 L80 60 L100 40 L200 40 L240 40 L260 28 L280 52 L300 40 L360 40 L380 20 L400 60 L420 40 L520 40 L540 40 L560 30 L580 50 L600 40 L800 40 L820 20 L840 60 L860 40 L1000 40 L1020 28 L1040 52 L1060 40 L1200 40 L1220 18 L1240 62 L1260 40 L1400 40 L1420 24 L1440 56 L1460 40 L1600 40 L1620 20 L1640 60 L1660 40 L1800 40';
const heartbeatPathB =
  'M-200 40 L0 40 L38 40 L58 18 L78 62 L98 40 L198 40 L238 40 L258 30 L278 50 L298 40 L360 40 L378 18 L398 62 L418 40 L520 40 L540 40 L558 28 L578 52 L598 40 L800 40 L818 18 L838 62 L858 40 L1000 40 L1018 30 L1038 50 L1058 40 L1200 40 L1218 20 L1238 60 L1258 40 L1400 40 L1418 26 L1438 54 L1458 40 L1600 40 L1618 18 L1638 62 L1658 40 L1800 40';

const DefaultAnimatedSymbol = () => (
  <svg
    className="w-full h-16 sm:h-24"
    viewBox="0 0 1800 80"
    preserveAspectRatio="xMidYMid slice"
    style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.6))' }}
  >
    <defs>
      <linearGradient id="headerPulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="white" stopOpacity="0.9" />
        <stop offset="50%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0.9" />
      </linearGradient>
    </defs>

    <path
      stroke="url(#headerPulseGradient)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      d={heartbeatPathA}
    >
      <animate
        attributeName="d"
        dur="4s"
        repeatCount="indefinite"
        values={`${heartbeatPathA};${heartbeatPathB};${heartbeatPathA}`}
      />
      <animateTransform
        attributeName="transform"
        type="translate"
        from="-100 0"
        to="140 0"
        dur="4s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

interface QuickFilterButtonProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick?: () => void;
  active?: boolean;
}

const QuickFilterButton = ({
  icon: Icon,
  label,
  count,
  onClick,
  active,
}: QuickFilterButtonProps) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    disabled={!onClick}
    className={`flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 rounded-lg backdrop-blur-md border transition-all whitespace-nowrap ${
      active
        ? 'bg-white/25 border-white/40 text-white shadow-lg'
        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30'
    } ${onClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
  >
    {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
    <span className="font-medium text-[11px] sm:text-sm">{label}</span>
    {count !== undefined && (
      <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs font-bold">
        {count}
      </span>
    )}
  </motion.button>
);

// ============================================================================
// Smart Header Props
// ============================================================================

interface UniversalSmartHeaderProps {
  title: string;
  subtitle?: string;
  counters: CounterData[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  showFilters?: boolean;
  onFiltersToggle?: () => void;
  filtersActive?: boolean;
  activeFiltersCount?: number;
  viewMode?: 'grid' | 'list' | 'map';
  onViewModeChange?: (mode: 'grid' | 'list' | 'map') => void;
  showViewToggle?: boolean;
  showVoiceSearch?: boolean;
  onVoiceSearch?: () => void;
  isVoiceSearchActive?: boolean;
  quickFilters?: QuickFilterConfig[];
  quickFiltersOpen?: boolean;
  onQuickFiltersToggle?: (open: boolean) => void;
  showQuickFiltersToggle?: boolean;
  quickFiltersLabel?: string;
  resultsCount?: number;
  showResultsCount?: boolean;
  showMapButton?: boolean;
  mapButtonLabel?: string;
  mapEntityTypes?: EntityType[];
  mapTitle?: string;
  mapSubtitle?: string;
  animatedSymbol?: React.ReactNode;
  showAnimatedSymbol?: boolean;
  sortOptions?: Array<{ value: string; label: string }>;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  bannerImage?: string;
  bannerEnabled?: boolean;
  bannerOverlayColor?: string;
  bannerOverlayOpacity?: number;
}

// ============================================================================
// Universal Smart Header Component
// ============================================================================

export const UniversalSmartHeader: React.FC<UniversalSmartHeaderProps> = ({
  title,
  subtitle,
  counters,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'ابحث عن المستشفيات، التخصصات، أو المناطق...',
  showFilters = true,
  onFiltersToggle,
  filtersActive = false,
  activeFiltersCount = 0,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  showVoiceSearch = false,
  onVoiceSearch,
  isVoiceSearchActive = false,
  quickFilters = [],
  quickFiltersOpen,
  onQuickFiltersToggle,
  showQuickFiltersToggle,
  quickFiltersLabel = 'فلاتر سريعة',
  resultsCount,
  showResultsCount,
  showMapButton = false,
  mapButtonLabel = 'عرض الخريطة',
  mapEntityTypes,
  mapTitle = 'الخريطة التفاعلية',
  mapSubtitle = 'استعرض المواقع على الخريطة',
  animatedSymbol,
  showAnimatedSymbol,
  sortOptions = [],
  sortValue = '',
  onSortChange,
  className = '',
  gradientFrom = 'from-blue-500',
  gradientTo = 'to-cyan-600',
  bannerImage,
  bannerEnabled,
  bannerOverlayColor,
  bannerOverlayOpacity,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [localQuickFiltersOpen, setLocalQuickFiltersOpen] = useState(false);

  const resolvedBannerImage = bannerImage?.trim();
  const isBannerEnabled = bannerEnabled !== false;
  const showBannerImage = isBannerEnabled && Boolean(resolvedBannerImage);
  const overlayColor = bannerOverlayColor?.trim() || '#0f172a';
  const overlayOpacity =
    typeof bannerOverlayOpacity === 'number'
      ? Math.min(Math.max(bannerOverlayOpacity, 0), 100) / 100
      : 0.7;
  const hasQuickFilters = quickFilters.length > 0;
  const shouldShowQuickFiltersToggle =
    typeof showQuickFiltersToggle === 'boolean' ? showQuickFiltersToggle : hasQuickFilters;
  const quickFiltersExpanded =
    typeof quickFiltersOpen === 'boolean'
      ? quickFiltersOpen
      : shouldShowQuickFiltersToggle
        ? localQuickFiltersOpen
        : hasQuickFilters;
  const shouldShowResultsCount =
    typeof showResultsCount === 'boolean' ? showResultsCount : typeof resultsCount === 'number';
  const shouldShowAnimatedSymbol =
    typeof showAnimatedSymbol === 'boolean' ? showAnimatedSymbol : true;
  const resultsTotal = typeof resultsCount === 'number' ? resultsCount : 0;

  const handleQuickFiltersToggle = () => {
    const next = !quickFiltersExpanded;
    onQuickFiltersToggle?.(next);
    if (quickFiltersOpen === undefined) {
      setLocalQuickFiltersOpen(next);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-95`} />

      {showBannerImage && resolvedBannerImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${resolvedBannerImage})` }}
        />
      )}

      {isBannerEnabled && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        />
      )}
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {shouldShowAnimatedSymbol && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40 overflow-hidden pointer-events-none">
          {animatedSymbol ?? <DefaultAnimatedSymbol />}
        </div>
      )}
      

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Content */}
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10 sm:mb-12 px-4"
          >
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 text-center whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </h1>

            {subtitle && (
              <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto text-center line-clamp-2">
                {subtitle}
              </p>
            )}
          </motion.div>

          {/* Counters */}
          {counters && counters.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {counters.map((counter) => (
                <div key={counter.id} className="min-w-[140px]">
                   <CounterCard counter={counter} />
                </div>
              ))}
            </div>
          )}

          {/* Search and Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-white/70" />
                </div>

                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={searchPlaceholder}
                  className="w-full pl-4 pr-12 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                />

                {showVoiceSearch && (
                  <button
                    type="button"
                    onClick={onVoiceSearch}
                    className={`absolute inset-y-0 left-3 flex items-center transition-colors ${
                      isVoiceSearchActive
                        ? 'text-red-400 animate-pulse'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left Side - Filters and Sort */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filters Toggle */}
                {showFilters && onFiltersToggle && (
                  <button
                    onClick={onFiltersToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      filtersActive
                        ? 'bg-white text-gray-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                    <span className="font-medium">فلترة</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Sort Dropdown */}
                {sortOptions.length > 0 && onSortChange && (
                  <div className="relative">
                    <select
                      value={sortValue}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="appearance-none bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Right Side - Quick Filters, Map, Results, View Toggle */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                {shouldShowQuickFiltersToggle && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleQuickFiltersToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shadow-lg whitespace-nowrap ${
                      quickFiltersExpanded
                        ? 'bg-purple-500/30 border-purple-300/60 text-white'
                        : 'bg-purple-500/20 border-purple-300/40 text-white hover:bg-purple-500/30'
                    }`}
                    type="button"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{quickFiltersLabel}</span>
                    <span className="hidden sm:block w-2 h-2 bg-purple-200 rounded-full animate-pulse" />
                  </motion.button>
                )}

                {showMapButton && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-300/50 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white shadow-lg hover:from-cyan-500/40 hover:to-blue-500/40 transition-all whitespace-nowrap"
                    type="button"
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{mapButtonLabel}</span>
                    <span className="hidden sm:block w-2 h-2 bg-cyan-200 rounded-full animate-pulse" />
                  </motion.button>
                )}

                {shouldShowResultsCount && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-lg text-white text-sm">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="font-medium">{resultsTotal.toLocaleString('ar-EG')} نتيجة</span>
                  </div>
                )}

                {showViewToggle && onViewModeChange && (
                  <div className="flex items-center bg-white/20 rounded-lg p-1">
                    <button
                      onClick={() => onViewModeChange('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                      title="عرض شبكي"
                      type="button"
                    >
                      <ViewColumnsIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => onViewModeChange('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                      title="عرض قائمة"
                      type="button"
                    >
                      <ListBulletIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => onViewModeChange('map')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'map'
                          ? 'bg-white text-gray-900'
                          : 'text-white/70 hover:text-white hover:bg-white/20'
                      }`}
                      title="عرض خريطة"
                      type="button"
                    >
                      <MapIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {hasQuickFilters && (
              <div className="relative min-h-[64px] sm:min-h-[64px] mt-4">
                <motion.div
                  initial={false}
                  animate={{ opacity: quickFiltersExpanded ? 1 : 0, y: quickFiltersExpanded ? 0 : -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  aria-hidden={!quickFiltersExpanded}
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2 overflow-x-hidden sm:overflow-x-auto overflow-y-visible py-2 px-1 sm:px-0 ${
                    quickFiltersExpanded ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.2) rgba(255,255,255,0.05)'
                  }}
                >
                  {quickFilters.map((filter) => (
                    <QuickFilterButton
                      key={filter.id}
                      icon={filter.icon}
                      label={filter.label}
                      count={filter.count}
                      active={filter.active}
                      onClick={filter.onClick}
                    />
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsMapOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{mapTitle}</h3>
                  {mapSubtitle && (
                    <p className="text-sm text-white/80">{mapSubtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <InteractiveMap
                  showSearch
                  showDirections
                  entityTypes={mapEntityTypes}
                  className="rounded-xl overflow-hidden"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 80"
          className="w-full h-7 sm:h-9 text-gray-50"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,32L48,37.3C96,43,192,53,288,48C384,43,480,21,576,16C672,11,768,21,864,26.7C960,32,1056,32,1152,26.7C1248,21,1344,11,1392,5.3L1440,0L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,32L48,37.3C96,43,192,53,288,48C384,43,480,21,576,16C672,11,768,21,864,26.7C960,32,1056,32,1152,26.7C1248,21,1344,11,1392,5.3L1440,0L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z;
                M0,21L48,26.7C96,32,192,43,288,42.7C384,43,480,32,576,26.7C672,21,768,21,864,24C960,27,1056,32,1152,37.3C1248,43,1344,48,1392,50.7L1440,53L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z;
                M0,53L48,50.7C96,48,192,43,288,45.3C384,48,480,59,576,58.7C672,59,768,48,864,42.7C960,37,1056,37,1152,40C1248,43,1344,48,1392,50.7L1440,53L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z;
                M0,32L48,37.3C96,43,192,53,288,48C384,43,480,21,576,16C672,11,768,21,864,26.7C960,32,1056,32,1152,26.7C1248,21,1344,11,1392,5.3L1440,0L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z"
            />
          </path>
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// Counter Card Component
// ============================================================================

interface CounterCardProps {
  counter: CounterData;
}

const CounterCard: React.FC<CounterCardProps> = ({ counter }) => {
  const animatedValue = useCounterAnimation(counter.value);
  const IconComponent = counter.icon;

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center transition-all duration-300 hover:bg-white/20 hover:scale-105 ${
      counter.isHighlighted ? 'ring-2 ring-white/50' : ''
    }`}>
      <div className="flex items-center justify-center mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: counter.color + '20' }}
        >
          <div style={{ color: counter.color }}>
            <IconComponent className="h-6 w-6" />
          </div>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">
        {animatedValue.toLocaleString('ar-EG')}
        {counter.trend && (
          <span className={`text-sm ml-1 ${counter.trend.isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {counter.trend.isPositive ? '+' : ''}{counter.trend.value}%
          </span>
        )}
      </div>
      
      <div className="text-sm text-white/80 font-medium">
        {counter.label}
      </div>
      
      {counter.description && (
        <div className="text-xs text-white/60 mt-1">
          {counter.description}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Predefined Counter Configurations for Hospitals
// ============================================================================

export const createHospitalCounters = (data: {
  total: number;
  open?: number;
  emergency?: number;
  verified?: number;
  featured?: number;
  government?: number;
  private?: number;
}): CounterData[] => {
  return [
    {
      id: 'total',
      label: 'إجمالي المستشفيات',
      value: data.total,
      icon: BuildingOffice2Icon,
      color: '#3b82f6',
      isHighlighted: true,
      trend: { value: 12, isPositive: true },
    },
    ...(data.open !== undefined ? [{
      id: 'open',
      label: 'مفتوح الآن',
      value: data.open,
      icon: ClockIcon,
      color: '#10b981',
      trend: { value: 8, isPositive: true },
    }] : []),
    ...(data.emergency !== undefined ? [{
      id: 'emergency',
      label: 'طوارئ 24/7',
      value: data.emergency,
      icon: HeartIcon,
      color: '#ef4444',
      trend: { value: 5, isPositive: true },
    }] : []),
    ...(data.verified !== undefined ? [{
      id: 'verified',
      label: 'محقق',
      value: data.verified,
      icon: CheckBadgeIcon,
      color: '#8b5cf6',
      trend: { value: 15, isPositive: true },
    }] : []),
    ...(data.featured !== undefined ? [{
      id: 'featured',
      label: 'مميز',
      value: data.featured,
      icon: StarIcon,
      color: '#f59e0b',
      trend: { value: 3, isPositive: true },
    }] : []),
  ];
};

// ============================================================================
// Default Sort Options for Hospitals
// ============================================================================

export const getHospitalSortOptions = () => [
  { value: 'relevance', label: 'الأكثر صلة' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'distance', label: 'الأقرب' },
  { value: 'name', label: 'الاسم (أ-ي)' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'emergency', label: 'طوارئ أولاً' },
  { value: 'specialties', label: 'عدد التخصصات' },
];

export default UniversalSmartHeader;
