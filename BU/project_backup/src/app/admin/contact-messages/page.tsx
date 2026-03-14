'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  isRead: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

const statusOptions = [
  { value: 'new', label: 'جديدة', className: 'bg-blue-50 text-blue-600' },
  { value: 'in_progress', label: 'قيد المتابعة', className: 'bg-amber-50 text-amber-600' },
  { value: 'replied', label: 'تم الرد', className: 'bg-emerald-50 text-emerald-600' },
  { value: 'closed', label: 'مغلقة', className: 'bg-gray-100 text-gray-600' },
];

const getStatusMeta = (status: string) =>
  statusOptions.find((item) => item.value === status) || {
    value: status,
    label: status || 'غير محدد',
    className: 'bg-gray-100 text-gray-600',
  };

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editStatus, setEditStatus] = useState('new');

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, readFilter]);

  const fetchMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(search ? { search } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(readFilter !== 'all' ? { isRead: readFilter === 'read' ? 'true' : 'false' } : {}),
        });

        const res = await fetch(`/api/admin/contact-messages?${params}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setTotalPages(data.totalPages || 1);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching contact messages:', error);
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [currentPage, readFilter, search, statusFilter]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (selectedMessageId && !messages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(null);
    }
  }, [messages, selectedMessageId]);

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );

  useEffect(() => {
    if (selectedMessage) {
      setReplyText(selectedMessage.adminReply ?? '');
      setEditStatus(selectedMessage.status || 'new');
    } else {
      setReplyText('');
      setEditStatus('new');
    }
  }, [selectedMessageId]);

  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessageId(message.id);
    setReplyText(message.adminReply ?? '');
    setEditStatus(message.status || 'new');
  };

  const handleToggleRead = async () => {
    if (!selectedMessage) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !selectedMessage.isRead }),
      });

      if (res.ok) {
        await fetchMessages({ silent: true });
      }
    } catch (error) {
      console.error('Error updating message read state:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedMessage) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditStatus(data.status || editStatus);
        await fetchMessages({ silent: true });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage) return;

    const trimmedReply = replyText.trim();
    if (!trimmedReply) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: trimmedReply, status: editStatus || 'replied' }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyText(data.adminReply ?? '');
        setEditStatus(data.status || 'replied');
        await fetchMessages({ silent: true });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedMessageId === messageId) {
          setSelectedMessageId(null);
        }
        await fetchMessages({ silent: true });
      }
    } catch (error) {
      console.error('Error deleting contact message:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">رسائل التواصل</h1>
          <p className="text-gray-500">تابع الرسائل الواردة ورد عليها من لوحة التحكم.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
          <span>غير المقروءة:</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-primary-600">
            {unreadCount}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              placeholder="بحث بالاسم، البريد أو الموضوع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-sm px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">كل الحالات</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">الكل</option>
                <option value="unread">غير مقروءة</option>
                <option value="read">مقروءة</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">المرسل</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الموضوع</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">التاريخ</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    [...Array(6)].map((_, index) => (
                      <tr key={index}>
                        <td colSpan={5} className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : messages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        لا توجد رسائل مطابقة لبحثك.
                      </td>
                    </tr>
                  ) : (
                    messages.map((message) => {
                      const statusMeta = getStatusMeta(message.status);
                      return (
                        <tr
                          key={message.id}
                          className={cn(
                            'hover:bg-gray-50',
                            selectedMessageId === message.id && 'bg-primary-50/60'
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-2">
                              {!message.isRead && (
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary-500"></span>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{message.name}</p>
                                <p className="text-sm text-gray-500" dir="ltr">
                                  {message.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {message.subject || 'بدون عنوان'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn('px-2 py-1 rounded-full text-xs', statusMeta.className)}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(message.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSelectMessage(message)}
                                className="px-3 py-1 rounded-lg text-sm bg-primary-50 text-primary-600 hover:bg-primary-100"
                              >
                                عرض
                              </button>
                              <button
                                onClick={() => handleDelete(message.id)}
                                className="px-3 py-1 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100"
                                disabled={isUpdating}
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-t px-4 py-3">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {currentPage} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {selectedMessage ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedMessage.name}</h2>
                  <p className="text-sm text-gray-500" dir="ltr">
                    {selectedMessage.email}
                  </p>
                  {selectedMessage.phone && (
                    <p className="text-sm text-gray-500" dir="ltr">
                      {selectedMessage.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn('px-2 py-1 rounded-full text-xs', getStatusMeta(selectedMessage.status).className)}>
                    {getStatusMeta(selectedMessage.status).label}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(selectedMessage.createdAt)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">الموضوع</p>
                <p className="mt-1 text-gray-600">{selectedMessage.subject || 'بدون عنوان'}</p>
                <p className="mt-4 text-sm font-semibold text-gray-700">تفاصيل الرسالة</p>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleToggleRead}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:opacity-60"
                >
                  {selectedMessage.isRead ? 'تعيين كغير مقروءة' : 'تمييز كمقروءة'}
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                  >
                    تحديث الحالة
                  </button>
                </div>
              </div>

              {selectedMessage.adminReply && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-700">آخر رد تم إرساله</p>
                  <p className="mt-2 text-sm text-emerald-700 whitespace-pre-line">
                    {selectedMessage.adminReply}
                  </p>
                  {selectedMessage.repliedAt && (
                    <p className="mt-2 text-xs text-emerald-700">
                      تم الرد بتاريخ {formatDate(selectedMessage.repliedAt)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">إرسال رد</label>
                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب رد الإدارة هنا..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
                <button
                  onClick={handleSendReply}
                  disabled={isUpdating || !replyText.trim()}
                  className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  إرسال الرد وتحديث الحالة
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
              <p className="text-sm">اختر رسالة من القائمة لعرض تفاصيلها والرد عليها.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
