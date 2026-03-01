'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenIcon,
  HomeIcon,
  PhoneIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  {
    id: 'home',
    label: 'الرئيسية',
    href: '/',
    icon: HomeIcon,
    match: (pathname: string) => pathname === '/',
  },
  {
    id: 'directories',
    label: 'الأدلة',
    href: '/directories',
    icon: Squares2X2Icon,
    match: (pathname: string) => pathname.startsWith('/directories') || pathname.startsWith('/hospitals'),
  },
  {
    id: 'tools',
    label: 'الأدوات',
    href: '/tools',
    icon: WrenchScrewdriverIcon,
    match: (pathname: string) => pathname.startsWith('/tools'),
  },
  {
    id: 'articles',
    label: 'المقالات',
    href: '/articles',
    icon: BookOpenIcon,
    match: (pathname: string) => pathname.startsWith('/articles'),
  },
  {
    id: 'contact',
    label: 'تواصل',
    href: '/contact',
    icon: PhoneIcon,
    match: (pathname: string) => pathname.startsWith('/contact'),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      <div className="mx-auto max-w-4xl">
        <div className="mx-3 mb-3 rounded-3xl border border-white/70 bg-white/95 px-4 py-3 shadow-xl shadow-emerald-500/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
          <div className="grid grid-cols-5 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname ? item.match(pathname) : false;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
