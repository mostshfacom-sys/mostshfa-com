'use client';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckIcon,
  SparklesIcon,
  TagIcon,
  BeakerIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  buildDrugsLabUrl,
  DRUGS_LAB_QUERY_CHANGE_EVENT,
  sanitizeDrugSearchInput,
} from '@/lib/search/drugs-lab';

function FilterSection({
  title,
  icon,
  iconBg,
  iconColor,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white/60 dark:bg-neutral-800/60">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
          <div className="text-right">
            <div className="font-bold text-sm text-neutral-900 dark:text-white">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof count === 'number' && count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              {count}
            </span>
          )}
          <ChevronDownIcon
            className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-colors text-right ${
        checked
          ? 'bg-teal-50 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700'
          : 'bg-white/60 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800/60 dark:border-neutral-700 dark:hover:bg-neutral-800'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{label}</span>
      </div>
      <div
        className={`w-5 h-5 rounded border flex items-center justify-center ${
          checked
            ? 'bg-teal-600 border-teal-600'
            : 'bg-white border-neutral-300 dark:bg-neutral-900 dark:border-neutral-600'
        }`}
      >
        {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
      </div>
    </button>
  );
}

export function DrugsSmartFiltersEnhanced({
  categories,
  activeCategoryId: _activeCategoryId,
  categoryQuery: _categoryQuery,
  variant = 'sidebar',
  triggerVariant = 'button',
}: {
  categories: Array<{ id: number; name: string; count: number }>;
  activeCategoryId?: number;
  categoryQuery?: string;
  variant?: 'sidebar' | 'mobileSheet';
  triggerVariant?: 'button' | 'icon' | 'compact';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const userToggledRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const dragControls = useDragControls();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: false,
    sort: false,
    form: false,
    view: false,
  });
  const mobileTopOffset = 126;
  const mobileBottomOffset = 44;
  const [mobileSheetHeight, setMobileSheetHeight] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isApplyingMobile, setIsApplyingMobile] = useState(false);
  const [mobileDraft, setMobileDraft] = useState({
    category: '',
    sort: '',
    form: '',
    view: '',
  });
  const applyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (variant !== 'sidebar') return;
    if (userToggledRef.current) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsOpen(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [variant]);

  const activeFiltersCount = [
    searchParams?.get('category'),
    searchParams?.get('sort'),
    searchParams?.get('form'),
    searchParams?.get('view'),
  ].filter((v) => (v || '').trim()).length;

  const drugSearch = sanitizeDrugSearchInput((searchParams?.get('search') || '').trim());
  const filterSearch = sanitizeDrugSearchInput((searchParams?.get('filterSearch') || '').trim());

  const [drugSearchInput, setDrugSearchInput] = useState(drugSearch);
  const [categorySearchInput, setCategorySearchInput] = useState(filterSearch);
  const lastSyncedDrugSearch = useRef(drugSearch);
  const lastSyncedCategorySearch = useRef(filterSearch);
  const drugSearchInputRef = useRef<HTMLInputElement | null>(null);
  const categorySearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (drugSearch !== lastSyncedDrugSearch.current) {
      lastSyncedDrugSearch.current = drugSearch;
      if (document.activeElement !== drugSearchInputRef.current) {
        setDrugSearchInput(drugSearch);
      }
    }
  }, [drugSearch]);

  useEffect(() => {
    if (filterSearch !== lastSyncedCategorySearch.current) {
      lastSyncedCategorySearch.current = filterSearch;
      if (document.activeElement !== categorySearchInputRef.current) {
        setCategorySearchInput(filterSearch);
      }
    }
  }, [filterSearch]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const { queryString, nextUrl } = buildDrugsLabUrl(pathname, searchParams?.toString() || '', updates);
    startTransition(() => {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', nextUrl);
        window.dispatchEvent(new CustomEvent(DRUGS_LAB_QUERY_CHANGE_EVENT, { detail: { queryString } }));
      } else {
        router.replace(nextUrl);
      }
    });
  };

  const closeMobileSheet = () => {
    if (applyTimerRef.current !== null) {
      window.clearTimeout(applyTimerRef.current);
      applyTimerRef.current = null;
    }
    setIsApplyingMobile(false);
    userToggledRef.current = true;
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  const resolveMobileSheetHeight = () => {
    const vv = window.visualViewport;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const viewportTopInset = Math.max(0, vv?.offsetTop ?? 0);
    return Math.max(320, Math.floor(viewportHeight - viewportTopInset - mobileTopOffset - mobileBottomOffset));
  };

  const appliedFilters = {
    category: (searchParams?.get('category') || '').trim(),
    sort: (searchParams?.get('sort') || '').trim(),
    form: (searchParams?.get('form') || '').trim(),
    view: (searchParams?.get('view') || '').trim(),
  };

  const selectedFilters = variant === 'mobileSheet' ? mobileDraft : appliedFilters;

  const hasDraftChanges =
    mobileDraft.category !== appliedFilters.category ||
    mobileDraft.sort !== appliedFilters.sort ||
    mobileDraft.form !== appliedFilters.form ||
    mobileDraft.view !== appliedFilters.view;
  const pendingDraftChangesCount = [
    mobileDraft.category !== appliedFilters.category,
    mobileDraft.sort !== appliedFilters.sort,
    mobileDraft.form !== appliedFilters.form,
    mobileDraft.view !== appliedFilters.view,
  ].filter(Boolean).length;

  const applyMobileDraft = () => {
    updateQuery({
      category: mobileDraft.category || null,
      sort: mobileDraft.sort || null,
      form: mobileDraft.form || null,
      view: mobileDraft.view || null,
    });
  };

  const openMobileSheet = () => {
    userToggledRef.current = true;
    setMobileDraft(appliedFilters);
    setMobileSheetHeight(resolveMobileSheetHeight());
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (applyTimerRef.current !== null) {
        window.clearTimeout(applyTimerRef.current);
      }
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (variant !== 'mobileSheet' || !isOpen) return;

    const vv = window.visualViewport;
    const updateHeight = () => {
      setMobileSheetHeight(resolveMobileSheetHeight());
    };

    updateHeight();
    vv?.addEventListener('resize', updateHeight);
    vv?.addEventListener('scroll', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      vv?.removeEventListener('resize', updateHeight);
      vv?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, [isOpen, variant]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredCategories = useMemo(() => {
    const q = sanitizeDrugSearchInput(categorySearchInput);
    if (!q) return categories;
    return categories.filter((c) => sanitizeDrugSearchInput(c.name).includes(q));
  }, [categories, categorySearchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = sanitizeDrugSearchInput(drugSearchInput || '');
      const current = sanitizeDrugSearchInput((searchParams?.get('search') || '').trim());
      if (next !== current) {
        updateQuery({ search: next || null });
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = sanitizeDrugSearchInput(categorySearchInput || '');
      const current = sanitizeDrugSearchInput((searchParams?.get('filterSearch') || '').trim());
      if (next !== current) {
        updateQuery({ filterSearch: next || null });
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySearchInput]);

  const activeTags = useMemo(() => {
    const tags: Array<{ label: string; key: string; value: string }> = [];
    const search = (searchParams?.get('search') || '').trim();
    const sort = (searchParams?.get('sort') || '').trim();
    const form = (searchParams?.get('form') || '').trim();
    const view = (searchParams?.get('view') || '').trim();

    if (search) tags.push({ label: `بحث: ${search}`, key: 'search', value: search });

    if ((searchParams?.get('category') || '').trim()) {
      const catId = searchParams?.get('category') || '';
      const cat = categories.find((c) => String(c.id) === String(catId));
      if (cat) tags.push({ label: cat.name, key: 'category', value: String(cat.id) });
    }
    if (sort === 'updatedDesc') tags.push({ label: 'الأحدث', key: 'sort', value: sort });
    if (sort === 'nameDesc') tags.push({ label: 'الاسم (ي-أ)', key: 'sort', value: sort });
    if (sort === 'nameAsc') tags.push({ label: 'الاسم (أ-ي)', key: 'sort', value: sort });
    if (form) tags.push({ label: `الشكل: ${form}`, key: 'form', value: form });
    if (view === 'list') tags.push({ label: 'عرض قائمة', key: 'view', value: view });

    return tags;
  }, [categories, searchParams]);

  const triggerSummary = activeFiltersCount > 0 ? `${activeFiltersCount} فلاتر` : 'بدون فلاتر';

  const FiltersPanel = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-850 dark:to-neutral-800 rounded-2xl shadow-xl overflow-hidden ${
        variant === 'sidebar' ? 'border-2 border-neutral-200 dark:border-neutral-700' : 'border-none shadow-none bg-transparent dark:bg-transparent'
      }`}
    >
      {variant === 'sidebar' && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <FunnelIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">البحث عن الادوية</h2>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-white/80">{activeFiltersCount} فلتر نشط</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                userToggledRef.current = true;
                setIsOpen(!isOpen);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-white" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      )}

      {(activeTags.length > 0 && (isOpen || variant === 'mobileSheet')) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-900/20 dark:to-cyan-900/20 px-4 py-3 border-b border-teal-200/30 dark:border-teal-700/30"
          >
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag, i) => (
                <motion.div
                  key={`${tag.key}-${tag.value}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-full text-xs text-teal-700 dark:text-teal-300 font-medium border border-teal-200 dark:border-teal-700 shadow-sm"
                >
                  <span>{tag.label}</span>
                  <button
                    onClick={() => updateQuery({ [tag.key]: null })}
                    className="hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-full p-0.5 transition-colors"
                    type="button"
                    aria-label="حذف الفلتر"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {(isOpen || variant === 'mobileSheet') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-neutral-800 p-4 border-b border-neutral-200 dark:border-neutral-700"
          >
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                <input
                  ref={drugSearchInputRef}
                  type="text"
                  value={drugSearchInput}
                  onChange={(e) => setDrugSearchInput(e.target.value)}
                  placeholder="ابحث عن دواء..."
                  className="w-full pr-10 pl-4 py-3 text-sm border-2 border-teal-200 dark:border-teal-800 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                />
                {drugSearchInput && (
                  <button
                    onClick={() => {
                      setDrugSearchInput('');
                      updateQuery({ search: null });
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                    aria-label="مسح البحث"
                    type="button"
                  >
                    <XMarkIcon className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
                  <SparklesIcon className="w-4 h-4" />
                  <span>البحث في {activeFiltersCount} فلتر نشط</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {(isOpen || variant === 'mobileSheet') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={`relative p-4 space-y-4 overflow-y-auto ${variant === 'sidebar' ? 'max-h-[calc(100vh-280px)]' : ''}`}>
                {isPending && (
                  <div className="absolute inset-0 z-10 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300">
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                      <span>جاري تحديث النتائج...</span>
                    </div>
                  </div>
                )}
                <FilterSection
                  title="التصنيفات"
                  icon={<TagIcon className="w-4 h-4" />}
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                  isExpanded={expandedSections.category}
                  onToggle={() => toggleSection('category')}
                  count={selectedFilters.category ? 1 : 0}
                >
                  <div className="relative mb-2">
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      ref={categorySearchInputRef}
                      type="text"
                      value={categorySearchInput}
                      onChange={(e) => setCategorySearchInput(e.target.value)}
                      placeholder="ابحث عن تصنيف..."
                      className="w-full pr-9 pl-3 py-2 text-sm border border-blue-200 dark:border-blue-800 rounded-lg bg-white/70 dark:bg-neutral-900/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {categorySearchInput && (
                      <button
                        onClick={() => {
                          setCategorySearchInput('');
                          updateQuery({ filterSearch: null });
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                        aria-label="مسح البحث"
                        type="button"
                      >
                        <XMarkIcon className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, category: '' }))
                          : updateQuery({ category: null })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${
                        !selectedFilters.category
                          ? 'bg-teal-50 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700'
                          : 'bg-white/60 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800/60 dark:border-neutral-700 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">كل الأدوية</span>
                      <span className="text-[10px] font-bold text-neutral-500">{categories.reduce((a, c) => a + c.count, 0).toLocaleString('ar-EG')}</span>
                    </button>
                    {filteredCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          variant === 'mobileSheet'
                            ? setMobileDraft((prev) => ({ ...prev, category: String(c.id) }))
                            : updateQuery({ category: String(c.id) })
                        }
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${
                          selectedFilters.category === String(c.id)
                            ? 'bg-teal-50 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700'
                            : 'bg-white/60 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800/60 dark:border-neutral-700 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{c.name}</span>
                        <span className="text-[10px] font-bold text-neutral-500">{c.count.toLocaleString('ar-EG')}</span>
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="ترتيب النتائج"
                  icon={<SparklesIcon className="w-4 h-4" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/30"
                  iconColor="text-amber-600 dark:text-amber-400"
                  isExpanded={expandedSections.sort}
                  onToggle={() => toggleSection('sort')}
                  count={selectedFilters.sort ? 1 : 0}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="الاسم (أ - ي)"
                      checked={(selectedFilters.sort || 'nameAsc') === 'nameAsc'}
                      onChange={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, sort: 'nameAsc' }))
                          : updateQuery({ sort: 'nameAsc' })
                      }
                      icon={<TagIcon className="w-4 h-4 text-amber-600" />}
                    />
                    <FilterCheckbox
                      label="الاسم (ي - أ)"
                      checked={(selectedFilters.sort || '') === 'nameDesc'}
                      onChange={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, sort: 'nameDesc' }))
                          : updateQuery({ sort: 'nameDesc' })
                      }
                      icon={<TagIcon className="w-4 h-4 text-amber-600" />}
                    />
                    <FilterCheckbox
                      label="الأحدث تحديثًا"
                      checked={(selectedFilters.sort || '') === 'updatedDesc'}
                      onChange={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, sort: 'updatedDesc' }))
                          : updateQuery({ sort: 'updatedDesc' })
                      }
                      icon={<SparklesIcon className="w-4 h-4 text-amber-600" />}
                    />
                  </div>
                </FilterSection>

                <FilterSection
                  title="شكل الدواء"
                  icon={<BeakerIcon className="w-4 h-4" />}
                  iconBg="bg-purple-100 dark:bg-purple-900/30"
                  iconColor="text-purple-600 dark:text-purple-400"
                  isExpanded={expandedSections.form}
                  onToggle={() => toggleSection('form')}
                  count={selectedFilters.form ? 1 : 0}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {['', 'أقراص', 'كبسولات', 'شراب', 'حقن', 'مرهم', 'كريم'].map((f) => (
                      <button
                        key={f || 'all'}
                        type="button"
                        onClick={() =>
                          variant === 'mobileSheet'
                            ? setMobileDraft((prev) => ({ ...prev, form: f }))
                            : updateQuery({ form: f || null })
                        }
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${
                          (selectedFilters.form || '') === f
                            ? 'bg-teal-50 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700'
                            : 'bg-white/60 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800/60 dark:border-neutral-700 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{f || 'الكل'}</span>
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="طريقة العرض"
                  icon={<SparklesIcon className="w-4 h-4" />}
                  iconBg="bg-sky-100 dark:bg-sky-900/30"
                  iconColor="text-sky-600 dark:text-sky-400"
                  isExpanded={expandedSections.view}
                  onToggle={() => toggleSection('view')}
                  count={selectedFilters.view ? 1 : 0}
                >
                  <div className="space-y-2">
                    <FilterCheckbox
                      label="بطاقات"
                      checked={(selectedFilters.view || '') !== 'list'}
                      onChange={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, view: '' }))
                          : updateQuery({ view: null })
                      }
                      icon={<TagIcon className="w-4 h-4 text-sky-600" />}
                    />
                    <FilterCheckbox
                      label="قائمة"
                      checked={(selectedFilters.view || '') === 'list'}
                      onChange={() =>
                        variant === 'mobileSheet'
                          ? setMobileDraft((prev) => ({ ...prev, view: 'list' }))
                          : updateQuery({ view: 'list' })
                      }
                      icon={<TagIcon className="w-4 h-4 text-sky-600" />}
                    />
                  </div>
                </FilterSection>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  );

  if (variant === 'mobileSheet') {
    return (
      <>
        {triggerVariant === 'icon' ? (
          <button
            type="button"
            onClick={openMobileSheet}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            aria-label="فتح الفلاتر"
          >
            <FunnelIcon className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -left-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-black text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        ) : triggerVariant === 'compact' ? (
          <button
            type="button"
            onClick={openMobileSheet}
            className="flex min-w-[92px] max-w-[132px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <FunnelIcon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 text-right">
              <span className="block text-[11px] font-black text-slate-900 dark:text-white">الفلاتر</span>
              <span className="block truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {triggerSummary}
              </span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openMobileSheet}
            className="w-full flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white">
                <FunnelIcon className="w-5 h-5" />
              </span>
              <div className="min-w-0 text-right">
                <div className="text-sm font-black text-slate-900 dark:text-white">فلترة النتائج</div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                  {activeFiltersCount > 0 ? `${activeFiltersCount} فلاتر نشطة` : 'بدون فلاتر إضافية'}
                </div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-primary-600 dark:text-primary-300">فتح</span>
          </button>
        )}

        {isMounted && isOpen && createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="فلاتر دليل الأدوية">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeMobileSheet}
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150) {
                  closeMobileSheet();
                }
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                height: mobileSheetHeight
                  ? `${mobileSheetHeight}px`
                  : `calc(100dvh - ${mobileTopOffset}px - env(safe-area-inset-bottom) - ${mobileBottomOffset}px)`,
                maxHeight: mobileSheetHeight
                  ? `${mobileSheetHeight}px`
                  : `calc(100dvh - ${mobileTopOffset}px - env(safe-area-inset-bottom) - ${mobileBottomOffset}px)`,
                bottom: `calc(max(env(safe-area-inset-bottom), 0px) + ${mobileBottomOffset / 2}px)`,
              }}
              className="absolute inset-x-3 bottom-0 z-10 flex w-auto flex-col rounded-[2.25rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden pointer-events-auto dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
            >
              <div
                className="flex w-full justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  dragControls.start(e);
                }}
              >
                <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white">الفلاتر المتقدمة</h3>
                  <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">تحكم في نتائج البحث بدقة</p>
                </div>
                <button
                  type="button"
                  onClick={closeMobileSheet}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 space-y-4 touch-pan-y">
                {FiltersPanel}
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                {hasDraftChanges && (
                  <div className="mb-3 flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                    <SparklesIcon className="h-4 w-4" />
                    <span>لديك {pendingDraftChangesCount.toLocaleString('ar-EG')} تغييرات غير مطبقة</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (variant === 'mobileSheet') {
                        setMobileDraft({
                          category: '',
                          sort: '',
                          form: '',
                          view: '',
                        });
                      } else {
                        const updates: Record<string, string | null> = {
                          category: null,
                          sort: null,
                          hasImage: null,
                          hasPrice: null,
                          hasIngredient: null,
                          form: null,
                          view: null,
                          filterSearch: null
                        };
                        updateQuery(updates);
                      }
                    }}
                    disabled={variant === 'mobileSheet'
                      ? !mobileDraft.category && !mobileDraft.sort && !mobileDraft.form && !mobileDraft.view
                      : activeFiltersCount === 0}
                    className="flex-1 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3.5 text-sm font-black text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    مسح الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (variant === 'mobileSheet' && hasDraftChanges) {
                        setIsApplyingMobile(true);
                        applyMobileDraft();
                        applyTimerRef.current = window.setTimeout(() => {
                          closeMobileSheet();
                        }, 650);
                        return;
                      }
                      closeMobileSheet();
                    }}
                    disabled={isApplyingMobile}
                    className="flex-[2] rounded-2xl bg-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-500/20 hover:bg-teal-700 active:scale-[0.98] transition-all"
                  >
                    {isApplyingMobile ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                          <span className="absolute inset-0 rounded-full border-2 border-white/30" />
                          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                          <PlusCircleIcon className="h-5 w-5" />
                        </span>
                        <span>جاري تجهيز النتائج...</span>
                      </span>
                    ) : variant === 'mobileSheet' && hasDraftChanges ? (
                      'تطبيق وإغلاق'
                    ) : (
                      `عرض النتائج (${activeFiltersCount > 0 ? activeFiltersCount : 'الكل'})`
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return <div className="sticky top-24 z-20">{FiltersPanel}</div>;
}
