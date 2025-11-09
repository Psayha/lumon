import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Building2, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { useToast } from '../components/Toast';

interface PlatformStats {
  totalUsers: number;
  activeUsers30d: number;
  activeUsers7d: number;
  totalCompanies: number;
  totalChats: number;
  totalMessages: number;
  newUsers30d: number;
  newCompanies30d: number;
  activeSessions: number;
}

export const AnalyticsTab: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/admin-stats-platform', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        showToast('error', data.message || 'Не удалось загрузить статистику');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      showToast('error', 'Ошибка при загрузке статистики');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Нет данных</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      change: stats.newUsers30d,
      changeLabel: 'новых за 30 дней',
    },
    {
      title: 'Активных (30 дней)',
      value: stats.activeUsers30d,
      icon: Activity,
      color: 'green',
      change: stats.activeUsers7d,
      changeLabel: 'активных за 7 дней',
    },
    {
      title: 'Всего компаний',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'purple',
      change: stats.newCompanies30d,
      changeLabel: 'новых за 30 дней',
    },
    {
      title: 'Всего чатов',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'indigo',
    },
    {
      title: 'Всего сообщений',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'pink',
    },
    {
      title: 'Активных сессий',
      value: stats.activeSessions,
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Аналитика платформы</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Статистика использования Lumon Platform
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            indigo: 'bg-indigo-500',
            pink: 'bg-pink-500',
            orange: 'bg-orange-500',
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{stat.title}</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value.toLocaleString('ru-RU')}</div>
              {stat.change !== undefined && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.change > 0 && '+'}
                  {stat.change} {stat.changeLabel}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Графики использования</h3>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Графики будут добавлены в следующей версии</p>
        </div>
      </div>
    </div>
  );
};

