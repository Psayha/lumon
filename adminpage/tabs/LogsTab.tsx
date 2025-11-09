import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { useToast } from '../components/Toast';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';

interface LogEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: any;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const { showToast } = useToast();

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      });
      if (filterAction) params.append('action', filterAction);

      const endpoint = `${ADMIN_API_CONFIG.endpoints.adminLogsList}?${params}`;
      const data = await adminApiRequest(endpoint);
      if (data.success && data.data) {
        setLogs(data.data);
        setTotal(data.pagination?.total || 0);
      } else {
        const errorMsg = data.message || 'Ошибка сервера: не удалось загрузить логи';
        showToast('error', errorMsg);
      }
    } catch (error: any) {
      showToast('error', error?.message || 'Ошибка при загрузке логов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, filterAction]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.user?.username?.toLowerCase().includes(query) ||
      log.ip?.toLowerCase().includes(query) ||
      JSON.stringify(log.metadata).toLowerCase().includes(query)
    );
  });

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const handleExport = () => {
    const csv = [
      ['ID', 'Action', 'Resource Type', 'User', 'IP', 'Created At'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.id,
          log.action,
          log.resourceType || '',
          log.user?.username || 'System',
          log.ip || '',
          new Date(log.createdAt).toLocaleString('ru-RU'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Логи экспортированы');
  };

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Логи системы</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Всего записей: {total}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Обновить</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по логам..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все действия</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Время
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ресурс
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Логи не найдены
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.user ? `${log.user.username} (${log.user.firstName} ${log.user.lastName})` : 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.resourceType ? `${log.resourceType}:${log.resourceId?.substring(0, 8)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.ip || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Показано {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} из {total}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                Назад
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Страница {currentPage} из {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
                disabled={currentPage >= Math.ceil(total / limit)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

