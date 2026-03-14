import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors dark:text-slate-200 dark:hover:text-primary-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href ? (
              <Link href={item.href} className="text-gray-600 hover:text-primary-600 transition-colors dark:text-slate-200 dark:hover:text-primary-300">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium dark:text-white">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
