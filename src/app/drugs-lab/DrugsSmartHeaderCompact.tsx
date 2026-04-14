'use client';

import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapPinIcon,
  FunnelIcon,
  XMarkIcon,
  BeakerIcon,
  CurrencyPoundIcon,
  PhotoIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, BoltIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
          '0 4px 6px rgba(0,0,0,0.1)',
          '0 8px 12px rgba(0,0,0,0.15)',
          '0 4px 6px rgba(0,0,0,0.1)',
        ],
      }}
      transition={{
        boxShadow: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        },
      }}
      whileHover={{
        scale: 1.04,
        y: -3,
        boxShadow: '0 10px 20px rgba(0,0,0,0.18)',
      }}
      className="flex flex-col items-center gap-1 px-2 py-2.5 sm:px-2.5 sm:py-3 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border-2 border-white/30 rounded-xl hover:border-white/50 transition-all shadow-md hover:shadow-lg w-full sm:w-[140px] sm:flex-none text-center min-w-0"
    >
      <motion.div
        animate={{
          rotate: [0, 5, 0, -5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
        }}
      >
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-lg" />
      </motion.div>
      <div className="flex flex-col items-center gap-0.5 min-w-0">
        <span
          className="text-sm sm:text-base lg:text-lg font-black text-white drop-shadow-md tabular-nums text-center"
          dir="ltr"
        >
          {formattedValue}
        </span>
        <span className="text-[10px] sm:text-xs text-white/80 font-medium leading-tight text-center max-w-[6.5rem] sm:max-w-[7.5rem] break-words">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function DrugsSmartHeaderCompact({
  title,
  subtitle,
  resultsCount,
  totalCount,
  pricedCount,
  imagesCount,
  ingredientCount,
}: {
  title: string;
  subtitle: string;
  resultsCount: number;
  totalCount: number;
  pricedCount: number;
  imagesCount: number;
  ingredientCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParam = (searchParams?.get('search') || '').trim();
  const sortParam = (searchParams?.get('sort') || 'nameAsc').trim();
  const viewParam = (searchParams?.get('view') || 'grid').trim();

  const [searchValue, setSearchValue] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchValue, 500);

  useEffect(() => {
    setSearchValue(searchParam);
  }, [searchParam]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1');
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    if (debouncedSearch !== searchParam) {
      updateQuery({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeViewMode = (viewParam === 'list' ? 'list' : 'grid') as 'grid' | 'list';

  const stats = useMemo(
    () => [
      { value: totalCount, label: 'دواء', icon: TagIcon },
      { value: pricedCount, label: 'بالسعر', icon: CurrencyPoundIcon },
      { value: imagesCount, label: 'بالصور', icon: PhotoIcon },
      { value: ingredientCount, label: 'بمادة فعالة', icon: BeakerIcon },
    ],
    [totalCount, pricedCount, imagesCount, ingredientCount]
  );

  return (
    <header className="hospitals-header relative text-white overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hospitals/hospital.jpg)' }} />
      <div className="absolute inset-0" style={{ backgroundColor: '#0f172a', opacity: 0.7 }} />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] " />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 pt-12 pb-6 sm:pt-16 sm:pb-8 lg:pt-18 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex items-center gap-2 text-white/70 text-xs mt-2 sm:-mt-10">
            <TagIcon className="w-3 h-3 text-white" />
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-white font-medium">الأدوية</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center justify-between gap-6 sm:gap-8 lg:gap-10 xl:gap-12 w-full">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 min-w-0 w-full text-center lg:text-right">
              <div className="hidden sm:inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3 sm:mb-4 border border-white/20 shadow-sm -mt-8 sm:-mt-10">
                <BoltIcon className="w-4 h-4 text-white" />
                <span className="text-xs font-medium">دليل أدوية موثوق</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 text-center lg:text-right break-words">{title}</h1>
              <p className="text-sm sm:text-base text-white/80 mt-3 sm:mt-4 text-center lg:text-right">{subtitle}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:gap-2.5 lg:flex-nowrap lg:justify-end lg:flex-1 w-full sm:w-auto"
            >
              {stats.map((s) => (
                <CompactStat key={s.label} value={s.value} label={s.label} icon={s.icon} />
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full mt-6 sm:mt-10">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-3 sm:gap-4 lg:gap-4 xl:gap-6">
                <div className="flex w-full items-stretch gap-2 lg:max-w-lg xl:max-w-xl">
                  <div className="relative flex-1 min-w-0 cursor-text">
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 z-10 pointer-events-none">
                      <MagnifyingGlassIcon className="w-4 h-4 text-white" />
                    </div>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="اكتب اي شيء تتذكره للبحث عن دواء"
                      className="w-full h-full pr-9 pl-3 py-2.5 text-right bg-white/15 backdrop-blur-xl border-2 border-white/30 rounded-lg focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all text-white placeholder-white/60 text-sm shadow-lg cursor-text"
                    />
                    {searchValue && (
                      <button
                        type="button"
                        onClick={() => setSearchValue('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-colors text-white z-10"
                        aria-label="مسح البحث"
                        title="مسح"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex flex-wrap items-stretch gap-2 sm:gap-3 w-full lg:w-auto lg:justify-end">
                  <div className="flex items-stretch gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg">
                      <MapPinIcon className="w-3.5 h-3.5 text-white" />
                      <span className="font-medium text-[11px]">{(resultsCount || 0).toLocaleString('ar-EG')} نتيجة</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg p-1">
                      <button
                        onClick={() => updateQuery({ view: 'grid' })}
                        className={`p-2 rounded-lg transition-all shadow-md cursor-pointer ${
                          activeViewMode === 'grid' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                        aria-label="عرض شبكي"
                      >
                        <Squares2X2Icon className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={() => updateQuery({ view: 'list' })}
                        className={`p-2 rounded-lg transition-all shadow-md cursor-pointer ${
                          activeViewMode === 'list' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                        aria-label="عرض قائمة"
                      >
                        <ListBulletIcon className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="relative min-w-[210px]">
                    <select
                      value={sortParam}
                      onChange={(e) => updateQuery({ sort: e.target.value })}
                      className="w-full h-full appearance-none bg-white/15 backdrop-blur-xl border-2 border-white/30 rounded-lg pr-3 pl-9 text-[11px] sm:text-xs font-medium text-white outline-none cursor-pointer hover:bg-white/20 transition-all"
                    >
                      <option value="nameAsc">الاسم (أ - ي)</option>
                      <option value="nameDesc">الاسم (ي - أ)</option>
                      <option value="updatedDesc">الأحدث أولاً</option>
                    </select>
                    <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:hidden">
                <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg">
                  <span className="font-bold text-xs tabular-nums">{(resultsCount || 0).toLocaleString('ar-EG')}</span>
                  <span className="text-[10px] text-white/80">نتيجة</span>
                </div>
                <button
                  onClick={() => updateQuery({ view: activeViewMode === 'grid' ? 'list' : 'grid' })}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-lg text-white shadow-md text-[10px]"
                  aria-label="تغيير العرض"
                >
                  {activeViewMode === 'grid' ? (
                    <ListBulletIcon className="w-4 h-4 text-white" />
                  ) : (
                    <Squares2X2Icon className="w-4 h-4 text-white" />
                  )}
                  <span className="text-[10px] leading-tight">تغيير العرض</span>
                </button>
                <div className="col-span-2 relative">
                  <select
                    value={sortParam}
                    onChange={(e) => updateQuery({ sort: e.target.value })}
                    className="w-full h-full appearance-none bg-white/15 backdrop-blur-xl border-2 border-white/30 rounded-lg pr-3 pl-9 text-[11px] font-medium text-white outline-none cursor-pointer hover:bg-white/20 transition-all"
                  >
                    <option value="nameAsc">الاسم (أ - ي)</option>
                    <option value="nameDesc">الاسم (ي - أ)</option>
                    <option value="updatedDesc">الأحدث أولاً</option>
                  </select>
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
