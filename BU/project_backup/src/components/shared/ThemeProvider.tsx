'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeMode } from '@/lib/navigation/navbarConfig';

const THEME_STORAGE_KEY = 'mostshfa-theme';

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        setThemeMode(storedTheme);
      }
    } catch (error) {
      console.warn('Theme storage unavailable:', error);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    const applyTheme = (mode: ThemeMode) => {
      const shouldUseDark = mode === 'dark' || (mode === 'system' && media?.matches);
      root.classList.toggle('dark', shouldUseDark);
      root.style.colorScheme = shouldUseDark ? 'dark' : 'light';
    };

    applyTheme(themeMode);
    if (hasLoaded) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      } catch (error) {
        console.warn('Theme storage unavailable:', error);
      }
    }

    if (themeMode !== 'system' || !media) {
      return undefined;
    }

    const handleChange = () => applyTheme('system');

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, [themeMode, hasLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system') {
        setThemeMode(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (error) {
          console.warn('Theme storage unavailable:', error);
        }
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      cycleTheme,
    }),
    [themeMode, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
