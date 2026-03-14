'use client';

import React, { useState, useCallback } from 'react';

interface ComparisonItem {
  id: number;
  name: string;
  nameAr: string;
  type: string;
  address: string;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  specialties?: string[];
  services?: string[];
  hasEmergency?: boolean;
  hasParking?: boolean;
  hasWheelchairAccess?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  workingHours?: any;
  insuranceAccepted?: string[];
  languagesSpoken?: string[];
}

interface ComparisonModalProps {
  items: ComparisonItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (itemId: number) => void;
  entityType: 'hospital' | 'clinic' | 'lab' | 'pharmacy';
  className?: string;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  items,
  isOpen,
  onClose,
  onRemoveItem,
  entityType,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'services'>('overview');

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'hospital': return 'المستشفيات';
      case 'clinic': return 'العيادات';
      case 'lab': return 'المختبرات';
      case 'pharmacy': return 'الصيدليات';
      default: return 'العناصر';
    }
  };

  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : 'غير متوفر';
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderComparisonRow = (
    label: string,
    getValue: (item: ComparisonItem) => React.ReactNode,
    className: string = ''
  ) => (
    <div className={`grid grid-cols-${Math.min(items.length + 1, 5)} gap-4 py-3 border-b border-gray-100 ${className}`}>
      <div className="font-medium text-gray-900 text-sm">{label}</div>
      {items.map((item) => (
        <div key={item.id} className="text-sm text-gray-700">
          {getValue(item)}
        </div>
      ))}
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-0">
      {renderComparisonRow(
        'الاسم',
        (item) => (
          <div className="space-y-1">
            <div className="font-medium">{item.nameAr}</div>
            <div className="text-xs text-gray-500">{item.type}</div>
          </div>
        )
      )}

      {renderComparisonRow(
        'التقييم',
        (item) => (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(item.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs">
              {formatRating(item.rating)} ({formatCount(item.ratingCount)})
            </span>
          </div>
        )
      )}

      {renderComparisonRow(
        'العنوان',
        (item) => <div className="text-xs">{item.address}</div>
      )}

      {renderComparisonRow(
        'الهاتف',
        (item) => (
          <div className="text-xs text-blue-600">
            {item.phone || 'غير متوفر'}
          </div>
        )
      )}

      {renderComparisonRow(
        'الحالة',
        (item) => (
          <div className="flex flex-col gap-1">
            {item.isVerified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                موثق
              </span>
            )}
            {item.isFeatured && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                مميز
              </span>
            )}
            {item.hasEmergency && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                طوارئ 24/7
              </span>
            )}
          </div>
        )
      )}
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-0">
      {renderComparisonRow(
        'التخصصات',
        (item) => (
          <div className="space-y-1">
            {item.specialties?.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs mr-1 mb-1"
              >
                {specialty}
              </span>
            ))}
            {(item.specialties?.length || 0) > 3 && (
              <span className="text-xs text-gray-500">
                +{(item.specialties?.length || 0) - 3} المزيد
              </span>
            )}
          </div>
        )
      )}

      {renderComparisonRow(
        'اللغات المدعومة',
        (item) => (
          <div className="text-xs">
            {item.languagesSpoken?.join(', ') || 'غير محدد'}
          </div>
        )
      )}

      {renderComparisonRow(
        'التأمين المقبول',
        (item) => (
          <div className="space-y-1">
            {item.insuranceAccepted?.slice(0, 2).map((insurance, index) => (
              <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {insurance}
              </div>
            ))}
            {(item.insuranceAccepted?.length || 0) > 2 && (
              <span className="text-xs text-gray-500">
                +{(item.insuranceAccepted?.length || 0) - 2} المزيد
              </span>
            )}
          </div>
        )
      )}

      {renderComparisonRow(
        'ساعات العمل',
        (item) => (
          <div className="text-xs">
            {item.workingHours ? (
              <div>
                <div>السبت - الخميس: 8:00 - 22:00</div>
                <div>الجمعة: 14:00 - 22:00</div>
              </div>
            ) : (
              'غير محدد'
            )}
          </div>
        )
      )}
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-0">
      {renderComparisonRow(
        'الخدمات المتاحة',
        (item) => (
          <div className="space-y-1">
            {item.services?.slice(0, 4).map((service, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                {service}
              </div>
            ))}
            {(item.services?.length || 0) > 4 && (
              <span className="text-xs text-gray-500">
                +{(item.services?.length || 0) - 4} خدمة إضافية
              </span>
            )}
          </div>
        )
      )}

      {renderComparisonRow(
        'المرافق',
        (item) => (
          <div className="space-y-2">
            <div className="flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full ml-2 ${item.hasParking ? 'bg-green-500' : 'bg-red-500'}`}></div>
              مواقف سيارات
            </div>
            <div className="flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full ml-2 ${item.hasWheelchairAccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
              إمكانية وصول
            </div>
            <div className="flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full ml-2 ${item.hasEmergency ? 'bg-green-500' : 'bg-red-500'}`}></div>
              خدمات طوارئ
            </div>
          </div>
        )
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                مقارنة {getEntityTypeLabel()} ({items.length})
              </h2>
              <p className="text-gray-600 mt-1">
                قارن بين الخيارات المختلفة لاتخاذ القرار الأنسب
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              التفاصيل
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الخدمات والمرافق
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Items Header */}
          <div className={`grid grid-cols-${Math.min(items.length + 1, 5)} gap-4 p-6 bg-gray-50 border-b border-gray-200`}>
            <div></div>
            {items.map((item) => (
              <div key={item.id} className="text-center">
                <div className="relative mb-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=150&fit=crop'}
                    alt={item.nameAr}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.nameAr}</h3>
                <p className="text-xs text-gray-500">{item.type}</p>
              </div>
            ))}
          </div>

          {/* Comparison Content */}
          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'services' && renderServicesTab()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              يمكنك مقارنة حتى 4 عناصر في نفس الوقت
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                طباعة المقارنة
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;