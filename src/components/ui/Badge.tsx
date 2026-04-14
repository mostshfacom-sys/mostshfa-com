'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-slate-800/80 dark:text-slate-100 dark:border-slate-700/60',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/55 dark:text-primary-50 dark:border-primary-700/50',
      secondary: 'bg-gray-200 text-gray-700 dark:bg-slate-700/75 dark:text-slate-100 dark:border-slate-600/60',
      success: 'bg-green-100 text-green-800 dark:bg-emerald-900/55 dark:text-emerald-50 dark:border-emerald-700/50',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/55 dark:text-amber-50 dark:border-amber-700/50',
      danger: 'bg-red-100 text-red-800 dark:bg-rose-900/55 dark:text-rose-50 dark:border-rose-700/50',
      info: 'bg-blue-100 text-blue-800 dark:bg-sky-900/55 dark:text-sky-50 dark:border-sky-700/50',
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border border-transparent dark:border-white/10',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
