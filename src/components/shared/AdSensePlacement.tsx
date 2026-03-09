'use client';

import { useEffect, useMemo, useState } from 'react';
import AdSenseUnit from '@/components/shared/AdSenseUnit';

type AdPlacementKey =
  | 'home_between_tips'
  | 'home_footer'
  | 'article_after_excerpt'
  | 'article_mid'
  | 'article_bottom'
  | 'drug_after_usage'
  | 'hospital_overview'
  | 'articles_list'
  | 'medical_videos_list';

type PlacementConfig = {
  enabled?: boolean;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
};

type AdSenseConfig = {
  clientId?: string;
  placements?: Record<string, PlacementConfig>;
};

interface AdSensePlacementProps {
  placementKey: AdPlacementKey;
  fallbackSlot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: 'true' | 'false';
  className?: string;
  label?: string;
}

export default function AdSensePlacement({
  placementKey,
  fallbackSlot,
  format,
  responsive,
  className,
  label,
}: AdSensePlacementProps) {
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<AdSenseConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/admin/adsense-config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setEnabled(Boolean(data?.enabled));
        setConfig(data?.config || null);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const placement = useMemo(() => {
    return config?.placements?.[placementKey] || {};
  }, [config, placementKey]);

  if (loading || !enabled) {
    return null;
  }

  if (placement?.enabled === false) {
    return null;
  }

  const slot = placement?.slot || fallbackSlot;
  if (!slot) {
    return null;
  }

  const clientId = config?.clientId || 'ca-pub-5755672349927118';
  const formatValue = placement?.format || format || 'auto';
  const responsiveValue = placement?.responsive || responsive || 'true';

  return (
    <AdSenseUnit
      slot={slot}
      clientId={clientId}
      format={formatValue}
      responsive={responsiveValue}
      className={className}
      label={label}
    />
  );
}
