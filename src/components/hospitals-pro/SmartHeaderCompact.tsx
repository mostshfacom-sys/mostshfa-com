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
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { VoiceSearchButton } from './VoiceSearchButton';
import { MapViewButton } from './MapViewButton';
import type { Hospital, HospitalFilters, FilterOption } from '@/types/hospital';
import { fetchHospitals } from '@/lib/api/hospitals';
import { useImageSettings } from '@/components/ui/ImageSettingsProvider';

interface SmartHeaderProps {
  headerTotalCount: number;
  headerOpenCount: number;
  headerEmergencyCount: number;
  resultsCount: number;
  openCount: number; // used for quick filter badge only
  averageRating: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  hospitals: Hospital[];
  filters?: HospitalFilters;
  onFiltersChange?: (filters: HospitalFilters) => void;
  hospitalTypes?: FilterOption[];
}

const HEADER_BACKGROUND_FALLBACK = '/images/hospitals/hospital.jpg';

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

export function SmartHeader({
  headerTotalCount,
  headerOpenCount,
  headerEmergencyCount,
  resultsCount,
  openCount,
  averageRating,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  hospitals,
  filters,
  onFiltersChange,
  hospitalTypes,
}: SmartHeaderProps) {
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const {
    hospitalsBannerImage,
    hospitalsBannerEnabled,
    hospitalsBannerOverlayColor,
    hospitalsBannerOverlayOpacity,
    hospitalsBannerTitle,
    hospitalsBannerSubtitle,
  } = useImageSettings();
  const bannerImage = hospitalsBannerImage?.trim()
    ? hospitalsBannerImage.trim()
    : HEADER_BACKGROUND_FALLBACK;
  const backgroundLayers = hospitalsBannerEnabled === false
    ? `url(${HEADER_BACKGROUND_FALLBACK})`
    : `url(${bannerImage}), url(${HEADER_BACKGROUND_FALLBACK})`;
  const overlayColor = hospitalsBannerOverlayColor?.trim() || '#0f172a';
  const overlayOpacity =
    typeof hospitalsBannerOverlayOpacity === 'number'
      ? Math.min(Math.max(hospitalsBannerOverlayOpacity, 0), 100) / 100
      : 0.7;
  const bannerTitle = hospitalsBannerTitle?.trim() || 'دليل المستشفيات';
  const bannerSubtitle = hospitalsBannerSubtitle?.trim() || 'اكتشف وقارن بين أفضل المستشفيات في مصر';

  // Calculate additional stats
  const [quickCounts, setQuickCounts] = useState<{ emergency: number; featured: number; gov: number; priv: number; specialized: number }>({ emergency: 0, featured: 0, gov: 0, priv: 0, specialized: 0 });
  const emergencyCount = quickCounts.emergency;
  const featuredCount = quickCounts.featured;
  const governmentCount = quickCounts.gov;
  const privateCount = quickCounts.priv;
  const specializedCount = quickCounts.specialized;

  // Quick filter helpers (exclusive behavior)
  const getTypeIdByKeyword = (kw: string): number | undefined => {
    const fromOptions = hospitalTypes?.find(t =>
      (t.name_ar || '').includes(kw) || (t.name_en || '').toLowerCase().includes(kw.toLowerCase())
    );
    if (fromOptions) return fromOptions.id;
    const fromHosp = (hospitals || []).find(h => (h.hospital_type_name_ar || '').includes(kw));
    return (fromHosp?.hospital_type as number | undefined) || undefined;
  };
  const govTypeId = getTypeIdByKeyword('حكومي') ?? getTypeIdByKeyword('عام');
  const privateTypeId = getTypeIdByKeyword('خاص');
  const specializedTypeId = getTypeIdByKeyword('تخصصي');

  const applyQuickFilter = (
    kind: 'open' | 'emergency' | 'featured' | 'top' | 'gov' | 'private' | 'specialized'
  ) => {
    if (!onFiltersChange) return;
    const base: HospitalFilters = {
      ...(filters || {}),
      page: 1,
      // Exclusive quick filters: clear others
      is_open: undefined,
      has_emergency: undefined,
      is_featured: undefined,
      hospital_type: undefined,
    };
    switch (kind) {
      case 'open':
        base.is_open = !filters?.is_open;
        break;
      case 'emergency':
        base.has_emergency = !filters?.has_emergency;
        break;
      case 'featured':
        base.is_featured = !filters?.is_featured;
        break;
      case 'top':
        base.ordering = filters?.ordering === '-rating_avg' ? undefined : '-rating_avg';
        break;
      case 'gov':
        if (govTypeId && filters?.hospital_type === govTypeId) {
          base.hospital_type = undefined;
        } else {
          base.hospital_type = govTypeId;
        }
        break;
      case 'private':
        if (privateTypeId && filters?.hospital_type === privateTypeId) {
          base.hospital_type = undefined;
        } else {
          base.hospital_type = privateTypeId;
        }
        break;
      case 'specialized':
        if (specializedTypeId && filters?.hospital_type === specializedTypeId) {
          base.hospital_type = undefined;
        } else {
          base.hospital_type = specializedTypeId;
        }
        break;
    }
    onFiltersChange(base);
  };

  // Fetch total counts per quick filter based on base filters (excluding quick toggles)
  useEffect(() => {
    const run = async () => {
      try {
        const base: HospitalFilters = {
          ...(filters || {}),
          page: 1,
          is_open: undefined,
          has_emergency: undefined,
          is_featured: undefined,
          hospital_type: undefined,
          ordering: undefined,
        };
        const tasks: Array<Promise<any>> = [];
        tasks.push(fetchHospitals({ ...base, has_emergency: true }).catch(() => ({ count: 0 })));
        tasks.push(fetchHospitals({ ...base, is_featured: true }).catch(() => ({ count: 0 })));
        const govTask = govTypeId ? fetchHospitals({ ...base, hospital_type: govTypeId }).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 });
        const privTask = privateTypeId ? fetchHospitals({ ...base, hospital_type: privateTypeId }).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 });
        const specTask = specializedTypeId ? fetchHospitals({ ...base, hospital_type: specializedTypeId }).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 });
        tasks.push(govTask, privTask, specTask);
        const [emg, feat, gov, priv, spec] = await Promise.all(tasks);
        setQuickCounts({
          emergency: Number(emg?.count || 0),
          featured: Number(feat?.count || 0),
          gov: Number(gov?.count || 0),
          priv: Number(priv?.count || 0),
          specialized: Number(spec?.count || 0),
        });
      } catch {
        setQuickCounts({ emergency: 0, featured: 0, gov: 0, priv: 0, specialized: 0 });
      }
    };
    run();
    // Only recompute when base filters that affect totals change
  }, [
    filters?.search,
    filters?.governorate,
    filters?.city,
    filters?.district,
    JSON.stringify(filters?.specialties || []),
    JSON.stringify(filters?.services || []),
    govTypeId,
    privateTypeId,
    specializedTypeId,
  ]);

  return (
    <header className="hospitals-header relative text-white overflow-hidden">
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: backgroundLayers,
        }}
      />
      
      {/* Overlay for better text readability */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] " />
      </div>

      {/* Animated Heartbeat Line - Irregular ECG */}
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
          
          {/* Continuous irregular heartbeat */}
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

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24 pb-6 sm:pb-12 lg:pb-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 text-xs mt-3 sm:-mt-16">
            <BuildingOffice2Icon className="w-3 h-3 text-white" />
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-white font-medium">المستشفيات</span>
          </div>

          {/* Main Row: Title + Stats */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-10 lg:gap-12 xl:gap-16 w-full">
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 w-full text-center lg:text-right"
            >
              <div className="hidden sm:inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 sm:mb-5 border border-white/20 shadow-sm -mt-12 sm:-mt-14">
                <BuildingOffice2Icon className="w-5 h-5 text-white" />
                <span className="text-sm font-medium">مستشفيات موثوقة</span>
              </div>
              <h1 className="text-[2.9rem] sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 text-center lg:text-right">
                {bannerTitle}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-6 sm:mt-7 lg:mt-6 text-center lg:text-right">
                {bannerSubtitle}
              </p>
            </motion.div>

            {/* Stats - Compact */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:flex-nowrap lg:justify-end lg:flex-1 w-full sm:w-auto"
            >
              <CompactStat
                value={headerTotalCount}
                label="مستشفى"
                icon={BuildingOffice2Icon}
              />
              <CompactStat
                value={headerOpenCount}
                label="مفتوح"
                icon={BoltIcon}
              />
              <CompactStat
                value={headerEmergencyCount}
                label="طوارئ"
                icon={HeartIcon}
              />
              <CompactStat
                value={averageRating}
                label="تقييم"
                icon={StarIcon}
              />
            </motion.div>
          </div>

        </div>

        {/* Search Bar + Controls + Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full mt-12 sm:mt-24"
        >
          {/* Search Row + Controls */}
          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
              <div className="flex w-full items-stretch gap-2 lg:max-w-lg xl:max-w-xl">
                <div className="relative flex-1 min-w-0 cursor-text">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 z-10 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="اكتب اي شيء تتذكره للبحث عن مستشفى"
                    className="w-full h-full pr-11 pl-4 py-3 text-right bg-white/15 backdrop-blur-xl border-2 border-white/30 rounded-lg focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all text-white placeholder-white/60 text-sm shadow-lg cursor-text"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-colors text-white z-10"
                      aria-label="مسح البحث"
                      title="مسح"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <VoiceSearchButton
                  onVoiceResult={onSearchChange}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-white/15 p-3 text-white hover:bg-white/20 transition-colors"
                />
              </div>

              <div className="hidden sm:flex flex-wrap items-stretch gap-2 sm:gap-3 w-full lg:w-auto lg:justify-end">
                {/* Quick Filters Toggle - Enhanced */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowQuickFilters(!showQuickFilters)}
                  className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r backdrop-blur-md border-2 rounded-lg font-medium transition-all shadow-lg whitespace-nowrap cursor-pointer w-full sm:w-auto ${
                    showQuickFilters
                      ? 'from-purple-500/30 to-pink-500/30 border-purple-400/50 hover:shadow-purple-500/20'
                      : 'from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5 text-white" />
                  <span className="text-sm">فلاتر سريعة</span>
                  <div className="hidden sm:block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                </motion.button>

                {/* Map View Button */}
                <div className="hidden md:flex">
                  <MapViewButton hospitals={hospitals} />
                </div>

                {/* Results Count + View Mode */}
                <div className="flex items-stretch gap-2 w-full sm:w-auto">
                  {/* Results Count */}
                  <div className="flex items-center gap-2 px-3 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg">
                    <MapPinIcon className="w-4 h-4 text-white" />
                    <span className="font-medium text-xs">
                      {(resultsCount || 0).toLocaleString('ar-EG')} نتيجة
                    </span>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center gap-1 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg p-1">
                    <button
                      onClick={() => onViewModeChange('grid')}
                      className={`p-2.5 rounded-lg transition-all shadow-md cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white/30 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                      aria-label="عرض شبكي"
                    >
                      <Squares2X2Icon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => onViewModeChange('list')}
                      className={`p-2.5 rounded-lg transition-all shadow-md cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-white/30 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                      aria-label="عرض قائمة"
                    >
                      <ListBulletIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Controls Order */}
            <div className="grid grid-cols-4 gap-2 sm:hidden">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowQuickFilters(!showQuickFilters)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 bg-gradient-to-r backdrop-blur-md border-2 rounded-lg font-medium transition-all shadow-lg whitespace-nowrap cursor-pointer w-full text-[10px] ${
                  showQuickFilters
                    ? 'from-purple-500/30 to-pink-500/30 border-purple-400/50 hover:shadow-purple-500/20'
                    : 'from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20'
                }`}
              >
                <FunnelIcon className="w-4 h-4 text-white" />
                <span className="text-[10px] leading-tight">فلاتر سريعة</span>
              </motion.button>

              <MapViewButton hospitals={hospitals} compact className="w-full justify-center px-2 py-2" />

              <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg">
                <span className="font-bold text-xs tabular-nums">
                  {(resultsCount || 0).toLocaleString('ar-EG')}
                </span>
                <span className="text-[10px] text-white/80">نتيجة</span>
              </div>

              <button
                onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg text-white shadow-md text-[10px]"
                aria-label="تغيير العرض"
              >
                {viewMode === 'grid' ? (
                  <ListBulletIcon className="w-4 h-4 text-white" />
                ) : (
                  <Squares2X2Icon className="w-4 h-4 text-white" />
                )}
                <span className="text-[10px] leading-tight">تغيير العرض</span>
              </button>
            </div>

            {/* Quick Filters Bar - Fixed Height */}
            <div className="relative min-h-[64px] sm:min-h-[64px]">
              <motion.div
                initial={false}
                animate={{ opacity: showQuickFilters ? 1 : 0, y: showQuickFilters ? 0 : -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                aria-hidden={!showQuickFilters}
                className={`flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2 overflow-x-hidden sm:overflow-x-auto overflow-y-visible py-2 px-1 sm:px-0 ${
                  showQuickFilters ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.2) rgba(255,255,255,0.05)'
                }}
              >
                <QuickFilterButton
                  icon={ClockIcon}
                  label="مفتوح الآن"
                  count={openCount}
                  onClick={() => applyQuickFilter('open')}
                  active={!!filters?.is_open}
                />
                <QuickFilterButton
                  icon={HeartIcon}
                  label="طوارئ 24/7"
                  count={emergencyCount}
                  onClick={() => applyQuickFilter('emergency')}
                  active={!!filters?.has_emergency}
                />
                <QuickFilterButton
                  icon={StarIcon}
                  label="أعلى تقييماً"
                  onClick={() => applyQuickFilter('top')}
                  active={sortValue === '-rating_avg'}
                />
                <QuickFilterButton
                  icon={SparklesIcon}
                  label="مميز"
                  count={featuredCount}
                  onClick={() => applyQuickFilter('featured')}
                  active={!!filters?.is_featured}
                />
                <div className="hidden sm:flex items-center gap-2">
                  <QuickFilterButton
                    icon={BuildingLibraryIcon}
                    label="حكومي"
                    count={governmentCount}
                    onClick={() => applyQuickFilter('gov')}
                    active={!!govTypeId && filters?.hospital_type === govTypeId}
                  />
                  <QuickFilterButton
                    icon={BuildingStorefrontIcon}
                    label="خاص"
                    count={privateCount}
                    onClick={() => applyQuickFilter('private')}
                    active={!!privateTypeId && filters?.hospital_type === privateTypeId}
                  />
                  <QuickFilterButton
                    icon={ShieldCheckIcon}
                    label="تخصصي"
                    count={specializedCount}
                    onClick={() => applyQuickFilter('specialized')}
                    active={!!specializedTypeId && filters?.hospital_type === specializedTypeId}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

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
    </header>
  );
}
