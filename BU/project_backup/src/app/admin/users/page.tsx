'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...(search && { search }) });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !isActive } : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      editor: 'bg-green-100 text-green-700',
      user: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      super_admin: 'مدير عام',
      admin: 'مدير',
      editor: 'محرر',
      user: 'مستخدم',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[role] || styles.user}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <p className="text-gray-500">عرض وإدارة حسابات المستخدمين</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد الإلكتروني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">المستخدم</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الدور</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">آخر دخول</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا يوجد مستخدمين
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{user.name || 'بدون اسم'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-sm border rounded-lg px-2 py-1"
                      >
                        <option value="user">مستخدم</option>
                        <option value="editor">محرر</option>
                        <option value="admin">مدير</option>
                        <option value="super_admin">مدير عام</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('ar-EG')
                        : 'لم يسجل دخول'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          user.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
