'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/shared';
import { PharmacyCardPro } from '@/components/pharmacies/PharmacyCardPro';
import { PharmacySmartHeader } from '@/components/pharmacies/PharmacySmartHeader';
import { PharmacySmartFilters } from '@/components/pharmacies/PharmacySmartFilters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { fetchPharmacies } from '@/lib/api/pharmacies';
import type { PharmacyFilters } from '@/types/pharmacy';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// Stats Interface
interface PharmacyStats {
  total: number;
  openNow: number;
  open24h: number;
}

export default function PharmaciesPage() {
  // State
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<PharmacyStats>({ total: 0, openNow: 0, open24h: 0 });
  const [filters, setFilters] = useState<PharmacyFilters>({
    page: 1,
    limit: 12
  });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter Options State
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [filterSearch, setFilterSearch] = useState('');

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const debouncedSearch = useDebounce(search, 500);

  // Load Filter Options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [govsRes, citiesRes] = await Promise.all([
          axios.get('/api/governorates'),
          axios.get('/api/hospitals-pro/cities')
        ]);
        
        // Handle { success: true, data: [...] } or direct array
        const govs = govsRes.data?.data || govsRes.data || [];
        const cts = citiesRes.data?.data || citiesRes.data || [];
        
        setGovernorates(govs);
        setCities(cts);
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
        const [allRes, openRes, h24Res] = await Promise.all([
          fetchPharmacies({ limit: 1 }),
          fetchPharmacies({ limit: 1, isOpen: true }),
          fetchPharmacies({ limit: 1, is24h: true })
        ]);
        setStats({
          total: allRes.count,
          openNow: openRes.count,
          open24h: h24Res.count
        });
      } catch (e) {}
    };
    loadStats();
  }, []);

  // Load Pharmacies
  useEffect(() => {
    const load = async () => {
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetchPharmacies({
          ...filters,
          search: debouncedSearch,
          page: currentPage
        });
        
        const results = res?.results || [];
        const count = res?.count || 0;

        if (currentPage === 1) {
          setPharmacies(results);
        } else {
          setPharmacies(prev => [...(prev || []), ...results]);
        }
        setTotalCount(count);
      } catch (e) {
        console.error(e);
        if (currentPage === 1) setPharmacies([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    load();
  }, [filters, debouncedSearch, currentPage]);

  const handleFiltersChange = (newFilters: PharmacyFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const toggleFavoriteItem = (id: number) => toggleFavorite(id);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      <Header />
      
      <PharmacySmartHeader
        headerTotalCount={stats.total}
        headerOpenCount={stats.openNow}
        header24hCount={stats.open24h}
        resultsCount={totalCount}
        openCount={0}
        searchValue={search}
        onSearchChange={handleSearchChange}
        sortValue={filters.ordering || '-rating_avg'}
        onSortChange={(val) => handleFiltersChange({ ordering: val })}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pharmacies={pharmacies || []}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 relative z-10 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <PharmacySmartFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              governorates={governorates}
              cities={cities}
              filterSearch={filterSearch}
              onFilterSearchChange={setFilterSearch}
              onClearFilterSearch={() => setFilterSearch('')}
            />
          </aside>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Loading / Grid */}
            {loading && currentPage === 1 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (pharmacies || []).length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {(pharmacies || []).map((pharmacy, index) => (
                  <PharmacyCardPro
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    index={index}
                    isFavorite={isFavorite(pharmacy.id)}
                    onToggleFavorite={toggleFavoriteItem}
                  />
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
                <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                  حاول تغيير مصطلحات البحث أو إزالة بعض الفلاتر للعثور على ما تبحث عنه.
                </p>
                <button
                  onClick={() => handleFiltersChange({ 
                    governorate: undefined, 
                    city: undefined, 
                    isOpen: undefined, 
                    is24h: undefined, 
                    hasDelivery: undefined, 
                    hasNursing: undefined 
                  })}
                  className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                >
                  مسح الفلاتر
                </button>
              </motion.div>
            )}

            {/* Load More */}
            {(pharmacies || []).length < totalCount && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white dark:bg-neutral-800 text-teal-600 dark:text-teal-400 border-2 border-teal-100 dark:border-teal-900 rounded-xl font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
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
