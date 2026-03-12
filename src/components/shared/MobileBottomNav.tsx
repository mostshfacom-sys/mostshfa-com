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
import { useEffect, useMemo, useState } from 'react';

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
  const [isGuidesOpen, setIsGuidesOpen] = useState(false);

  const guidesItems = useMemo(
    () => [
      { id: 'all', label: 'جميع الأدلة الطبية', href: '/directories' },
      { id: 'hospitals-pro', label: 'دليل المستشفيات', href: '/hospitals-pro' },
      { id: 'clinics', label: 'دليل العيادات', href: '/clinics' },
      { id: 'pharmacies', label: 'دليل الصيدليات', href: '/pharmacies' },
      { id: 'labs', label: 'دليل المعامل', href: '/labs' },
      { id: 'drugs', label: 'دليل الأدوية', href: '/drugs' },
      { id: 'emergency', label: 'دليل الطوارئ', href: '/emergency' },
      { id: 'first-aid', label: 'دليل الإسعافات الأولية', href: '/first-aid' },
    ],
    []
  );

  useEffect(() => {
    setIsGuidesOpen(false);
  }, [pathname]);

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
              if (item.id === 'directories') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIsGuidesOpen((v) => !v)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-white/10'
                    }`}
                    aria-haspopup="dialog"
                    aria-expanded={isGuidesOpen}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              }
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

      {isGuidesOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="pointer-events-auto absolute inset-x-0 top-0 bottom-24 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsGuidesOpen(false)}
            aria-label="إغلاق"
          />
          <div className="pointer-events-auto absolute inset-x-0 bottom-24 p-3">
            <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl border border-white/70 overflow-hidden dark:bg-slate-900 dark:border-white/10">
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">أهم الأدلة</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">اختصار سريع لأهم الصفحات</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuidesOpen(false)}
                  className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {guidesItems.map((g) => (
                    <Link
                      key={g.id}
                      href={g.href}
                      onClick={() => setIsGuidesOpen(false)}
                      className="rounded-2xl px-3 py-3 text-sm font-bold bg-slate-50 text-slate-900 hover:bg-emerald-50 hover:text-emerald-800 transition dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      {g.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
