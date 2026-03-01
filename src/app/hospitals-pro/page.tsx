'use client';

import './no-shadow.css';
import { useState, useEffect } from 'react';
import { SmartHeader } from '@/components/hospitals-pro/SmartHeaderCompact';
import { HospitalCardPro } from '@/components/hospitals-pro/HospitalCardPro';
import { HospitalCardList } from '@/components/hospitals-pro/HospitalCardList';
import { SmartFilters } from '@/components/hospitals-pro/SmartFiltersEnhanced';
import { RecentlyViewedPanel } from '@/components/hospitals-pro/RecentlyViewedPanel';
import { CompareBar } from '@/components/hospitals-pro/CompareBar';
import { SkeletonCard, SkeletonCardList } from '@/components/shared/SkeletonCard';
import SearchStatusBar from '@/components/hospitals-pro/SearchStatusBar';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { fetchHospitals } from '@/lib/api/hospitals';
import { fetchFilterOptions } from '@/lib/api/filters';
import type { Hospital, HospitalFilters, FilterOption, MatchContext } from '@/types/hospital';
import { normalizeArabicText, searchIncludes } from '@/lib/utils/searchNormalize';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/shared';

export default function HospitalsProPage() {
  // State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [headerCounts, setHeaderCounts] = useState<{ total: number; open: number; emergency: number }>({ total: 0, open: 0, emergency: 0 });
  
  // Favorites
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Search states - SEPARATED
  const [headerSearch, setHeaderSearch] = useState(''); // Header search (searches everything always)
  const [filterSearch, setFilterSearch] = useState(''); // Filter sidebar search (contextual)
  
  // Filters
  const [filters, setFilters] = useState<HospitalFilters>({
    page: 1,
    ordering: '-rating_avg',
  });
  
  // Filter Options (would normally come from API)
  const [hospitalTypes, setHospitalTypes] = useState<FilterOption[]>([]);
  const [governorates, setGovernorates] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [specialties, setSpecialties] = useState<FilterOption[]>([]);
  const [services, setServices] = useState<FilterOption[]>([]);
  
  // Debounce searches
  const debouncedHeaderSearch = useDebounce(headerSearch, 500);
  const debouncedFilterSearch = useDebounce(filterSearch, 500);
  
  // Active search (for highlighting)
  const activeSearchQuery = debouncedHeaderSearch || debouncedFilterSearch || '';

  // Calculate stats - Simple count from filtered results
  const openCount = hospitals.reduce((acc: number, h: any) => {
    return acc + (h?.is_open ? 1 : 0);
  }, 0);
  const totalRating = hospitals.reduce((sum, h) => {
    const rating = typeof h.rating_avg === 'number' ? h.rating_avg : parseFloat(String(h.rating_avg || 0));
    return sum + rating;
  }, 0);
  const averageRating = hospitals.length > 0 ? totalRating / hospitals.length : 0;

  // Client-side Arabic-normalized matching (same logic as filter lists)
  const hospitalMatches = (h: any, term: string): boolean => {
    if (!term) return true;
    const t = normalizeArabicText(term);
    const traw = String(term || '').toLowerCase();
    // Map common query words to boolean flags
    const isEmergencyQuery = t.includes('طوار') || traw.includes('emerg') || t.includes('اسعاف');
    if (isEmergencyQuery && h?.has_emergency) return true;
    const fields: string[] = [];
    fields.push(
      h?.name_ar || '',
      h?.name_en || '',
      h?.slug || '',
      h?.address || '',
      h?.address_details || '',
      h?.description || '',
      h?.phone || '',
      h?.whatsapp || '',
      h?.website || '',
      h?.facebook || '',
      h?.other_social || '',
      h?.type_name || '',
      h?.hospital_type_name_ar || '',
      h?.hospital_type_name_en || '',
      h?.governorate_name || '',
      h?.city_name || '',
      h?.district_name || '',
    );
    if (Array.isArray(h?.specialties)) {
      for (const s of h.specialties) {
        fields.push(s?.name_ar || '', s?.name_en || '');
      }
    }
    if (Array.isArray(h?.services)) {
      for (const s of h.services) {
        fields.push(s?.name_ar || '', s?.name_en || '');
      }
    }
    for (const f of fields) {
      if (f && normalizeArabicText(f).includes(t)) return true;
    }
    return false;
  };

  // Compute match_context locally when needed (normalized)
  const computeMatchContext = (h: any, term: string): MatchContext | null => {
    if (!term) return null;
    const t = normalizeArabicText(term);
    const traw = String(term || '').toLowerCase();
    const isEmergencyQuery = t.includes('طوار') || traw.includes('emerg') || t.includes('اسعاف');
    if (isEmergencyQuery && h?.has_emergency) {
      return { field: 'service', type: 'طوارئ', color: 'orange' };
    }
    if (searchIncludes(h?.name_ar || '', term) || searchIncludes(h?.name_en || '', term)) {
      return { field: 'name', type: 'الاسم', color: 'blue' };
    }
    if (searchIncludes(h?.hospital_type_name_ar || h?.type_name || '', term) || searchIncludes(h?.hospital_type_name_en || '', term)) {
      return { field: 'type', type: 'النوع', color: 'teal' };
    }
    if (searchIncludes(h?.governorate_name || '', term)) {
      return { field: 'governorate', type: 'المحافظة', color: 'purple' };
    }
    if (searchIncludes(h?.city_name || '', term)) {
      return { field: 'city', type: 'المدينة', color: 'purple' };
    }
    if (searchIncludes(h?.district_name || '', term)) {
      return { field: 'district', type: 'المنطقة', color: 'purple' };
    }
    if (Array.isArray(h?.specialties)) {
      for (const s of h.specialties) {
        if (searchIncludes(s?.name_ar || '', term) || searchIncludes(s?.name_en || '', term)) {
          return { field: 'specialty', type: 'التخصص', color: 'amber' };
        }
      }
    }
    if (Array.isArray(h?.services)) {
      for (const s of h.services) {
        if (searchIncludes(s?.name_ar || '', term) || searchIncludes(s?.name_en || '', term)) {
          return { field: 'service', type: 'الخدمة', color: 'orange' };
        }
      }
    }
    if (searchIncludes(h?.description || '', term)) {
      return { field: 'description', type: 'الوصف', color: 'gray' };
    }
    if (searchIncludes(h?.address || '', term) || searchIncludes(h?.address_details || '', term)) {
      return { field: 'description', type: 'العنوان', color: 'gray' };
    }
    if (
      searchIncludes(h?.phone || '', term) ||
      searchIncludes(h?.whatsapp || '', term) ||
      searchIncludes(h?.website || '', term) ||
      searchIncludes(h?.facebook || '', term) ||
      searchIncludes(h?.other_social || '', term)
    ) {
      return { field: 'description', type: 'التواصل', color: 'gray' };
    }
    return null;
  };

  // Load filter options from API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await fetchFilterOptions();
        setHospitalTypes(options.hospital_types);
        setGovernorates(options.governorates);
        setCities(options.cities || []);
        setSpecialties(options.specialties);
        setServices(options.services);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Load global header counters (independent of current filters)
  useEffect(() => {
    let mounted = true;
    const loadHeaderCounts = async () => {
      try {
        const [allRes, openRes, emergencyRes] = await Promise.all([
          fetchHospitals({ page: 1 }).catch(() => ({ count: 0, results: [] } as any)),
          fetchHospitals({ page: 1, is_open: true }).catch(() => ({ count: 0, results: [] } as any)),
          fetchHospitals({ page: 1, has_emergency: true }).catch(() => ({ count: 0, results: [] } as any)),
        ]);
        if (!mounted) return;
        setHeaderCounts({
          total: Number(allRes?.count || 0),
          open: Number(openRes?.count || 0),
          emergency: Number(emergencyRes?.count || 0),
        });
      } catch {
        if (!mounted) return;
        setHeaderCounts({ total: 0, open: 0, emergency: 0 });
      }
    };
    loadHeaderCounts();
    return () => { mounted = false; };
  }, []);

  // Fetch hospitals
  useEffect(() => {
    const loadHospitals = async () => {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      try {
        // If header search is active, ignore all filters (search everything)
        // If filter search is active, respect filters (search within filtered results)
        const activeSearch = debouncedHeaderSearch || debouncedFilterSearch || undefined;
        
        const updatedFilters = {
          ...filters,
          search: activeSearch,
          // If header search is active, clear all filters except ordering
          ...(debouncedHeaderSearch ? {
            hospital_type: undefined,
            governorate: undefined,
            city: undefined,
            district: undefined,
            has_emergency: undefined,
            is_featured: undefined,
            specialties: undefined,
            services: undefined,
          } : {}),
          page: currentPage,
          is_open: undefined, // Don't send to backend, filter client-side
        } as HospitalFilters;
        
        const response = await fetchHospitals(updatedFilters);
        let results: any[] = response.results as any[];
        let count = response.count;

        // Filter client-side for is_open (data already includes is_open from serializer)
        if (filters.is_open && !debouncedHeaderSearch) {
          results = results.filter(h => h.is_open === true);
          count = results.length;
        }

        // Rank with client-side Arabic normalization (and fallback if backend misses)
        if (debouncedHeaderSearch || debouncedFilterSearch) {
          const term = (debouncedHeaderSearch || debouncedFilterSearch) as string;
          const matched = results.filter(h => hospitalMatches(h, term));
          if (matched.length > 0) {
            const unmatched = results.filter(h => !hospitalMatches(h, term));
            results = [...matched, ...unmatched];
          }
          // Always ensure match_context when searching
          results = results.map((h: any) => ({
            ...h,
            match_context: h.match_context || computeMatchContext(h, term),
          }));
          // Only fallback if server returned zero results
          if (count === 0 && currentPage === 1) {
            const response2 = await fetchHospitals({ ...updatedFilters, search: undefined, page: 1, page_size: 500 });
            const fallbackResults: any[] = (response2.results as any[]) || [];
            const filteredFallback = fallbackResults.filter(h => hospitalMatches(h, term)).map((h: any) => ({
              ...h,
              match_context: computeMatchContext(h, term),
            }));
            results = filteredFallback;
            count = filteredFallback.length;
          }
        }

        // If page 1, replace hospitals; otherwise append
        if (currentPage === 1) {
          setHospitals(results as any);
        } else {
          setHospitals(prev => [...prev, ...results]);
        }
        setTotalCount(count);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        setError('حدث خطأ أثناء تحميل البيانات');
        if (currentPage === 1) {
          setHospitals([]);
          setTotalCount(0);
        }
      } finally {
        if (currentPage === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };
    
    loadHospitals();
  }, [
    debouncedHeaderSearch,
    debouncedFilterSearch,
    currentPage,
    filters.ordering,
    filters.hospital_type,
    filters.governorate,
    filters.city,
    filters.district,
    filters.has_emergency,
    filters.is_open,
    filters.is_featured,
    filters.specialties,
    filters.services,
  ]);

  // Reset page when filters or search change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [
    debouncedHeaderSearch,
    debouncedFilterSearch,
    filters.hospital_type,
    filters.governorate,
    filters.city,
    filters.has_emergency,
    filters.is_open,
    filters.is_featured,
    JSON.stringify(filters.specialties || []),
    JSON.stringify(filters.services || []),
  ]);

  // Header search handlers
  const handleHeaderSearchChange = (value: string) => {
    setHeaderSearch(value);
    // Clear filter search when header search is used
    if (value) {
      setFilterSearch('');
    }
  };

  const handleClearHeaderSearch = () => {
    setHeaderSearch('');
  };

  // Filter search handlers  
  const handleFilterSearchChange = (value: string) => {
    setFilterSearch(value);
    // Clear header search when filter search is used
    if (value) {
      setHeaderSearch('');
    }
  };

  const handleClearFilterSearch = () => {
    setFilterSearch('');
  };

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, ordering: value }));
  };

  // Clear all searches (legacy compatibility)
  const handleClearSearch = () => {
    setHeaderSearch('');
    setFilterSearch('');
  };

  const handleFiltersChange = (newFilters: HospitalFilters) => {
    setFilters(newFilters);
  };


  const handleClearFilters = () => {
    setFilters(prev => ({ search: prev.search, ordering: prev.ordering, page: 1 }));
  };

  const handleShowAll = () => {
    setFilters({ page: 1, ordering: filters.ordering });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* Header */}
        <SmartHeader
          headerTotalCount={headerCounts.total}
          headerOpenCount={headerCounts.open}
          headerEmergencyCount={headerCounts.emergency}
          resultsCount={totalCount}
          openCount={openCount}
          averageRating={averageRating}
          searchValue={headerSearch}
          onSearchChange={handleHeaderSearchChange}
          sortValue={filters.ordering ?? ''}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hospitals={hospitals}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          hospitalTypes={hospitalTypes}
        />

        {/* Main Content */}
        <main className="w-full px-6 py-8 max-w-[1920px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <SmartFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                hospitalTypes={hospitalTypes}
                governorates={governorates}
                cities={cities}
                specialties={specialties}
                services={services}
                filterSearch={filterSearch}
                onFilterSearchChange={handleFilterSearchChange}
                onClearFilterSearch={handleClearFilterSearch}
              />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              <SearchStatusBar
                searchValue={headerSearch || filterSearch}
                filters={filters}
                hospitalTypes={hospitalTypes}
                governorates={governorates}
                cities={cities}
                specialties={specialties}
                services={services}
                resultsCount={totalCount}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onClearSearch={handleClearSearch}
                onClearFilters={handleClearFilters}
                onShowAll={handleShowAll}
                onFiltersChange={handleFiltersChange}
              />

              {/* Loading State */}
              {loading && currentPage === 1 && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
                  {[...Array(8)].map((_, i) => (
                    viewMode === 'grid' ? (
                      <SkeletonCard key={i} />
                    ) : (
                      <SkeletonCardList key={i} />
                    )
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="inline-block p-6 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-2xl">
                    <p className="text-lg font-semibold">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!loading && !error && hospitals.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="inline-block p-12 bg-neutral-100 dark:bg-neutral-800 rounded-3xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                      لا توجد نتائج
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      جرب تغيير كلمات البحث أو الفلاتر
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {!loading && !error && hospitals.length > 0 && (
                <>
                  {/* Results Count */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <p className="text-neutral-600 dark:text-neutral-400">
                      عرض <span className="font-bold text-teal-600 dark:text-teal-400">{hospitals.length}</span> من أصل <span className="font-bold">{totalCount}</span> مستشفى
                    </p>
                  </motion.div>

                  {/* Recently Viewed */}
                  <RecentlyViewedPanel />

                  {/* Grid View */}
                  <AnimatePresence mode="wait">
                    {viewMode === 'grid' ? (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5"
                      >
                        {hospitals.map((hospital, index) => (
                          <HospitalCardPro
                            key={hospital.id}
                            hospital={hospital}
                            searchQuery={activeSearchQuery}
                            index={index}
                            isFavorite={isFavorite(hospital.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch"
                      >
                        {hospitals.map((hospital, index) => (
                          <HospitalCardList
                            key={hospital.id}
                            hospital={hospital}
                            searchQuery={activeSearchQuery}
                            index={index}
                            isFavorite={isFavorite(hospital.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Load More Button */}
                  {hospitals.length < totalCount && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-12 flex flex-col items-center gap-4"
                    >
                      <button
                        onClick={() => !loadingMore && setCurrentPage((p) => p + 1)}
                        disabled={loading || loadingMore}
                        className="px-12 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? 'جاري التحميل...' : 'عرض المزيد'}
                      </button>

                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        عرض {hospitals.length} من {totalCount} مستشفى
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Compare Bar */}
        <CompareBar />
      </div>
      <Footer />
    </>
  );
}
