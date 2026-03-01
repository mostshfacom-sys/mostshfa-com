'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  HomeIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  BeakerIcon,
  SparklesIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ScaleIcon,
  BoltIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserCircleIcon,
  Squares2X2Icon,
  BookOpenIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';
import UniversalSearch from '@/components/ui/UniversalSearch';
import { ServerSwitcher } from './ServerSwitcher';
import {
  NavbarConfig,
  NavbarItem,
  ThemeMode,
  getDefaultNavbarConfig,
} from '@/lib/navigation/navbarConfig';
import { useTheme } from '@/components/shared/ThemeProvider';

const DROPDOWN_CLOSE_DELAY = 380;

const SECTION_ORDER: Array<keyof NavbarConfig['sections']> = [
  'directories',
  'tools',
  'articles',
];

const SECTION_LINKS: Record<keyof NavbarConfig['sections'], string> = {
  directories: '/directories',
  tools: '/tools',
  articles: '/articles',
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  directory: Squares2X2Icon,
  tools: WrenchScrewdriverIcon,
  article: BookOpenIcon,
  hospital: BuildingOffice2Icon,
  hospitals: BuildingOffice2Icon,
  clinic: BuildingOffice2Icon,
  clinics: BuildingOffice2Icon,
  pharmacy: BuildingStorefrontIcon,
  pharmacies: BuildingStorefrontIcon,
  lab: BeakerIcon,
  labs: BeakerIcon,
  nursing: UserGroupIcon,
  emergency: HeartIcon,
  pill: BeakerIcon,
  chart: ChartBarIcon,
  clipboard: ClipboardDocumentListIcon,
  scale: ScaleIcon,
  bolt: BoltIcon,
  water: BeakerIcon,
  heart: HeartIcon,
  sparkles: SparklesIcon,
  nutrition: SparklesIcon,
  mind: HeartIcon,
  woman: UserGroupIcon,
  shield: ShieldCheckIcon,
  kids: UserGroupIcon,
  fitness: BoltIcon,
  phone: PhoneIcon,
};

const sectionStyles = {
  directories: {
    badge: 'bg-emerald-100 text-emerald-700',
    glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accent: 'text-emerald-600',
  },
  tools: {
    badge: 'bg-sky-100 text-sky-700',
    glow: 'from-sky-500/20 via-indigo-500/10 to-transparent',
    accent: 'text-sky-600',
  },
  articles: {
    badge: 'bg-amber-100 text-amber-700',
    glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
    accent: 'text-amber-600',
  },
};

const themeIcons: Record<ThemeMode, React.ComponentType<{ className?: string }>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};

const resolveIcon = (name?: string) => iconMap[name ?? ''] ?? Squares2X2Icon;

