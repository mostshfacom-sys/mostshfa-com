/**
 * Performance utilities for optimizing the application
 */

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: 'script' | 'style' | 'image' | 'font') {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Prefetch a page for faster navigation
 */
export function prefetchPage(href: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(callback: () => void, timeout = 2000) {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Measure component render time (development only)
 */
export function measureRender(componentName: string) {
  if (process.env.NODE_ENV !== 'development') return { start: () => {}, end: () => {} };
  
  const start = () => performance.mark(`${componentName}-start`);
  const end = () => {
    performance.mark(`${componentName}-end`);
    performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);
    const measure = performance.getEntriesByName(componentName)[0];
    console.log(`[Performance] ${componentName}: ${measure.duration.toFixed(2)}ms`);
    performance.clearMarks();
    performance.clearMeasures();
  };
  
  return { start, end };
}
