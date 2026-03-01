'use client';

import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function DateInput({ label, className, value, onChange, ...props }: DateInputProps) {
  const displayValue = value ? String(value).split('-').reverse().join(' / ') : '';

  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">{label}</label>}
      <div className="relative w-full">
        {/* Fake Display Input */}
        <div 
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl flex items-center justify-between transition-all cursor-pointer hover:border-blue-400"
          onClick={(e) => {
            // Focus the hidden input when clicking the fake one
            const hiddenInput = e.currentTarget.nextElementSibling as HTMLInputElement;
            hiddenInput?.showPicker();
          }}
        >
          <span className={`font-mono tracking-wider ${value ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-400'}`}>
            {displayValue || 'يوم / شهر / سنة'}
          </span>
          <CalendarIcon className="w-5 h-5 text-neutral-500" />
        </div>
        
        {/* Hidden Real Input */}
        <input 
          type="date" 
          value={value} 
          onChange={onChange}
          onClick={(e) => {
            try {
              // Explicitly show picker on click for better browser support
              if ('showPicker' in e.currentTarget) {
                (e.currentTarget as HTMLInputElement).showPicker();
              }
            } catch (err) {
              // Ignore errors
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ direction: 'ltr' }} 
          {...props}
        />
      </div>
    </div>
  );
}
