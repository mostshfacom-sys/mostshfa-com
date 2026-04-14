'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CategorySearchProps {
  placeholder?: string;
}

export function CategorySearch({ placeholder = "ابحث عن تصنيف..." }: CategorySearchProps) {
  return (
    <div className="relative group/catsearch">
      <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/catsearch:text-primary-500 transition-colors" />
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary-500/20 rounded-2xl pr-10 pl-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all"
        onInput={(e) => {
          const val = (e.target as HTMLInputElement).value.toLowerCase();
          const container = e.currentTarget.closest('.Card')?.querySelector('.cat-list-container');
          const items = container?.querySelectorAll('.cat-item');
          items?.forEach((item: any) => {
            const text = item.textContent?.toLowerCase() || '';
            item.style.display = text.includes(val) ? 'flex' : 'none';
          });
        }}
      />
    </div>
  );
}
