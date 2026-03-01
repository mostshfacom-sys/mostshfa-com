'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Simple SVG Icons
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'hospital' | 'location' | 'specialty' | 'type' | 'filter' | 'article' | 'tool' | 'drug' | 'guide';
  subtitle?: string;
  metadata?: any;
  icon?: string;
  priority?: number;
  count?: number;
}

interface UniversalSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  showEntityFilter?: boolean;
  entityTypes?: string[];
  onEntityTypesChange?: (types: string[]) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const entityTypeLabels: Record<string, string> = {
  hospital: 'مستشفيات',
  clinic: 'عيادات',
  lab: 'مختبرات',
  pharmacy: 'صيدليات',
  article: 'مقالات',
  tool: 'أدوات طبية',
  drug: 'أدوية',
  guide: 'الأدلة الطبية',
  location: 'موقع',
  specialty: 'تخصص',
  type: 'نوع',
  filter: 'فلتر'
};

const entityFilterLabels: Record<string, string> = {
  hospital: 'مستشفيات',
  clinic: 'عيادات',
  lab: 'مختبرات',
  pharmacy: 'صيدليات',
  article: 'مقالات',
  tool: 'أدوات طبية',
  drug: 'أدوية',
  guide: 'الأدلة الطبية'
};

export default function UniversalSearch({
  placeholder = 'ابحث في جميع الخدمات الطبية...',
  value = '',
  onChange,
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  showEntityFilter = false,
  entityTypes = [],
  onEntityTypesChange,
  className = '',
  size = 'md'
}: UniversalSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<SearchSuggestion[]>([]);
  
  // جلب الاقتراحات من الخادم
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setFetchedSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFetchedSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الاقتراحات:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // تأخير جلب الاقتراحات
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && inputValue.length >= 2) {
        fetchSuggestions(inputValue);
      } else {
        setFetchedSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // تحديث القيمة عند تغيير الـ prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // معالجة تغيير النص
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    onChange?.(newValue);
    
    if (newValue.trim()) {
      setShowSuggestions(true);
      if (newValue.length >= 2) {
        fetchSuggestions(newValue);
      }
    } else {
      setShowSuggestions(false);
      setFetchedSuggestions([]);
    }
  }, [onChange, fetchSuggestions]);

  // معالجة البحث
  const handleSearch = useCallback(() => {
    if (inputValue.trim()) {
      onSearch?.(inputValue.trim());
      setShowSuggestions(false);
    }
  }, [inputValue, onSearch]);

  // معالجة اختيار اقتراح
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
    onSearch?.(suggestion);
  }, [onSuggestionSelect, onSearch]);

  // معالجة لوحة المفاتيح
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentSuggestions = fetchedSuggestions.length > 0 ? fetchedSuggestions : suggestions;
    
    if (!showSuggestions || currentSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(currentSuggestions[selectedIndex].text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, fetchedSuggestions, suggestions, selectedIndex, handleSearch, handleSuggestionSelect]);

  // معالجة تغيير أنواع الكيانات
  const handleEntityTypeToggle = useCallback((type: string) => {
    if (!onEntityTypesChange) return;
    
    const newTypes = entityTypes.includes(type)
      ? entityTypes.filter(t => t !== type)
      : [...entityTypes, type];
    
    onEntityTypesChange(newTypes);
  }, [entityTypes, onEntityTypesChange]);

  // إغلاق الاقتراحات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تحديد أحجام المكونات
  const sizeClasses = {
    sm: {
      input: 'h-10 text-sm',
      icon: 'h-4 w-4',
      suggestion: 'px-3 py-2 text-sm'
    },
    md: {
      input: 'h-12 text-base',
      icon: 'h-5 w-5',
      suggestion: 'px-4 py-3 text-base'
    },
    lg: {
      input: 'h-14 text-lg',
      icon: 'h-6 w-6',
      suggestion: 'px-5 py-4 text-lg'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`relative w-full ${className}`}>
      {/* حقل البحث الرئيسي */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <MagnifyingGlassIcon className={`${currentSize.icon} text-gray-400`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`
            ${currentSize.input}
            w-full pr-10 pl-4 
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            dark:placeholder-gray-400 dark:focus:ring-blue-400
            transition-colors duration-200
          `}
        />
        
        {/* زر المسح */}
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              onChange?.('');
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className={currentSize.icon} />
          </button>
        )}
      </div>

      {/* فلاتر أنواع الكيانات */}
      {showEntityFilter && (
        <div className="mt-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            فلترة حسب النوع ({entityTypes.length})
          </button>
          
          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {Object.entries(entityFilterLabels).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => handleEntityTypeToggle(type)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${entityTypes.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* قائمة الاقتراحات */}
      {showSuggestions && (fetchedSuggestions.length > 0 || suggestions.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {/* مؤشر التحميل */}
          {loadingSuggestions && (
            <div className="p-3 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {/* الاقتراحات المجلبة من الخادم */}
          {!loadingSuggestions && fetchedSuggestions.length > 0 && fetchedSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion.text)}
              className={`
                ${currentSize.suggestion}
                w-full text-right flex items-center justify-between
                hover:bg-gray-50 dark:hover:bg-gray-700
                ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === fetchedSuggestions.length - 1 ? 'rounded-b-lg' : ''}
                transition-colors duration-150
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{suggestion.icon}</span>
                <div className="text-right">
                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                    {suggestion.text}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {entityTypeLabels[suggestion.type] || suggestion.type}
              </div>
            </button>
          ))}

          {/* الاقتراحات الثابتة إذا لم توجد اقتراحات من الخادم */}
          {!loadingSuggestions && fetchedSuggestions.length === 0 && suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionSelect(suggestion.text)}
              className={`
                ${currentSize.suggestion}
                w-full text-right flex items-center justify-between
                hover:bg-gray-50 dark:hover:bg-gray-700
                ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
                transition-colors duration-150
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-900 dark:text-gray-100">
                  {suggestion.text}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {entityTypeLabels[suggestion.type] || suggestion.type}
                </span>
              </div>
              
              {suggestion.count && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {suggestion.count} نتيجة
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* مؤشر التحميل */}
      {(isLoading || loadingSuggestions) && (
        <div className="absolute inset-y-0 left-10 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
