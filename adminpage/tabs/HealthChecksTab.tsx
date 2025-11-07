import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface SystemMetrics {
  cpu_usage_percent: number;
  memory_total_mb: number;
  memory_used_mb: number;
  memory_available_mb: number;
  memory_usage_percent: number;
  disk_total_gb: number;
  disk_used_gb: number;
  disk_available_gb: number;
  disk_usage_percent: number;
}

interface HealthCheck {
  service_name: string;
  status: string;
  response_time_ms?: number;
  error_message?: string;
  checked_at: string;
  metrics?: SystemMetrics;
}

interface SystemStatus {
  overall_status: string;
  services_status: Record<string, string>;
  last_checked_at: string;
  system_metrics?: SystemMetrics;
}

export const HealthChecksTab: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const loadHealthChecks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/health-check-list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        if (data.data.system_status) {
          setSystemStatus(data.data.system_status);
        }
        if (data.data.health_checks) {
          setHealthChecks(data.data.health_checks);
        }
      }
    } catch (error) {
      console.error('Error loading health checks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthChecks();
  }, []);

  const handleCheckAll = async () => {
    setIsChecking(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/health-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: 'all' }),
      });
      const data = await response.json();
      if (data.success) {
        await loadHealthChecks();
        alert('Проверка завершена');
      } else {
        alert(`Ошибка: ${data.message || 'Не удалось выполнить проверку'}`);
      }
    } catch (error) {
      console.error('Error checking health:', error);
      alert('Ошибка при проверке здоровья системы');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckService = async (serviceName: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://n8n.psayha.ru/webhook/health-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: serviceName }),
      });
      const data = await response.json();
      if (data.success) {
        await loadHealthChecks();
      } else {
        alert(`Ошибка: ${data.message || 'Не удалось выполнить проверку'}`);
      }
    } catch (error) {
      console.error('Error checking service:', error);
      alert('Ошибка при проверке сервиса');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const services = ['n8n', 'postgresql', 'nginx', 'supabase-studio'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Health Checks</h2>
        <button
          onClick={handleCheckAll}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Проверка...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Проверить все
            </>
          )}
        </button>
      </div>

      {systemStatus && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              Общий статус системы
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus.overall_status)}`}>
              {systemStatus.overall_status}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Последняя проверка: {new Date(systemStatus.last_checked_at).toLocaleString('ru-RU')}
          </p>
          
          {systemStatus.system_metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* CPU */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStatus.system_metrics.cpu_usage_percent.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      systemStatus.system_metrics.cpu_usage_percent > 80
                        ? 'bg-red-500'
                        : systemStatus.system_metrics.cpu_usage_percent > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(systemStatus.system_metrics.cpu_usage_percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Память</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStatus.system_metrics.memory_usage_percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {systemStatus.system_metrics.memory_used_mb} MB / {systemStatus.system_metrics.memory_total_mb} MB
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      systemStatus.system_metrics.memory_usage_percent > 80
                        ? 'bg-red-500'
                        : systemStatus.system_metrics.memory_usage_percent > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(systemStatus.system_metrics.memory_usage_percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Disk */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Диск</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStatus.system_metrics.disk_usage_percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {systemStatus.system_metrics.disk_used_gb} GB / {systemStatus.system_metrics.disk_total_gb} GB
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      systemStatus.system_metrics.disk_usage_percent > 80
                        ? 'bg-red-500'
                        : systemStatus.system_metrics.disk_usage_percent > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(systemStatus.system_metrics.disk_usage_percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const serviceStatus = systemStatus?.services_status[service] || 'unknown';
          const latestCheck = healthChecks
            .filter((check) => check.service_name === service)
            .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0];

          return (
            <div
              key={service}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {service}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(serviceStatus)}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(serviceStatus)}`}>
                    {serviceStatus}
                  </span>
                </div>
              </div>
              {latestCheck && (
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {latestCheck.response_time_ms && (
                    <p>Время ответа: {latestCheck.response_time_ms} мс</p>
                  )}
                  {latestCheck.error_message && (
                    <p className="text-red-600 dark:text-red-400">
                      Ошибка: {latestCheck.error_message}
                    </p>
                  )}
                  <p className="text-xs">
                    Проверено: {new Date(latestCheck.checked_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              )}
              <button
                onClick={() => handleCheckService(service)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Проверить
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

