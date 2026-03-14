'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useImageSettings } from '@/components/ui/ImageSettingsProvider';
import { useTheme } from '@/components/shared/ThemeProvider';
import UniversalSmartHeaderCompact from '@/components/hospitals-pro/UniversalSmartHeaderCompact';
import type { CounterData } from '@/components/hospitals-pro/UniversalSmartHeader';
import type { EntityType } from '@/components/maps/MapContainer';
import {
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ClockIcon,
  HeartIcon,
  ShieldCheckIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type HeaderIconKey = 'building' | 'clock' | 'heart' | 'group' | 'check' | 'star' | 'shield';

const ICON_MAP: Record<HeaderIconKey, CounterData['icon']> = {
  building: BuildingOffice2Icon,
  clock: ClockIcon,
  heart: HeartIcon,
  group: UserGroupIcon,
  check: CheckBadgeIcon,
  star: StarIcon,
  shield: ShieldCheckIcon,
};

export interface HeaderCounterConfig {
  id: string;
  label: string;
  value: number;
  icon: HeaderIconKey;
  color: string;
  description?: string;
  isHighlighted?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface HeaderQuickFilterConfig {
  id: string;
  label: string;
  icon?: HeaderIconKey;
  count?: number;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}

interface UniversalHeaderClientProps {
  prefix: string;
  title: string;
  subtitle?: string;
  counters?: HeaderCounterConfig[];
  searchPlaceholder?: string;
  searchParamKey?: string;
  searchAction?: string;
  pageParamKey?: string;
  resetPageOnSearch?: boolean;
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
  sortOptions?: Array<{ value: string; label: string }>;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  quickFilters?: HeaderQuickFilterConfig[];
  quickFiltersOpen?: boolean;
  onQuickFiltersToggle?: (open: boolean) => void;
  showQuickFiltersToggle?: boolean;
  quickFiltersLabel?: string;
  resultsCount?: number;
  resultsLabel?: string;
  showResultsCount?: boolean;
  showMapButton?: boolean;
  mapButtonLabel?: string;
  mapEntityTypes?: EntityType[];
  mapTitle?: string;
  mapSubtitle?: string;
  className?: string;
  titleClassName?: string;
  countersClassName?: string;
  contentClassName?: string;
  breadcrumbClassName?: string;
  gradientFrom?: string;
  gradientTo?: string;
  useBannerText?: boolean;
}

export default function UniversalHeaderClient(props: UniversalHeaderClientProps) {
  return (
    <Suspense fallback={<div className="container-custom py-6" />}>
      <UniversalHeaderClientContent {...props} />
    </Suspense>
  );
}

function UniversalHeaderClientContent(props: UniversalHeaderClientProps) {
  const {
    prefix,
    title,
    subtitle,
    counters = [],
    searchPlaceholder,
    searchParamKey = 'search',
    searchAction,
    pageParamKey = 'page',
    resetPageOnSearch = true,
    viewMode,
    onViewModeChange,
    showViewToggle,
    showVoiceSearch,
    quickFilters,
    quickFiltersOpen,
    onQuickFiltersToggle,
    showQuickFiltersToggle,
    quickFiltersLabel,
    resultsCount,
    resultsLabel,
    showResultsCount,
    showMapButton,
    mapButtonLabel,
    mapEntityTypes,
    mapTitle,
    mapSubtitle,
    className,
    titleClassName,
    countersClassName,
    contentClassName,
    breadcrumbClassName,
    useBannerText = true,
  } = props;
  const settings = useImageSettings() as Record<string, unknown>;
  const { themeMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState('');
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    setSearchValue(searchParams.get(searchParamKey) ?? '');
  }, [searchParams, searchParamKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setPrefersDark(media.matches);
    handleChange();

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const bannerImage = useMemo(() => {
    const value = settings[`${prefix}BannerImage`];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }, [prefix, settings]);
  const bannerEnabled = useMemo(() => {
    const value = settings[`${prefix}BannerEnabled`];
    return typeof value === 'boolean' ? value : undefined;
  }, [prefix, settings]);
  const bannerOverlayColor = useMemo(() => {
    const value = settings[`${prefix}BannerOverlayColor`];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }, [prefix, settings]);
  const bannerOverlayOpacity = useMemo(() => {
    const value = settings[`${prefix}BannerOverlayOpacity`];
    return typeof value === 'number' ? value : undefined;
  }, [prefix, settings]);
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && prefersDark);
  const resolvedBannerOverlayColor = useMemo(() => {
    if (prefix === 'home' && isDarkMode) {
      return '#000000';
    }
    return bannerOverlayColor;
  }, [prefix, isDarkMode, bannerOverlayColor]);
  const resolvedBannerOverlayOpacity = useMemo(() => {
    if (prefix === 'home' && isDarkMode) {
      return 90;
    }
    return bannerOverlayOpacity;
  }, [prefix, isDarkMode, bannerOverlayOpacity]);
  const bannerTitle = useMemo(() => {
    const value = settings[`${prefix}BannerTitle`];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }, [prefix, settings]);
  const bannerSubtitle = useMemo(() => {
    const value = settings[`${prefix}BannerSubtitle`];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }, [prefix, settings]);
  const resolvedBannerTitle = useMemo(() => {
    if (prefix === 'home') {
      if (!bannerTitle || bannerTitle === 'دليل الخدمات الطبية') {
        return 'مستشفى دوت كوم';
      }
    }
    return bannerTitle;
  }, [prefix, bannerTitle]);

  const resolvedCounters = useMemo<CounterData[]>(
    () =>
      counters.map((counter) => ({
        ...counter,
        value: Number(counter.value) || 0,
        icon: ICON_MAP[counter.icon] ?? BuildingOffice2Icon,
      })),
    [counters]
  );

  const resolvedQuickFilters = useMemo(
    () =>
      (quickFilters ?? []).map((filter) => {
        const href = filter.href;
        return {
          id: filter.id,
          label: filter.label,
          count: filter.count,
          active: filter.active,
          icon: filter.icon ? ICON_MAP[filter.icon] ?? BuildingOffice2Icon : undefined,
          onClick: filter.onClick ?? (href ? () => router.push(String(href)) : undefined),
        };
      }),
    [quickFilters, router]
  );

  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set(searchParamKey, trimmed);
    } else {
      params.delete(searchParamKey);
    }
    if (resetPageOnSearch && pageParamKey) {
      params.set(pageParamKey, '1');
    }
    const destination = searchAction || pathname;
    const queryString = params.toString();
    router.push(queryString ? `${destination}?${queryString}` : destination);
  };

  return (
    <UniversalSmartHeaderCompact
      title={useBannerText ? resolvedBannerTitle || title : title}
      subtitle={useBannerText ? bannerSubtitle || subtitle : subtitle}
      counters={resolvedCounters}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onSearchSubmit={handleSearchSubmit}
      searchPlaceholder={searchPlaceholder}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      showViewToggle={showViewToggle}
      showVoiceSearch={showVoiceSearch}
      quickFilters={resolvedQuickFilters}
      quickFiltersOpen={quickFiltersOpen}
      onQuickFiltersToggle={onQuickFiltersToggle}
      showQuickFiltersToggle={showQuickFiltersToggle}
      quickFiltersLabel={quickFiltersLabel}
      resultsCount={resultsCount}
      resultsLabel={resultsLabel}
      showResultsCount={showResultsCount}
      showMapButton={showMapButton}
      mapButtonLabel={mapButtonLabel}
      mapEntityTypes={mapEntityTypes}
      mapTitle={mapTitle}
      mapSubtitle={mapSubtitle}
      className={className}
      titleClassName={titleClassName}
      countersClassName={countersClassName}
      contentClassName={contentClassName}
      breadcrumbClassName={breadcrumbClassName}
      bannerImage={bannerImage}
      bannerEnabled={bannerEnabled}
      bannerOverlayColor={resolvedBannerOverlayColor}
      bannerOverlayOpacity={resolvedBannerOverlayOpacity}
    />
  );
}
