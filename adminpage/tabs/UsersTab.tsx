import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Settings, Edit, Save, X, Trash2, Sliders, RefreshCw } from 'lucide-react';
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
  const [limitsModalUser, setLimitsModalUser] = useState<User | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<number>(100);
  const { showToast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUsersList}?${params}`;
      const data = await adminApiRequest<User[]>(endpoint);
      if (data.success && data.data) {
        setUsers(data.data);
      } else {
        const errorMsg = data.message || 'Ошибка сервера: не удалось загрузить пользователей';
        showToast('error', errorMsg);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке пользователей';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLimits = async (userId?: string) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminUserLimitsList}?${params}`;
      const data = await adminApiRequest<UserLimit[]>(endpoint);
      if (data.success && data.data) {
        setLimits(data.data);
      }
    } catch (error) {
      console.error('Failed to load limits:', error);
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
    } catch (_error) {
      showToast('error', 'Ошибка при обновлении лимита');
    }
  };

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

  const handleSetLimits = async (userId: string, limitValue: number) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminUserLimitsUpdate, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          limit_type: 'daily_requests',
          limit_value: limitValue,
        }),
      });
      if (data.success) {
        showToast('success', 'Лимиты обновлены');
        setLimitsModalUser(null);
        await loadUsers();
        if (expandedUser) {
          await loadLimits(expandedUser);
        }
      } else {
        showToast('error', data.message || 'Не удалось обновить лимиты');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при обновлении лимитов');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Всего пользователей: {users.length}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по имени, username или Telegram ID..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userLimits = limits.filter((l) => l.userId === user.id);
            const primaryRole = user.companies[0]?.role || 'viewer';
            return (
              <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0"><Users className="w-6 h-6 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName} {user.username && `(@${user.username})`}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>TG ID: {user.telegramId}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${primaryRole === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' : primaryRole === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}>{primaryRole}</span>
                          <span>{user.chatsCount} чатов</span>
                          <span>{user.companies.length > 0 ? `${user.companies.length} компаний` : 'Нет компании'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={(e) => { e.stopPropagation(); setLimitsModalUser(user); setNewLimitValue(userLimits.find(l => l.limitType === 'daily_requests')?.limitValue || 100); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Задать лимиты"><Sliders className="w-5 h-5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleClearHistory(user.id, user.username || user.firstName || 'пользователя'); }} className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Очистить историю"><RefreshCw className="w-5 h-5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id, user.username || user.firstName || 'пользователя'); }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Удалить пользователя"><Trash2 className="w-5 h-5" /></button>
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {expandedUser === user.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50">
                    <div className="p-4 space-y-4">
                      {user.companies.length > 0 && (<div><h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Компании:</h4><div className="space-y-2">{user.companies.map((company, idx) => (<div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg"><span className="text-sm text-gray-900 dark:text-white">ID: {company.company_id}</span><span className={`px-2 py-0.5 rounded text-xs font-semibold ${company.role === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' : company.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}>{company.role}</span></div>))}</div></div>)}
                      <div><h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Лимиты:</h4><div className="space-y-2">{userLimits.length === 0 ? (<p className="text-sm text-gray-500 dark:text-gray-400">Нет установленных лимитов</p>) : (userLimits.map((limit) => (<div key={limit.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg"><div className="flex-1"><span className="text-sm text-gray-900 dark:text-white">{limit.limitType}</span>{editingLimit === limit.id ? (<div className="flex items-center space-x-2 mt-1"><input type="number" value={editLimitValue} onChange={(e) => setEditLimitValue(parseInt(e.target.value) || 0)} className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white" /><button onClick={(e) => { e.stopPropagation(); handleSaveLimit(user.id, limit.limitType); }} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Save className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); setEditingLimit(null); setEditLimitValue(0); }} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X className="w-4 h-4" /></button></div>) : (<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Использовано: {limit.currentUsage} / {limit.limitValue}</div>)}</div>{editingLimit !== limit.id && (<button onClick={(e) => { e.stopPropagation(); setEditingLimit(limit.id); setEditLimitValue(limit.limitValue); }} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit className="w-4 h-4" /></button>)}</div>)))}</div></div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Limits Modal */}
      {limitsModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setLimitsModalUser(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Управление лимитами</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Пользователь: {limitsModalUser.firstName} {limitsModalUser.lastName} (@{limitsModalUser.username})</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Дневной лимит запросов</label>
              <input type="number" value={newLimitValue} onChange={(e) => setNewLimitValue(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" min="0" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Текущее использование: {limits.find(l => l.userId === limitsModalUser.id && l.limitType === 'daily_requests')?.currentUsage || 0} / {limits.find(l => l.userId === limitsModalUser.id && l.limitType === 'daily_requests')?.limitValue || 0}</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setLimitsModalUser(null)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Отмена</button>
              <button onClick={() => handleSetLimits(limitsModalUser.id, newLimitValue)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Сохранить</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

