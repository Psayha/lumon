import React, { useState, useEffect } from 'react';

import { Users, Search, Trash2, CheckCircle, XCircle, Settings, Unlock, Ban, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';

interface User {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  chatsCount: number;
  companiesCount: number;
  companies: Array<{
    company_id: string;
    role: string;
  }>;
  legalAcceptedAt?: string;
  legalVersion?: string;
  // Optional fields for UI state (populated after fetching limits or derived)
  isBanned?: boolean;
}

interface UserLimit {
  id: string;
  userId: string;
  limitType: string;
  limitValue: number;
  currentUsage: number;
  resetAt: string | null;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLimits, setUserLimits] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUsersList}?${params}`;
      const data = await adminApiRequest<User[]>(endpoint);
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        const errorMsg = data.message || 'Ошибка сервера: не удалось загрузить пользователей';
        console.error('Expected array but got:', data.data);
        showToast('error', errorMsg);
        setUsers([]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке пользователей';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLimits = async (userId: string) => {
    try {
      const params = new URLSearchParams();
      params.append('user_id', userId);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUserLimitsList}?${params}`;
      const data = await adminApiRequest<UserLimit[]>(endpoint);
      if (data.success && data.data) {
        const limitsMap: Record<string, number> = {};
        data.data.forEach(limit => {
          limitsMap[limit.limitType] = limit.limitValue;
        });
        setUserLimits(limitsMap);
      }
    } catch (error) {
      console.error('Failed to load limits:', error);
      showToast('error', 'Не удалось загрузить лимиты');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserLimits(selectedUser.id);
    } else {
      setUserLimits({});
    }
  }, [selectedUser]);

  const handleClearHistory = async (userId: string, username: string) => {
    if (!confirm(`Очистить всю историю пользователя ${username}?`)) return;

    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminUserHistoryClear, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      if (data.success) {
        showToast('success', 'История очищена');
        await loadUsers();
      } else {
        showToast('error', data.message || 'Не удалось очистить историю');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при очистке истории');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ ${username} ПОЛНОСТЬЮ?\n\nБудут удалены:\n- Все чаты и сообщения\n- Все лимиты\n- Связи с компаниями\n- Сам пользователь\n\nЭто действие необратимо!`)) return;

    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminUserDelete, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      if (data.success) {
        showToast('success', 'Пользователь удалён');
        await loadUsers();
      } else {
        showToast('error', data.message || 'Не удалось удалить пользователя');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при удалении пользователя');
    }
  };

  const handleBanUser = async (_userId: string, _isBanned?: boolean) => {
    // Note: The current backend implementation for 'banUser' requires a companyId and only bans from a company.
    // There is no global ban endpoint in the provided AdminService.
    // However, for this UI, we might be expecting a global ban or a specific company ban.
    // Given the AdminService.banUser signature: banUser(userId, companyId)
    // We need to know which company to ban them from.
    // For now, I will assume we are banning them from their first company or show an error if no company.
    
    // TODO: Implement proper global ban or company selection.
    // For now, let's just show a toast that this feature requires company context.
    showToast('error', 'Блокировка доступна только в контексте компании');
  };

  const handleUpdateLimit = async (userId: string, limitType: string, limitValue: number) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminUserLimitsUpdate, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          limit_type: limitType,
          limit_value: limitValue,
        }),
      });
      if (data.success) {
        showToast('success', 'Лимиты обновлены');
        // Update local state
        setUserLimits(prev => ({ ...prev, [limitType]: limitValue }));
      } else {
        showToast('error', data.message || 'Не удалось обновить лимиты');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при обновлении лимитов');
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.telegramId.toString().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Всего пользователей: {users.length}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>Всего пользователей: {filteredUsers.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Пользователь</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Компания</th>
                  <th className="px-6 py-4">Юр. доки</th>
                  <th className="px-6 py-4">Дата регистрации</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                          {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.firstName || 'Без имени'} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{user.username} • ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Пользователь
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {user.companies && user.companies.length > 0 
                        ? user.companies.map(c => `Компания #${c.company_id}`).join(', ') 
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {user.legalAcceptedAt ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Приняты</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Ожидание</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Настроить лимиты"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanUser(user.id, user.isBanned);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isBanned
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={user.isBanned ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {user.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id, user.username || user.firstName || 'пользователя');
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Limits Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Настройка лимитов
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">GPT-4</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 50, 100, 500, 1000, -1].map((limit) => (
                    <button
                      key={`gpt4-${limit}`}
                      onClick={() => handleUpdateLimit(selectedUser.id, 'gpt4_limit', limit)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        (userLimits['gpt4_limit'] || 100) === limit
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      {limit === -1 ? 'Безлимит' : limit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Claude 3.5 Sonnet</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 50, 100, 500, 1000, -1].map((limit) => (
                    <button
                      key={`claude-${limit}`}
                      onClick={() => handleUpdateLimit(selectedUser.id, 'claude_limit', limit)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        (userLimits['claude_limit'] || 100) === limit
                          ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-200 hover:bg-purple-50/50'
                      }`}
                    >
                      {limit === -1 ? 'Безлимит' : limit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleClearHistory(selectedUser.id, selectedUser.username || selectedUser.firstName || 'пользователя')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Очистить историю чатов
                </button>
                <p className="mt-2 text-xs text-center text-gray-500">
                  Это действие удалит все чаты и сообщения пользователя безвозвратно.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
