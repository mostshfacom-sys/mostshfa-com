'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

type AutoScrollRowProps = {
  children: ReactNode;
  className?: string;
  speed?: number;
  pauseOnHover?: boolean;
  paused?: boolean;
  loop?: boolean;
  dir?: 'rtl' | 'ltr';
  respectReducedMotion?: boolean;
  showControls?: boolean;
  scrollStep?: number;
  controlsClassName?: string;
};

const wrapOffset = (offset: number, width: number) => {
  if (width <= 0) return 0;
  const normalized = ((offset % width) + width) % width;
  return normalized;
};

export default function AutoScrollRow({
  children,
  className,
  speed = 0.35,
  pauseOnHover = true,
  paused = false,
  loop = false,
  dir,
  respectReducedMotion = true,
  showControls = false,
  scrollStep,
  controlsClassName,
}: AutoScrollRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const [repeatCount, setRepeatCount] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [manualOffset, setManualOffset] = useState(0);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const [marqueeDuration, setMarqueeDuration] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragPointerTypeRef = useRef<string | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragHasMovedRef = useRef(false);
  const isRtl = dir === 'rtl';
  const directionSign = isRtl ? 1 : -1;
  const items = useMemo(() => Children.toArray(children), [children]);
  const repeatedGroups = useMemo(() => {
    if (repeatCount <= 1) return [];
    return Array.from({ length: repeatCount - 1 }, (_, groupIndex) => (
      <div key={`clone-group-${groupIndex}`} className="flex w-max flex-nowrap gap-6 shrink-0" aria-hidden="true">
        {items.map((item, itemIndex) => {
          const key = `clone-${groupIndex}-${itemIndex}`;
          return isValidElement(item) ? (
            cloneElement(item, { key })
          ) : (
            <span key={key} className="contents">
              {item}
            </span>
          );
        })}
      </div>
    ));
  }, [items, repeatCount]);
  const effectiveSpeed = useMemo(() => Math.max(0.04, Math.abs(speed)), [speed]);

  const updateMeasurements = useCallback(() => {
    const group = groupRef.current;
    if (!group) return;
    const track = trackRef.current;
    let width = group.scrollWidth || group.getBoundingClientRect().width;
    if (!width && track) {
      const trackWidth = track.scrollWidth || track.getBoundingClientRect().width;
      width = trackWidth ? trackWidth / 2 : 0;
    }
    widthRef.current = width;
    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
    if (width > 0 && containerWidth > 0) {
      const nextCount = Math.max(2, Math.ceil(containerWidth / width) + 1);
      setRepeatCount((prev) => (prev === nextCount ? prev : nextCount));
    }
    if (width > 0) {
      setMarqueeDistance((prev) => (prev === width ? prev : width));
      const nextDuration = width / (effectiveSpeed * 1000);
      setMarqueeDuration((prev) => (Math.abs(prev - nextDuration) < 0.01 ? prev : nextDuration));
      setManualOffset((prev) => wrapOffset(prev, width));
    }
  }, [effectiveSpeed]);

  const ensureWidth = useCallback(() => {
    if (widthRef.current > 0) return widthRef.current;
    updateMeasurements();
    return widthRef.current;
  }, [updateMeasurements]);

  const handleStepScroll = (direction: 'next' | 'prev') => {
    const width = ensureWidth();
    const container = containerRef.current;
    if (!container || width <= 0) return;

    const step = scrollStep ?? container.clientWidth * 0.8;
    const delta = (direction === 'next' ? 1 : -1) * step;
    setManualOffset((prev) => wrapOffset(prev + delta, width));
  };

  const beginDrag = useCallback(
    (clientX: number, pointerId: number, pointerType?: string) => {
      if (dragPointerIdRef.current !== null) return;
      dragPointerIdRef.current = pointerId;
      dragPointerTypeRef.current = pointerType ?? null;
      dragStartXRef.current = clientX;
      dragStartOffsetRef.current = manualOffset;
      dragHasMovedRef.current = false;
      ensureWidth();
      if (pauseOnHover) {
        setIsPaused(true);
      }
    },
    [ensureWidth, manualOffset, pauseOnHover]
  );

  const updateDrag = useCallback(
    (clientX: number) => {
      if (dragPointerIdRef.current === null) return;
      const width = ensureWidth();
      if (width <= 0) return;
      const delta = clientX - dragStartXRef.current;
      const threshold = dragPointerTypeRef.current === 'touch' ? 10 : 20;
      if (Math.abs(delta) > threshold) {
        dragHasMovedRef.current = true;
      }
      setManualOffset(wrapOffset(dragStartOffsetRef.current + delta * directionSign, width));
    },
    [directionSign, ensureWidth]
  );

  const endDrag = useCallback(() => {
    if (dragPointerIdRef.current === null) return;
    dragPointerIdRef.current = null;
    dragPointerTypeRef.current = null;
    if (pauseOnHover) {
      setIsPaused(false);
    }
  }, [pauseOnHover]);

  useEffect(() => {
    updateMeasurements();
    const group = groupRef.current;
    if (!group || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => updateMeasurements());
    observer.observe(group);
    return () => observer.disconnect();
  }, [items, updateMeasurements]);

  useEffect(() => {
    if (!respectReducedMotion) {
      setPrefersReducedMotion(false);
      return;
    }
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();

    if (media.addEventListener) {
      media.addEventListener('change', updatePreference);
      return () => media.removeEventListener('change', updatePreference);
    }

    media.addListener(updatePreference);
    return () => media.removeListener(updatePreference);
  }, [respectReducedMotion]);

  const shouldAnimate =
    loop && marqueeDistance > 0 && marqueeDuration > 0 && (!respectReducedMotion || !prefersReducedMotion);

  const manualStyle = useMemo<CSSProperties>(
    () => ({
      transform: `translateX(${directionSign * manualOffset}px)`,
    }),
    [directionSign, manualOffset]
  );

  const marqueeStyle = useMemo<CSSProperties>(() => {
    const base = {
      '--marquee-distance': `${directionSign * marqueeDistance}px`,
    } as CSSProperties;

    if (!shouldAnimate) {
      return {
        ...base,
        animation: 'none',
      };
    }

    return {
      ...base,
      animation: `auto-scroll-row-marquee ${marqueeDuration}s linear infinite`,
      animationPlayState: isPaused || paused ? 'paused' : 'running',
    };
  }, [directionSign, isPaused, marqueeDistance, marqueeDuration, shouldAnimate, paused]);

  const PrevIcon = isRtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = isRtl ? ChevronLeftIcon : ChevronRightIcon;

  if (!items.length) return null;

  return (
    <div className="relative">
      {showControls && (
        <div className={cn('mb-3 flex items-center justify-between gap-3', controlsClassName)}>
          <button
            type="button"
            aria-label="السابق"
            onClick={() => handleStepScroll('prev')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-lg shadow-black/5 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100"
          >
            <PrevIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="التالي"
            onClick={() => handleStepScroll('next')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-lg shadow-black/5 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100"
          >
            <NextIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn('overflow-hidden', className)}
        dir={dir}
        onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
        onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          if (event.target === event.currentTarget && typeof event.currentTarget.setPointerCapture === 'function') {
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
            }
          }
          beginDrag(event.clientX, event.pointerId, event.pointerType);
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== dragPointerIdRef.current) return;
          updateDrag(event.clientX);
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== dragPointerIdRef.current) return;
          if (
            event.target === event.currentTarget &&
            typeof event.currentTarget.releasePointerCapture === 'function'
          ) {
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
            }
          }
          endDrag();
        }}
        onPointerCancel={(event) => {
          if (event.pointerId !== dragPointerIdRef.current) return;
          if (
            event.target === event.currentTarget &&
            typeof event.currentTarget.releasePointerCapture === 'function'
          ) {
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
            }
          }
          endDrag();
        }}
        onClickCapture={(event) => {
          if (!dragHasMovedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          dragHasMovedRef.current = false;
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <div style={manualStyle} className="w-max will-change-transform">
          <div ref={trackRef} style={marqueeStyle} className="flex w-max flex-nowrap will-change-transform">
            <div ref={groupRef} className="flex w-max flex-nowrap gap-6 shrink-0">
              {items}
            </div>
            {repeatedGroups}
          </div>
        </div>
      </div>
    </div>
  );
}
