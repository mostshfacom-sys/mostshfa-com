'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdSenseContextType {
  isEnabled: boolean;
  isLoading: boolean;
}

const AdSenseContext = createContext<AdSenseContextType>({
  isEnabled: false,
  isLoading: true,
});

export function AdSenseProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdSense() {
      try {
        const res = await fetch('/api/admin/adsense-config');
        if (res.ok) {
          const data = await res.json();
          setIsEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error checking AdSense status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdSense();
  }, []);

  return (
    <AdSenseContext.Provider value={{ isEnabled, isLoading }}>
      {children}
    </AdSenseContext.Provider>
  );
}

export function useAdSense() {
  const context = useContext(AdSenseContext);
  if (context === undefined) {
    // Return default values instead of throwing for SSR safety
    return { isEnabled: false, isLoading: true };
  }
  return context;
}
