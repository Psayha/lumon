import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Plus, Edit, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  featureName: string;
  enabled: boolean;
  trafficPercentage: number;
  variantAConfig: any;
  variantBConfig: any;
  createdAt: string;
  updatedAt: string;
  variantAUsers: number;
  variantBUsers: number;
}

export const ABTestingTab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadExperiments = async () => {
    setIsLoading(true);
    try {
      const data = await adminApiRequest<Experiment[]>(ADMIN_API_CONFIG.endpoints.adminAbExperimentsList);
      if (data.success && data.data) {
        setExperiments(data.data);
      } else {
        showToast('error', data.message || 'Не удалось загрузить эксперименты');
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
      showToast('error', 'Ошибка при загрузке экспериментов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.adminAbExperimentUpdate, {
        method: 'POST',
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (data.success) {
        showToast('success', enabled ? 'Эксперимент отключен' : 'Эксперимент включен');
        await loadExperiments();
      } else {
        showToast('error', data.message || 'Не удалось обновить эксперимент');
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      showToast('error', 'Ошибка при обновлении эксперимента');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">A/B Тестирование</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление экспериментами
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Создать эксперимент</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experiments.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Нет экспериментов</p>
          </div>
        ) : (
          experiments.map((exp) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exp.name}</h3>
                  {exp.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exp.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleEnabled(exp.id, exp.enabled)}
                  className="ml-2"
                >
                  {exp.enabled ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Функция:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{exp.featureName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Трафик:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{exp.trafficPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Вариант A:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{exp.variantAUsers} пользователей</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Вариант B:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{exp.variantBUsers} пользователей</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

