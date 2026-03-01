'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-white/95 rounded-2xl shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] border border-slate-200/70 dark:bg-slate-900/80 dark:border-white/10 dark:shadow-[0_14px_32px_-28px_rgba(0,0,0,0.55)]',
      hover:
        'bg-white/95 rounded-2xl shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] border border-slate-200/70 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.35)] hover:border-primary-200/80 transition-all duration-200 cursor-pointer dark:bg-slate-900/80 dark:border-white/10 dark:shadow-[0_14px_32px_-28px_rgba(0,0,0,0.55)] dark:hover:border-primary-400/40',
      bordered:
        'bg-white/95 rounded-2xl border-2 border-slate-200/80 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.2)] dark:bg-slate-900/80 dark:border-white/12 dark:shadow-[0_14px_30px_-28px_rgba(0,0,0,0.5)]',
    };
    
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
