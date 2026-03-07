'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdSenseContextType {
  isEnabled: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const AdSenseContext = createContext<AdSenseContextType>({
  isEnabled: false,
  isLoading: true,
  refresh: async () => {},
});

export function AdSenseProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(Boolean(data.enabled));
      }
    } catch (error) {
      console.error('Error checking AdSense status:', error);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await refresh();
      } finally {
        setIsLoading(false);
      }
    }

    init();

    const onStorage = () => {
      refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdSenseContext.Provider value={{ isEnabled, isLoading, refresh }}>
      {children}
    </AdSenseContext.Provider>
  );
}

export function useAdSense() {
  const context = useContext(AdSenseContext);
  if (context === undefined) {
    // Return default values instead of throwing for SSR safety
    return { isEnabled: false, isLoading: true, refresh: async () => {} };
  }
  return context;
}
