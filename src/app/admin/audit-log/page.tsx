'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: { name: string | null; email: string } | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ action: '', entityType: '' });

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filter.action && { action: filter.action }),
        ...(filter.entityType && { entityType: filter.entityType }),
      });
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      create: 'إنشاء',
      update: 'تعديل',
      delete: 'حذف',
      login: 'دخول',
      logout: 'خروج',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[action] || 'bg-gray-100 text-gray-700'}`}>
        {labels[action] || action}
      </span>
    );
  };

  const getEntityIcon = (type: string) => {
    const icons: Record<string, string> = {
      hospital: '🏥',
      clinic: '🏢',
      lab: '🧪',
      pharmacy: '💊',
      drug: '💉',
      article: '📰',
      user: '👤',
    };
    return icons[type] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">سجل التدقيق</h1>
        <p className="text-gray-500">تتبع جميع التغييرات والأنشطة في النظام</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <select
          value={filter.action}
          onChange={(e) => { setFilter({ ...filter, action: e.target.value }); setPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">جميع الإجراءات</option>
          <option value="create">إنشاء</option>
          <option value="update">تعديل</option>
          <option value="delete">حذف</option>
          <option value="login">دخول</option>
          <option value="logout">خروج</option>
        </select>
        <select
          value={filter.entityType}
          onChange={(e) => { setFilter({ ...filter, entityType: e.target.value }); setPage(1); }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">جميع الكيانات</option>
          <option value="hospital">مستشفيات</option>
          <option value="clinic">عيادات</option>
          <option value="lab">معامل</option>
          <option value="pharmacy">صيدليات</option>
          <option value="drug">أدوية</option>
          <option value="article">مقالات</option>
          <option value="user">مستخدمين</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد سجلات
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">
                        {log.user?.name || log.user?.email || 'نظام'}
                      </span>
                      {getActionBadge(log.action)}
                      <span className="text-gray-600">{log.entityName}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>
                        {new Date(log.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-primary-600 cursor-pointer hover:underline">
                          عرض التغييرات
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto" dir="ltr">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-gray-600">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
