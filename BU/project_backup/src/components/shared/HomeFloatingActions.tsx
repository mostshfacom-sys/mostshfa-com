
'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUpIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import type { ThemeMode } from '@/lib/navigation/navbarConfig';
import { useTheme } from '@/components/shared/ThemeProvider';

const themeIcons: Record<ThemeMode, React.ComponentType<{ className?: string }>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};

export default function HomeFloatingActions() {
  const pathname = usePathname();
  const { themeMode, cycleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scrollTop =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    setShowScrollTop(scrollTop > 240);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    handleScroll();
  }, [pathname, handleScroll]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const ThemeIcon = themeIcons[themeMode];

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed z-50 bottom-24 md:bottom-8 right-4 flex flex-col gap-3">
      <button
        type="button"
        onClick={cycleTheme}
        aria-label="تبديل الثيم"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-lg shadow-emerald-500/10 backdrop-blur transition hover:text-emerald-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-300"
      >
        <ThemeIcon className="h-5 w-5" />
      </button>
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="العودة للأعلى"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
