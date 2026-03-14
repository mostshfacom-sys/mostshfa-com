
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/shared';
import { ClinicCardPro } from '@/components/clinics/ClinicCardPro';
import { ClinicCardList } from '@/components/clinics/ClinicCardList';
import { ClinicSmartHeader } from '@/components/clinics/ClinicSmartHeader';
import { ClinicSmartFilters } from '@/components/clinics/ClinicSmartFilters';
import ClinicSearchStatusBar from '@/components/clinics/ClinicSearchStatusBar';
import { SkeletonCard, SkeletonCardList } from '@/components/shared/SkeletonCard';
import { fetchClinics, fetchClinicFilterOptions } from '@/lib/api/clinics';
import type { Clinic, ClinicFilters, FilterOption } from '@/types/clinic';
import { useDebounce } from '@/hooks/useDebounce';
import { useClinicFavorites } from '@/hooks/useClinicFavorites';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Stats Interface
interface ClinicStats {
  total: number;
  openNow: number;
  featured: number;
}

export default function ClinicsPage() {
  // State
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ClinicStats>({ total: 0, openNow: 0, featured: 0 });
  const [filters, setFilters] = useState<ClinicFilters>({
    page: 1,
    limit: 12,
    ordering: '-ratingAvg'
  });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter Options State
  const [governorates, setGovernorates] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [specialties, setSpecialties] = useState<FilterOption[]>([]);
  const [filterSearch, setFilterSearch] = useState('');

  const { favorites, toggleFavorite, isFavorite } = useClinicFavorites();
  const debouncedSearch = useDebounce(search, 500);

  // Load Filter Options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchClinicFilterOptions();
        setGovernorates(options.governorates);
        setCities(options.cities);
        setSpecialties(options.specialties);
      } catch (e) {
        console.error('Error loading filter options:', e);
      }
    };
    loadOptions();
  }, []);

  // Load Stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [allRes, openRes, featRes] = await Promise.all([
          fetchClinics({ limit: 1 }),
          fetchClinics({ limit: 1, isOpen: true }),
          fetchClinics({ limit: 1, isFeatured: true })
        ]);
        setStats({
          total: allRes.count,
          openNow: openRes.count,
          featured: featRes.count
        });
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    };
    loadStats();
  }, []);

  // Load Clinics
  useEffect(() => {
    const load = async () => {
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetchClinics({
          ...filters,
          search: debouncedSearch,
          page: currentPage
        });
        
        const results = res.results || [];
        const count = res.count || 0;

        if (currentPage === 1) {
          setClinics(results);
        } else {
          setClinics(prev => [...prev, ...results]);
        }
        setTotalCount(count);
      } catch (e) {
        console.error(e);
        if (currentPage === 1) setClinics([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    load();
  }, [filters, debouncedSearch, currentPage]);

  const handleFiltersChange = (newFilters: ClinicFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      <Header />
      
      <ClinicSmartHeader
        headerTotalCount={stats.total}
        headerOpenCount={stats.openNow}
        headerFeaturedCount={stats.featured}
        resultsCount={totalCount}
        openCount={0}
        searchValue={search}
        onSearchChange={handleSearchChange}
        sortValue={filters.ordering || '-ratingAvg'}
        onSortChange={(val) => handleFiltersChange({ ordering: val })}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        clinics={clinics}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 relative z-10 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <ClinicSmartFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              governorates={governorates}
              cities={cities}
              specialties={specialties}
              filterSearch={filterSearch}
              onFilterSearchChange={setFilterSearch}
              onClearFilterSearch={() => setFilterSearch('')}
            />
          </aside>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <ClinicSearchStatusBar
              searchValue={search}
              filters={filters}
              governorates={governorates}
              cities={cities}
              specialties={specialties}
              resultsCount={totalCount}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onClearSearch={() => handleSearchChange('')}
              onClearFilters={() => handleFiltersChange({ page: 1, limit: 12, ordering: '-ratingAvg' })}
              onShowAll={() => handleFiltersChange({ page: 1, limit: 100, ordering: '-ratingAvg' })}
              onFiltersChange={handleFiltersChange}
            />

            {/* Loading / Grid */}
            {loading && currentPage === 1 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {[...Array(6)].map((_, i) => (
                  viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonCardList key={i} />
                ))}
              </div>
            ) : clinics.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {clinics.map((clinic, index) => (
                  viewMode === 'grid' ? (
                    <ClinicCardPro
                      key={clinic.id}
                      clinic={clinic}
                      index={index}
                      isFavorite={isFavorite(clinic.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ) : (
                    <ClinicCardList
                      key={clinic.id}
                      clinic={clinic}
                      index={index}
                      isFavorite={isFavorite(clinic.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  )
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-800 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-700 text-center px-4"
              >
                <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mb-6">
                  <MagnifyingGlassIcon className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  لا توجد نتائج مطابقة
                </h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  حاول تغيير مصطلحات البحث أو إزالة بعض الفلاتر للعثور على ما تبحث عنه.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setFilters({ page: 1, limit: 12, ordering: '-ratingAvg' });
                  }}
                  className="mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors"
                >
                  إزالة جميع الفلاتر
                </button>
              </motion.div>
            )}

            {/* Load More */}
            {!loading && clinics.length < totalCount && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'جاري التحميل...' : 'عرض المزيد'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
