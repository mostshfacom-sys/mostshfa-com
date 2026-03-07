'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Stats {
  hospitals: number;
  clinics: number;
  labs: number;
  pharmacies: number;
  drugs: number;
  articles: number;
  contactMessages: number;
  contactMessagesUnread: number;
  users: number;
}

interface RecentActivity {
  id: string;
  type: string;
  action: string;
  entityName: string;
  userName: string;
  createdAt: string;
}

const statCards = [
  { key: 'hospitals', label: 'المستشفيات', href: '/admin/hospitals', color: 'bg-blue-500', icon: '🏥' },
  { key: 'clinics', label: 'العيادات', href: '/admin/clinics', color: 'bg-green-500', icon: '🏢' },
  { key: 'labs', label: 'المعامل', href: '/admin/labs', color: 'bg-purple-500', icon: '🧪' },
  { key: 'pharmacies', label: 'الصيدليات', href: '/admin/pharmacies', color: 'bg-red-500', icon: '💊' },
  { key: 'drugs', label: 'الأدوية', href: '/admin/drugs', color: 'bg-yellow-500', icon: '💉' },
  { key: 'articles', label: 'المقالات', href: '/admin/articles', color: 'bg-indigo-500', icon: '📰' },
  { key: 'contactMessages', label: 'رسائل التواصل', href: '/admin/contact-messages', color: 'bg-emerald-500', icon: '✉️' },
  { key: 'users', label: 'المستخدمين', href: '/admin/users', color: 'bg-pink-500', icon: '👥' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdSenseEnabled, setIsAdSenseEnabled] = useState(false);
  const [isUpdatingAdSense, setIsUpdatingAdSense] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAdSenseStatus();
  }, []);

  const fetchAdSenseStatus = async () => {
    try {
      const res = await fetch('/api/admin/adsense-config');
      if (res.ok) {
        const data = await res.json();
        setIsAdSenseEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching AdSense status:', error);
    }
  };

  const toggleAdSense = async () => {
    setIsUpdatingAdSense(true);
    try {
      const res = await fetch('/api/admin/adsense-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isAdSenseEnabled }),
      });
      if (res.ok) {
        setIsAdSenseEnabled(!isAdSenseEnabled);
        try {
          localStorage.setItem('adsense_enabled', String(!isAdSenseEnabled));
          window.dispatchEvent(new Event('storage'));
        } catch {}
        toast.success(isAdSenseEnabled ? 'تم إيقاف أدسينس مؤقتاً' : 'تم تفعيل أدسينس');
      } else {
        toast.error('فشل في تحديث حالة أدسينس');
      }
    } catch (error) {
      console.error('Error toggling AdSense:', error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setIsUpdatingAdSense(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity?limit=10'),
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AdSense Control Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAdSenseEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">تحكم جوجل أدسينس</h2>
              <p className="text-sm text-gray-500">تحكم في تفعيل أو إيقاف الإعلانات فوراً لتجنب المشاكل أثناء التصفح المتكرر</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isAdSenseEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {isAdSenseEnabled ? 'مفعل الآن' : 'متوقف حالياً'}
            </span>
            <button
              onClick={toggleAdSense}
              disabled={isUpdatingAdSense}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isAdSenseEnabled ? 'bg-green-600' : 'bg-gray-200'
              } ${isUpdatingAdSense ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`${
                  isAdSenseEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className={`w-3 h-3 rounded-full ${card.color}`}></span>
            </div>
            <p className="text-gray-500 text-sm mb-1">{card.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-800">
                {stats?.[card.key as keyof Stats]?.toLocaleString('ar-EG') || 0}
              </p>
              {card.key === 'contactMessages' && (stats?.contactMessagesUnread ?? 0) > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                  {stats?.contactMessagesUnread} غير مقروءة
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/hospitals/new"
            className="flex items-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl">➕</span>
            <span>إضافة مستشفى</span>
          </Link>
          <Link
            href="/admin/hospitals-banner"
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر المستشفيات</span>
          </Link>
          <Link
            href="/admin/clinics-banner"
            className="flex items-center gap-3 p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر العيادات</span>
          </Link>
          <Link
            href="/admin/labs-banner"
            className="flex items-center gap-3 p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر المعامل</span>
          </Link>
          <Link
            href="/admin/pharmacies-banner"
            className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر الصيدليات</span>
          </Link>
          <Link
            href="/admin/master-banner"
            className="flex items-center gap-3 p-4 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
          >
            <span className="text-xl">🎛️</span>
            <span>بانر الماستر</span>
          </Link>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <span className="text-xl">📝</span>
            <span>كتابة مقال</span>
          </Link>
          <Link
            href="/admin/drugs/new"
            className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl">💊</span>
            <span>إضافة دواء</span>
          </Link>
          <Link
            href="/admin/doctors-banner"
            className="flex items-center gap-3 p-4 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر الأطباء</span>
          </Link>
          <Link
            href="/admin/drugs-banner"
            className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر الأدوية</span>
          </Link>
          <Link
            href="/admin/emergency-banner"
            className="flex items-center gap-3 p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر الطوارئ</span>
          </Link>
          <Link
            href="/admin/nursing-banner"
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر التمريض</span>
          </Link>
          <Link
            href="/admin/home-banner"
            className="flex items-center gap-3 p-4 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر الرئيسية</span>
          </Link>
          <Link
            href="/admin/tools-banner"
            className="flex items-center gap-3 p-4 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <span className="text-xl">🧰</span>
            <span>بانر الأدوات الطبية</span>
          </Link>
          <Link
            href="/admin/visual-tips"
            className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>المعلومات المصورة</span>
          </Link>
          <Link
            href="/admin/articles-banner"
            className="flex items-center gap-3 p-4 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <span className="text-xl">🖼️</span>
            <span>بانر المقالات</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <span className="text-xl">👤</span>
            <span>إدارة المستخدمين</span>
          </Link>
          <Link
            href="/admin/contact-messages"
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <span className="text-xl">✉️</span>
            <span>رسائل التواصل</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">النشاط الأخير</h2>
          <Link href="/admin/audit-log" className="text-primary-600 hover:underline text-sm">
            عرض الكل
          </Link>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600">
                    {activity.type === 'hospital' ? '🏥' : 
                     activity.type === 'article' ? '📰' : 
                     activity.type === 'user' ? '👤' : '📋'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}
                    {activity.action === 'create' ? 'أضاف' : 
                     activity.action === 'update' ? 'عدّل' : 
                     activity.action === 'delete' ? 'حذف' : activity.action}
                    {' '}
                    <span className="font-medium">{activity.entityName}</span>
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date(activity.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">لا يوجد نشاط حديث</p>
        )}
      </div>
    </div>
  );
}
