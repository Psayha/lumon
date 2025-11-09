import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Settings, Edit, Save, X } from 'lucide-react';
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
  const [limits, setLimits] = useState<UserLimit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUsersList}?${params}`;
      const data = await adminApiRequest(endpoint);
      if (data.success && data.data) {
        setUsers(data.data);
      } else {
        const errorMsg = data.message || 'Ошибка сервера: не удалось загрузить пользователей';
        showToast('error', errorMsg);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      showToast('error', error?.message || 'Ошибка при загрузке пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLimits = async (userId?: string) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUserLimitsList}?${params}`;
      const data = await adminApiRequest(endpoint);
      if (data.success && data.data) {
        setLimits(data.data);
      }
    } catch (error) {
      console.error('Error loading limits:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (expandedUser) {
      loadLimits(expandedUser);
    }
  }, [expandedUser]);

  const handleSaveLimit = async (userId: string, limitType: string) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminUserLimitsUpdate, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          limit_type: limitType,
          limit_value: editLimitValue,
        }),
      });
      if (data.success) {
        showToast('success', 'Лимит обновлен');
        await loadLimits(userId);
        setEditingLimit(null);
      } else {
        showToast('error', data.message || 'Не удалось обновить лимит');
      }
    } catch (error) {
      console.error('Error updating limit:', error);
      showToast('error', 'Ошибка при обновлении лимита');
    }
  };

  const filteredUsers = users.filter((user) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Всего пользователей: {users.length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по имени, username или Telegram ID..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userLimits = limits.filter((l) => l.userId === user.id);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName} {user.username && `(@${user.username})`}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>Telegram ID: {user.telegramId}</span>
                          <span>{user.chatsCount} чатов</span>
                          <span>{user.companiesCount} компаний</span>
                        </div>
                      </div>
                    </div>
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {expandedUser === user.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Лимиты пользователя:
                        </h4>
                        <div className="space-y-2">
                          {userLimits.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Нет установленных лимитов</p>
                          ) : (
                            userLimits.map((limit) => (
                              <div
                                key={limit.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg"
                              >
                                <div className="flex-1">
                                  <span className="text-sm text-gray-900 dark:text-white">{limit.limitType}</span>
                                  {editingLimit === limit.id ? (
                                    <div className="flex items-center space-x-2 mt-1">
                                      <input
                                        type="number"
                                        value={editLimitValue}
                                        onChange={(e) => setEditLimitValue(parseInt(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                      />
                                      <button
                                        onClick={() => handleSaveLimit(user.id, limit.limitType)}
                                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingLimit(null);
                                          setEditLimitValue(0);
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Лимит: {limit.limitValue} | Использовано: {limit.currentUsage}
                                    </div>
                                  )}
                                </div>
                                {editingLimit !== limit.id && (
                                  <button
                                    onClick={() => {
                                      setEditingLimit(limit.id);
                                      setEditLimitValue(limit.limitValue);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

