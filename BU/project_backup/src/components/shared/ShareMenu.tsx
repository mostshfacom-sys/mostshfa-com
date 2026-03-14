'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShareIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

interface ShareMenuProps {
  title: string;
  url: string;
}

export function ShareMenu({ title, url }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      },
    },
    {
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-sky-500 hover:bg-sky-600',
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
      },
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
      },
    },
    {
      name: 'نسخ الرابط',
      icon: '🔗',
      color: 'bg-neutral-600 hover:bg-neutral-700',
      onClick: () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
  ];

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white shadow-lg transition-all"
        aria-label="مشاركة"
      >
        <ShareIcon className="w-6 h-6" />
      </button>

      {/* Share Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="font-bold text-neutral-900 dark:text-white">مشاركة</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Share Options */}
              <div className="p-2">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      option.onClick();
                      if (option.name !== 'نسخ الرابط') {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg ${option.color} text-white transition-all`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium">{option.name}</span>
                    {option.name === 'نسخ الرابط' && copied && (
                      <span className="mr-auto text-sm">✓ تم النسخ</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
