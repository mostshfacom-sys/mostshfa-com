'use client';

export function SkeletonCard() {
  return (
    <div className="h-[420px] rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg">
      {/* Image skeleton */}
      <div className="h-48 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 animate-shimmer bg-[length:200%_100%]" />
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 animate-pulse" />
        
        {/* Type */}
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 animate-pulse" />
        
        {/* Location */}
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse" />
        
        {/* Button */}
        <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonCardList() {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 shadow-md">
      {/* Image skeleton */}
      <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 animate-shimmer bg-[length:200%_100%]" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonDetailHero() {
  return (
    <div className="h-[500px] bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-300 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700 animate-pulse">
      <div className="h-full container mx-auto px-6 py-8 flex flex-col justify-between max-w-[1920px]">
        <div className="h-10 w-32 bg-white/20 rounded-lg" />
        <div className="space-y-4">
          <div className="h-12 bg-white/20 rounded w-3/4" />
          <div className="h-6 bg-white/20 rounded w-1/2" />
          <div className="h-6 bg-white/20 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}