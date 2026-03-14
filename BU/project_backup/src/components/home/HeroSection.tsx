'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Medical Icons Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-20 h-20 opacity-10">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
          </svg>
        </div>
        <div className="absolute bottom-20 left-20 w-16 h-16 opacity-10">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      </div>

      <div className="container-custom relative py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
            دليلك الشامل للخدمات الطبية في مصر
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-100 mb-8 animate-fade-in">
            ابحث عن أقرب مستشفى، عيادة، معمل، أو صيدلية إليك
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-slide-up">
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن مستشفى، عيادة، طبيب، أو تخصص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 px-6 pr-14 text-lg rounded-xl border-0 shadow-lg text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                aria-label="بحث"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-slide-up">
            <span className="text-primary-200 text-sm">بحث سريع:</span>
            {['مستشفى القاهرة', 'عيادة أسنان', 'معمل تحاليل', 'صيدلية 24 ساعة'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
        </svg>
      </div>
    </section>
  );
}