export function Header() {
  const router = useRouter();
  const { themeMode, cycleTheme } = useTheme();
  const [config, setConfig] = useState<NavbarConfig>(getDefaultNavbarConfig());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [articleItems, setArticleItems] = useState<NavbarItem[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState('');
  const [openDesktopSection, setOpenDesktopSection] = useState<string | null>(null);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/navbar-config');
        if (!res.ok) {
          throw new Error('Failed to load navbar config');
        }
        const data = await res.json();
        if (active && data?.config) {
          setConfig(data.config as NavbarConfig);
        }
      } catch (error) {
        console.error('Error loading navbar config:', error);
        if (active) {
          setConfig(getDefaultNavbarConfig());
        }
      }
    };

    loadConfig();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!config.sections.articles.useAutoCategories) {
      setArticleItems([]);
      return;
    }

    let active = true;

    const loadCategories = async () => {
      try {
        const res = await fetch('/api/articles/categories');
        if (!res.ok) {
          throw new Error('Failed to load categories');
        }
        const data = await res.json();
        const categories = Array.isArray(data?.categories) ? data.categories : [];
        const sorted = categories
          .slice()
          .sort((a: any, b: any) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
          .slice(0, config.sections.articles.autoCount ?? 6)
          .map((category: any) => ({
            id: String(category.slug ?? category.id),
            label: category.nameAr ?? category.nameEn ?? 'تصنيف',
            href: `/articles?category=${encodeURIComponent(category.slug ?? category.id)}`,
            description: category.articleCount
              ? `عدد المقالات: ${category.articleCount}`
              : undefined,
            icon: category.icon ?? 'article',
          }));

        if (active) {
          setArticleItems(sorted);
        }
      } catch (error) {
        console.error('Error loading article categories:', error);
        if (active) {
          setArticleItems([]);
        }
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, [config.sections.articles.useAutoCategories, config.sections.articles.autoCount]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const ThemeIcon = themeIcons[themeMode];

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const sectionItems = useMemo(() => {
    const allCategoriesItems = config.sections.articles.items.filter(
      (item) => item.id === 'all-categories'
    );
    const resolvedArticles =
      config.sections.articles.useAutoCategories && articleItems.length > 0
        ? [...articleItems, ...allCategoriesItems]
        : config.sections.articles.items;

    return {
      directories: config.sections.directories.items,
      tools: config.sections.tools.items,
      articles: resolvedArticles,
    };
  }, [config.sections, articleItems]);

  const renderBadge = (_badge?: string) => null;

  const toggleMobileSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDesktopEnter = (key: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpenDesktopSection(key);
  };

  const handleDesktopLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDesktopSection(null);
    }, DROPDOWN_CLOSE_DELAY);
  };

  const handleAuthEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsAuthMenuOpen(true);
  };

  const handleAuthLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsAuthMenuOpen(false);
    }, DROPDOWN_CLOSE_DELAY);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-gradient-to-l from-white/95 via-white/90 to-emerald-50/70 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-black/90 dark:bg-none dark:from-black/90 dark:via-black/90 dark:to-black/90 dark:shadow-[0_16px_36px_-26px_rgba(0,0,0,0.8)]">
      <div className="container-custom">
        <div className="flex items-center justify-between gap-4 h-[72px]">
          <div className="flex items-center gap-6">
            <Link href={config.brand.href} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30">
                <BuildingOffice2Icon className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {config.brand.label}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-visible">
              {config.primaryLinks.map((link) => {
                const Icon = resolveIcon(link.icon);
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    {...(link.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="flex shrink-0 items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:text-primary-700 hover:bg-white/70 transition-colors dark:text-gray-200 dark:hover:text-white dark:hover:bg-white/10"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {renderBadge(link.badge)}
                  </Link>
                );
              })}

              {SECTION_ORDER.map((sectionKey) => {
                const section = config.sections[sectionKey];
                if (!section.isEnabled) return null;
                const styles = sectionStyles[sectionKey];
                const items = sectionItems[sectionKey];
                const featuredItems = items.filter((item) => item.isFeatured);
                const regularItems = items.filter((item) => !item.isFeatured);
                const SectionIcon = resolveIcon(section.icon);
                const isOpen = openDesktopSection === sectionKey;

                return (
                  <div
                    key={section.id}
                    className="relative"
                    onMouseEnter={() => handleDesktopEnter(sectionKey)}
                    onMouseLeave={handleDesktopLeave}
                  >
                    <Link
                      href={SECTION_LINKS[sectionKey]}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      className="flex shrink-0 items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white/70 transition-colors dark:text-gray-200 dark:hover:text-white dark:hover:bg-white/10"
                    >
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', styles.badge)}>
                        <SectionIcon className="h-4 w-4" />
                      </span>
                      <span>{section.label}</span>
                      <ChevronDownIcon
                        className={cn(
                          'h-4 w-4 text-gray-400 transition-transform',
                          isOpen && 'rotate-180 text-gray-600 dark:text-gray-300'
                        )}
                      />
                    </Link>

                    <div
                      onMouseEnter={() => handleDesktopEnter(sectionKey)}
                      onMouseLeave={handleDesktopLeave}
                      className={cn(
                        'absolute top-full right-0 mt-4 w-[22rem] sm:w-[28rem] transition duration-200 z-50',
                        isOpen
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 translate-y-2 pointer-events-none'
                      )}
                    >
                      <div className="relative rounded-2xl border border-white/80 bg-white/95 shadow-xl backdrop-blur-xl overflow-hidden dark:bg-slate-900/95 dark:border-white/10">
                        <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-70', styles.glow)} />
                        <div className="relative p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm', styles.accent)}>
                              <SectionIcon className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.label}</p>
                              {section.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                  {section.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {featuredItems.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {featuredItems.map((item) => {
                                const ItemIcon = resolveIcon(item.icon ?? section.icon);
                                return (
                                  <Link
                                    key={item.id}
                                    href={item.href}
                                    {...(item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                                    className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-white text-gray-900 shadow-sm hover:shadow-md transition-all dark:bg-slate-800 dark:text-white"
                                  >
                                    <ItemIcon className="h-4 w-4" />
                                    <span className="break-words whitespace-normal">{item.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {regularItems.map((item) => {
                              const ItemIcon = resolveIcon(item.icon ?? section.icon);
                              return (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  {...(item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                                  className={cn(
                                    'group flex items-start gap-3 rounded-xl px-3 py-3 transition-all overflow-hidden',
                                    'hover:bg-white',
                                    'bg-white/70 dark:bg-slate-900/70 dark:hover:bg-slate-800/80'
                                  )}
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-primary-700 shadow-sm group-hover:shadow-md dark:bg-slate-800 dark:text-primary-300">
                                    <ItemIcon className="h-5 w-5" />
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white break-words whitespace-normal">
                                        {item.label}
                                      </p>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed break-words whitespace-normal">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {config.actions.showSearch && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-primary-700 transition-colors dark:text-gray-200 dark:hover:text-white"
                aria-label="بحث سريع"
                title="بحث سريع"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            )}

            {config.actions.showContact && (
              <Link
                href={config.contactLink.href}
                {...(config.contactLink.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="flex h-10 w-10 items-center justify-center text-primary-700 hover:text-primary-800 transition-colors dark:text-primary-200 dark:hover:text-white"
                aria-label={config.contactLink.label}
                title={config.contactLink.label}
              >
                <PhoneIcon className="h-6 w-6" />
              </Link>
            )}

            {config.actions.showAuth && (
              <div
                className="relative"
                onMouseEnter={handleAuthEnter}
                onMouseLeave={handleAuthLeave}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isAuthMenuOpen}
                  className="flex h-10 items-center gap-1.5 px-3 py-2 rounded-full text-gray-600 hover:text-primary-700 hover:bg-white/70 transition-colors dark:text-gray-200 dark:hover:text-white dark:hover:bg-white/10"
                  aria-label="الحساب"
                  title="الحساب"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      isAuthMenuOpen && 'rotate-180 text-gray-600 dark:text-gray-300'
                    )}
                  />
                </button>
                <div
                  onMouseEnter={handleAuthEnter}
                  onMouseLeave={handleAuthLeave}
                  className={cn(
                    'absolute top-full right-0 mt-3 w-48 transition duration-200 z-50',
                    isAuthMenuOpen
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 translate-y-2 pointer-events-none'
                  )}
                >
                  <div className="rounded-2xl border border-white/80 bg-white/95 shadow-lg backdrop-blur-xl dark:bg-slate-900/95 dark:border-white/10">
                    <div className="p-2 space-y-1">
                      <Link
                        href="/login"
                        onClick={() => setIsAuthMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors dark:text-gray-200 dark:hover:bg-white/10"
                      >
                        تسجيل الدخول
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsAuthMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        إنشاء حساب
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ServerSwitcher />

            {config.actions.showThemeToggle && (
              <button
                type="button"
                onClick={cycleTheme}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-primary-700 transition-colors dark:text-gray-200 dark:hover:text-white"
                aria-label="تبديل الثيم"
              >
                <ThemeIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {config.actions.showSearch && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-primary-700 transition-colors dark:text-gray-200"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
            )}

            {config.actions.showThemeToggle && (
              <button
                type="button"
                onClick={cycleTheme}
                className="flex h-10 w-10 items-center justify-center text-gray-600 hover:text-primary-700 transition-colors dark:text-gray-200"
              >
                <ThemeIcon className="h-6 w-6" />
              </button>
            )}

            <div className="flex items-center">
               <ServerSwitcher />
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:text-primary-700 hover:bg-white transition-colors dark:bg-white/10 dark:text-gray-200"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 border-t border-white/70 dark:border-white/10',
          isMobileMenuOpen ? 'max-h-[80vh] pb-6 overflow-y-auto' : 'max-h-0'
        )}
      >
        <div className="container-custom pt-4 space-y-4">
          {config.primaryLinks.length > 0 && (
            <div className="space-y-2">
              {config.primaryLinks.map((link) => {
                const Icon = resolveIcon(link.icon);
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    {...(link.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/80 text-gray-700 font-semibold shadow-sm dark:bg-slate-900/70 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </div>
                    {renderBadge(link.badge)}
                  </Link>
                );
              })}
            </div>
          )}

          {SECTION_ORDER.map((sectionKey) => {
            const section = config.sections[sectionKey];
            if (!section.isEnabled) return null;
            const items = sectionItems[sectionKey];
            const featuredItems = items.filter((item) => item.isFeatured);
            const regularItems = items.filter((item) => !item.isFeatured);
            const isOpen = openSections[sectionKey];
            const SectionIcon = resolveIcon(section.icon);
            const styles = sectionStyles[sectionKey];

            return (
              <div key={section.id} className="rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/70 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => toggleMobileSection(sectionKey)}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-800 dark:text-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', styles.badge)}>
                      <SectionIcon className="h-4 w-4" />
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{section.label}</p>
                      {section.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-words whitespace-normal">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {featuredItems.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {featuredItems.map((item) => {
                          const ItemIcon = resolveIcon(item.icon ?? section.icon);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              {...(item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white"
                            >
                              <ItemIcon className="h-4 w-4" />
                              <span className="break-words whitespace-normal">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    {regularItems.map((item) => {
                      const ItemIcon = resolveIcon(item.icon ?? section.icon);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          {...(item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-start gap-3 rounded-xl px-3 py-3 transition overflow-hidden',
                            'hover:bg-white',
                            'bg-white/80 dark:bg-slate-900/80 dark:hover:bg-slate-800'
                          )}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-primary-700 shadow-sm dark:bg-slate-800 dark:text-primary-300">
                            <ItemIcon className="h-5 w-5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white break-words whitespace-normal">
                                {item.label}
                              </p>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed break-words whitespace-normal">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-white/70 pt-4 space-y-2 dark:border-white/10">
            {config.actions.showContact && (
              <Link
                href={config.contactLink.href}
                {...(config.contactLink.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/80 text-gray-700 font-semibold shadow-sm dark:bg-slate-900/70 dark:text-gray-100"
              >
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  {config.contactLink.label}
                </div>
              </Link>
            )}

            {config.actions.showAuth && (
              <div className="rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/70 dark:border-white/10">
                <div className="flex items-center justify-between px-4 py-3 text-gray-800 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">الحساب</span>
                  </div>
                </div>
                <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-center font-semibold text-gray-700 bg-white/80 shadow-sm dark:bg-slate-900/70 dark:text-gray-100"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-center font-semibold text-white bg-primary-600 shadow-sm"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative max-w-2xl mx-auto mt-24 bg-white rounded-2xl border border-white/80 shadow-2xl p-6 dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">نافذة البحث السريع</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ابحث عن خدمات طبية أو أدوات أو مقالات.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/10 dark:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <UniversalSearch
              value={searchValue}
              onChange={setSearchValue}
              onSearch={handleSearch}
              onSuggestionSelect={handleSearch}
              size="lg"
            />
            <p className="text-xs text-gray-400 mt-3">اضغط Enter لعرض النتائج.</p>
          </div>
        </div>
      )}
    </header>
  );
}
