
'use client';

import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  HeartIcon,
  BuildingOffice2Icon,
  FunnelIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckBadgeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon,
  BoltIcon,
  FireIcon
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { VoiceSearchButton } from '@/components/hospitals-pro/VoiceSearchButton';
import { useImageSettings } from '@/components/ui/ImageSettingsProvider';
import { MapViewButton } from './MapViewButton';
import type { Clinic, ClinicFilters, FilterOption } from '@/types/clinic';

interface ClinicSmartHeaderProps {
  headerTotalCount: number;
  headerOpenCount: number;
  headerFeaturedCount: number;
  resultsCount: number;
  openCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  clinics: Clinic[];
  filters?: ClinicFilters;
  onFiltersChange?: (filters: ClinicFilters) => void;
}

const HEADER_BACKGROUND_FALLBACK = '/images/clinics/bdujtnlmkc.jpg';

// Compact Stat Component
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
  const decimalPlaces = Number.isFinite(value) && !Number.isInteger(value) ? 1 : 0;
  const formattedTarget = safeValue.toLocaleString('ar-EG', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  const minWidthCh = Math.max(formattedTarget.length, 3);
  const valueWidth = `${minWidthCh}ch`;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      setDisplayValue(0);
      return;
    }

    const start = 0;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const nextValue = start + (end - start) * progress;
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const formattedValue = Number.isFinite(displayValue)
    ? displayValue.toLocaleString('ar-EG', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: [
          "0 4px 6px rgba(0,0,0,0.1)",
          "0 8px 12px rgba(0,0,0,0.15)",
          "0 4px 6px rgba(0,0,0,0.1)"
        ]
      }}
      transition={{
        boxShadow: {
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        }
      }}
      whileHover={{ 
        scale: 1.08,
        y: -5,
        boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
      }}
      className="flex flex-col items-center gap-1 px-2 py-3 sm:gap-2 sm:flex-row sm:items-center sm:px-3 sm:py-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border-2 border-white/30 rounded-xl hover:border-white/50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap w-full sm:w-[165px] sm:flex-none text-center"
    >
      <motion.div
        animate={{ 
          rotate: [0, 5, 0, -5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut"
        }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
      </motion.div>
      <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
        <span
          className="text-base sm:text-lg lg:text-xl font-black text-white drop-shadow-md tabular-nums text-center inline-block"
          style={{ width: valueWidth }}
          dir="ltr"
        >
          {formattedValue}
        </span>
        <span className="text-[11px] sm:text-sm text-white/80 font-medium">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

// Quick Filter Button Component
function QuickFilterButton({
  icon: Icon,
  label,
  count,
  onClick,
  active,
}: {
  icon: any;
  label: string;
  count?: number;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 rounded-lg backdrop-blur-md border transition-all whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-white/25 border-white/40 text-white shadow-lg'
          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30'
      }`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      <span className="font-medium text-[11px] sm:text-sm">{label}</span>
      {count !== undefined && (
        <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs font-bold">
          {count}
        </span>
      )}
    </motion.button>
  );
}

export function ClinicSmartHeader({
  headerTotalCount,
  headerOpenCount,
  headerFeaturedCount,
  resultsCount,
  openCount,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  clinics,
  filters,
  onFiltersChange
}: ClinicSmartHeaderProps) {
  
  const {
    clinicsBannerImage,
    clinicsBannerEnabled,
    clinicsBannerOverlayColor,
    clinicsBannerOverlayOpacity,
    clinicsBannerTitle,
    clinicsBannerSubtitle,
  } = useImageSettings();

  const bannerImage = clinicsBannerImage?.trim()
    ? clinicsBannerImage.trim()
    : HEADER_BACKGROUND_FALLBACK;
  
  const overlayColor = clinicsBannerOverlayColor?.trim() || '#064e3b';
  const overlayOpacity =
    typeof clinicsBannerOverlayOpacity === 'number'
      ? Math.min(Math.max(clinicsBannerOverlayOpacity, 0), 100) / 100
      : 0.7;
  
  const bannerTitle = clinicsBannerTitle?.trim() || 'دليل العيادات الطبية';
  const bannerSubtitle = clinicsBannerSubtitle?.trim() || 'احجز أو استكشف أفضل العيادات المتخصصة بالقرب منك';

  return (
    <header className="relative text-white overflow-hidden bg-neutral-900 min-h-[450px] flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url(${bannerImage})`,
        }}
      />
      
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      {/* ECG Animation (identical to Hospitals) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-16 sm:h-28"
          viewBox="0 0 1800 80"
          preserveAspectRatio="xMidYMid slice"
          style={{
            filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.6))'
          }}
        >
          <defs>
            <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0.95" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            stroke="url(#heartbeatGradient)"
            strokeWidth="3"
            fill="none"
            d="M-200,40 L80,40 L85,40 L88,38 L92,42 L95,40 L100,40 L115,40 L120,28 L125,18 L130,14 L135,20 L140,52 L145,65 L150,55 L155,38 L160,28 L165,32 L170,40 L195,40 L330,40 L340,40 L343,39 L347,41 L350,40 L355,40 L370,40 L375,22 L380,12 L385,8 L390,15 L395,58 L400,72 L405,62 L410,35 L415,25 L420,29 L425,40 L450,40 L590,40 L600,40 L603,38 L607,42 L610,40 L615,40 L630,40 L635,26 L640,16 L645,12 L650,19 L655,54 L660,67 L665,57 L670,36 L675,26 L680,30 L685,40 L710,40 L860,40 L870,40 L873,39 L877,41 L880,40 L885,40 L900,40 L905,30 L910,20 L915,16 L920,22 L925,50 L930,60 L935,52 L940,40 L945,32 L950,36 L955,40 L980,40 L1130,40 L1140,40 L1143,38 L1147,42 L1150,40 L1155,40 L1170,40 L1175,24 L1180,14 L1185,10 L1190,17 L1195,56 L1200,70 L1205,60 L1210,34 L1215,24 L1220,28 L1225,40 L1250,40 L1410,40 L1420,40 L1423,39 L1427,41 L1430,40 L1435,40 L1450,40 L1455,20 L1460,10 L1465,6 L1470,13 L1475,62 L1480,78 L1485,68 L1490,32 L1495,22 L1500,26 L1505,40 L1535,40 L1700,40 L1710,40 L1713,38 L1717,42 L1720,40 L1725,40 L1740,40 L1745,27 L1750,17 L1755,13 L1760,20 L1765,53 L1770,66 L1775,56 L1780,37 L1785,27 L1790,31 L1795,40 L1825,40 L2100,40"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M-200,40 L80,40 L85,40 L88,38 L92,42 L95,40 L100,40 L115,40 L120,28 L125,18 L130,14 L135,20 L140,52 L145,65 L150,55 L155,38 L160,28 L165,32 L170,40 L195,40 L330,40 L340,40 L343,39 L347,41 L350,40 L355,40 L370,40 L375,22 L380,12 L385,8 L390,15 L395,58 L400,72 L405,62 L410,35 L415,25 L420,29 L425,40 L450,40 L590,40 L600,40 L603,38 L607,42 L610,40 L615,40 L630,40 L635,26 L640,16 L645,12 L650,19 L655,54 L660,67 L665,57 L670,36 L675,26 L680,30 L685,40 L710,40 L860,40 L870,40 L873,39 L877,41 L880,40 L885,40 L900,40 L905,30 L910,20 L915,16 L920,22 L925,50 L930,60 L935,52 L940,40 L945,32 L950,36 L955,40 L980,40 L1130,40 L1140,40 L1143,38 L1147,42 L1150,40 L1155,40 L1170,40 L1175,24 L1180,14 L1185,10 L1190,17 L1195,56 L1200,70 L1205,60 L1210,34 L1215,24 L1220,28 L1225,40 L1250,40 L1410,40 L1420,40 L1423,39 L1427,41 L1430,40 L1435,40 L1450,40 L1455,20 L1460,10 L1465,6 L1470,13 L1475,62 L1480,78 L1485,68 L1490,32 L1495,22 L1500,26 L1505,40 L1535,40 L1700,40 L1710,40 L1713,38 L1717,42 L1720,40 L1725,40 L1740,40 L1745,27 L1750,17 L1755,13 L1760,20 L1765,53 L1770,66 L1775,56 L1780,37 L1785,27 L1790,31 L1795,40 L1825,40 L2100,40;
                M-200,40 L75,40 L80,40 L83,39 L87,41 L90,40 L95,40 L108,40 L113,30 L118,20 L123,16 L128,22 L133,49 L138,60 L143,52 L148,39 L153,31 L158,35 L163,40 L188,40 L325,40 L335,40 L338,39 L342,41 L345,40 L350,40 L365,40 L370,26 L375,16 L380,12 L385,19 L390,55 L395,68 L400,60 L405,36 L410,26 L415,30 L420,40 L445,40 L588,40 L598,40 L601,38 L605,42 L608,40 L613,40 L628,40 L633,28 L638,18 L643,14 L648,21 L653,52 L658,64 L663,56 L668,37 L673,28 L678,32 L683,40 L708,40 L858,40 L868,40 L871,39 L875,41 L878,40 L883,40 L898,40 L903,32 L908,22 L913,18 L918,24 L923,48 L928,57 L933,51 L938,40 L943,34 L948,37 L953,40 L978,40 L1128,40 L1138,40 L1141,38 L1145,42 L1148,40 L1153,40 L1168,40 L1173,25 L1178,15 L1183,11 L1188,18 L1193,55 L1198,68 L1203,59 L1208,35 L1213,25 L1218,29 L1223,40 L1248,40 L1408,40 L1418,40 L1421,39 L1425,41 L1428,40 L1433,40 L1448,40 L1453,21 L1458,11 L1463,7 L1468,14 L1473,60 L1478,76 L1483,66 L1488,33 L1493,23 L1498,27 L1503,40 L1533,40 L1698,40 L1708,40 L1711,38 L1715,42 L1718,40 L1723,40 L1738,40 L1743,26 L1748,16 L1753,12 L1758,19 L1763,54 L1768,67 L1773,57 L1778,36 L1783,26 L1788,30 L1793,40 L1823,40 L2100,40;
                M-200,40 L78,40 L83,40 L86,38 L90,42 L93,40 L98,40 L112,40 L117,31 L122,21 L127,17 L132,23 L137,49 L142,60 L147,52 L152,39 L157,31 L162,35 L167,40 L192,40 L328,40 L338,40 L341,39 L345,41 L348,40 L353,40 L368,40 L373,26 L378,16 L383,12 L388,19 L393,55 L398,68 L403,60 L408,36 L413,26 L418,30 L423,40 L448,40 L588,40 L598,40 L601,38 L605,42 L608,40 L613,40 L628,40 L633,28 L638,18 L643,14 L648,21 L653,52 L658,64 L663,56 L668,37 L673,28 L678,32 L683,40 L708,40 L858,40 L868,40 L871,39 L875,41 L878,40 L883,40 L898,40 L903,32 L908,22 L913,18 L918,24 L923,48 L928,57 L933,51 L938,40 L943,34 L948,37 L953,40 L978,40 L1128,40 L1138,40 L1141,38 L1145,42 L1148,40 L1153,40 L1168,40 L1173,25 L1178,15 L1183,11 L1188,18 L1193,55 L1198,68 L1203,59 L1208,35 L1213,25 L1218,29 L1223,40 L1248,40 L1408,40 L1418,40 L1421,39 L1425,41 L1428,40 L1433,40 L1448,40 L1453,21 L1458,11 L1463,7 L1468,14 L1473,60 L1478,76 L1483,66 L1488,33 L1493,23 L1498,27 L1503,40 L1533,40 L1698,40 L1708,40 L1711,38 L1715,42 L1718,40 L1723,40 L1738,40 L1743,26 L1748,16 L1753,12 L1758,19 L1763,54 L1768,67 L1773,57 L1778,36 L1783,26 L1788,30 L1793,40 L1823,40 L2100,40"
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-100 0"
              to="150 0"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24 pb-6 sm:pb-12 lg:pb-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 text-xs mt-3 sm:-mt-16">
            <BuildingOffice2Icon className="w-3 h-3 text-white" />
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-white font-medium">العيادات</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-10 lg:gap-12 xl:gap-16 w-full">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 w-full text-center lg:text-right"
            >
              <div className="hidden sm:inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 sm:mb-5 border border-white/20 shadow-sm -mt-12 sm:-mt-14">
                <BuildingOffice2Icon className="w-5 h-5 text-white" />
                <span className="text-sm font-medium">عيادات موثوقة</span>
              </div>
              <h1 className="text-[2.9rem] sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 text-center lg:text-right">
                {bannerTitle}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-6 sm:mt-7 lg:mt-6 text-center lg:text-right">
                {bannerSubtitle}
              </p>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:flex-nowrap lg:justify-end lg:flex-1 w-full sm:w-auto"
            >
              <CompactStat 
                value={headerTotalCount} 
                label="عيادة" 
                icon={BuildingOffice2Icon} 
              />
              <CompactStat 
                value={headerOpenCount} 
                label="مفتوح" 
                icon={ClockIcon} 
              />
              <CompactStat 
                value={headerFeaturedCount} 
                label="مميز" 
                icon={SparklesIcon} 
              />
              <CompactStat 
                value={resultsCount} 
                label="نتيجة" 
                icon={FunnelIcon} 
              />
            </motion.div>
          </div>

          {/* Search and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full mt-12 sm:mt-24"
          >
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Search Input */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-2xl group-hover:bg-white/20 transition-all" />
                <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 shadow-2xl">
                  <div className="pl-3 pr-4 text-white/60">
                    <MagnifyingGlassIcon className="w-6 h-6" />
                  </div>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ابحث باسم العيادة، التخصص، أو المنطقة..."
                    className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 focus:ring-0 text-lg py-2 px-3"
                  />
                  <div className="flex items-center gap-2 border-r border-white/10 pr-2 mr-2">
                    {searchValue && (
                      <button
                        onClick={() => onSearchChange('')}
                        className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                    <VoiceSearchButton onVoiceResult={onSearchChange} />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <MapViewButton clinics={clinics} />
                
                <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 h-full">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-teal-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
                    title="عرض شبكي"
                  >
                    <Squares2X2Icon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-teal-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
                    title="عرض قائمة"
                  >
                    <ListBulletIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <QuickFilterButton
                icon={ClockIcon}
                label="مفتوح الآن"
                active={filters?.isOpen === true}
                onClick={() => onFiltersChange?.({ ...filters, isOpen: !filters?.isOpen })}
                count={headerOpenCount}
              />
              <QuickFilterButton
                icon={FireIcon}
                label="المميزة"
                active={filters?.isFeatured === true}
                onClick={() => onFiltersChange?.({ ...filters, isFeatured: !filters?.isFeatured })}
                count={headerFeaturedCount}
              />
              <QuickFilterButton
                icon={StarIcon}
                label="الأعلى تقييماً"
                active={filters?.ordering === '-ratingAvg'}
                onClick={() => onFiltersChange?.({ ...filters, ordering: filters?.ordering === '-ratingAvg' ? undefined : '-ratingAvg' })}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
