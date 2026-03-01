'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          أنت غير متصل بالإنترنت
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          يبدو أنك فقدت الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>

          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 text-right">
          <h3 className="font-semibold text-blue-800 mb-2">💡 نصائح</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• تحقق من اتصال WiFi أو بيانات الهاتف</li>
            <li>• حاول إعادة تشغيل جهاز التوجيه</li>
            <li>• بعض الصفحات المحفوظة قد تعمل بدون إنترنت</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
