import React, { useState, useEffect } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { getApiUrl } from '../src/config/api';

interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  company_name?: string;
  limits?: {
    daily_requests?: number;
    used_today?: number;
  };
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('session_token');
      const url = getApiUrl(`/webhook/admin-users-list?search=${encodeURIComponent(search)}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearUserHistory = async (userId: string) => {
    if (!confirm('Очистить всю историю этого пользователя?')) return;

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(getApiUrl('/webhook/admin/user-history-clear'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      alert('История очищена');
      fetchUsers();
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="fixed gradient-bg overflow-hidden flex flex-col inset-0" style={{ height: '100dvh' }}>
      <AppHeader showHomeButton={true} />

      <div className="flex-1 overflow-y-auto min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-6 px-4">
        <div className="max-w-6xl mx-auto py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Админка</h1>

          {/* Search */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по username, telegram_id"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Поиск'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/[0.05] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Telegram ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Роль</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Компания</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Лимиты</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.telegram_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {user.role || 'viewer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.company_name || 'Нет'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.limits ? `${user.limits.used_today || 0} / ${user.limits.daily_requests || 10}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => clearUserHistory(user.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Очистить историю
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Пользователи не найдены
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
