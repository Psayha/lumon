import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, HardDrive, Clock } from 'lucide-react';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';
import { useToast } from '../components/Toast';

interface Backup {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  created_at: string;
  status: string;
}

export const BackupsTab: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const data = await adminApiRequest<Backup[]>(ADMIN_API_CONFIG.endpoints.backupList);
      if (data.success && data.data) {
        setBackups(data.data);
      } else {
        const errorMsg = data.message || 'Не удалось загрузить бэкапы';
        showToast('error', errorMsg);
      }
    } catch (error: any) {
      showToast('error', error?.message || 'Ошибка при загрузке бэкапов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.backupCreate, {
        method: 'POST',
      });
      if (data.success) {
        await loadBackups();
        alert('Бэкап создан успешно');
      } else {
        alert(`Ошибка: ${data.message || 'Не удалось создать бэкап'}`);
      }
    } catch (error) {
      alert('Ошибка при создании бэкапа');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backupId: string, filePath: string) => {
    if (!confirm('ВНИМАНИЕ: Это действие перезапишет текущую базу данных. Продолжить?')) {
      return;
    }
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.backupRestore, {
        method: 'POST',
        body: JSON.stringify({ backup_id: backupId, file_path: filePath }),
      });
      if (data.success) {
        alert('Бэкап восстановлен успешно');
      } else {
        alert(`Ошибка: ${data.message || 'Не удалось восстановить бэкап'}`);
      }
    } catch (error) {
      alert('Ошибка при восстановлении бэкапа');
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm('Удалить этот бэкап?')) {
      return;
    }
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.backupDelete, {
        method: 'POST',
        body: JSON.stringify({ backup_id: backupId }),
      });
      if (data.success) {
        await loadBackups();
        alert('Бэкап удален');
      } else {
        alert(`Ошибка: ${data.message || 'Не удалось удалить бэкап'}`);
      }
    } catch (error) {
      alert('Ошибка при удалении бэкапа');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Бэкапы базы данных</h2>
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Создание...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Создать бэкап
            </>
          )}
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <HardDrive className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Нет бэкапов</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Файл
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Размер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {backup.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(backup.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(backup.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      backup.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : backup.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleRestore(backup.id, backup.file_path)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Восстановить
                      </button>
                      <button
                        onClick={() => handleDelete(backup.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
      )}
    </div>
  );
};

