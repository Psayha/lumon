import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Server, Cpu, HardDrive, MemoryStick, TrendingUp } from 'lucide-react';
import { useToast } from '../components/Toast';
import { adminApiRequest, ADMIN_API_CONFIG } from '../config/api';

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

interface HealthCheckResponse {
  system_status?: SystemStatus;
  health_checks?: HealthCheck[];
  system_metrics?: SystemMetrics;
}

export const HealthChecksTab: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { showToast } = useToast();

  const loadHealthChecks = async () => {
    _setIsLoading(true);
    try {
      const data = await adminApiRequest<HealthCheckResponse>(ADMIN_API_CONFIG.endpoints.healthCheckList);
      if (data.success && data.data) {
        if (data.data.system_status) {
          setSystemStatus(data.data.system_status);
        }
        if (Array.isArray(data.data.health_checks)) {
          setHealthChecks(data.data.health_checks);
        } else if (data.data.health_checks) {
             console.error('Expected array for health_checks but got:', data.data.health_checks);
             setHealthChecks([]);
        }
      } else {
        showToast('error', data.message || 'Не удалось загрузить health checks');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при загрузке health checks');
    } finally {
      _setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthChecks();
  }, []);

  const handleCheckAll = async () => {
    setIsChecking(true);
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.healthCheck, {
        method: 'POST',
        body: JSON.stringify({ service: 'all' }),
      });
      if (data.success) {
        await loadHealthChecks();
        showToast('success', 'Проверка завершена');
      } else {
        showToast('error', data.message || 'Не удалось выполнить проверку');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при проверке здоровья системы');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckService = async (serviceName: string) => {
    try {
      const data = await adminApiRequest(ADMIN_API_CONFIG.endpoints.healthCheck, {
        method: 'POST',
        body: JSON.stringify({ service: serviceName }),
      });
      if (data.success) {
        await loadHealthChecks();
        showToast('success', `Проверка ${serviceName} завершена`);
      } else {
        showToast('error', data.message || 'Не удалось выполнить проверку');
      }
    } catch (_error) {
      showToast('error', 'Ошибка при проверке сервиса');
    }
  };

  // Получить историю метрик для графиков
  const getMetricsHistory = () => {
    const systemChecks = healthChecks
      .filter((check) => check.service_name === 'system' && check.metrics)
      .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
      .slice(-20); // Последние 20 проверок

    return {
      cpu: systemChecks.map((check) => ({
        value: check.metrics?.cpu_usage_percent || 0,
        time: new Date(check.checked_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      })),
      memory: systemChecks.map((check) => ({
        value: check.metrics?.memory_usage_percent || 0,
        time: new Date(check.checked_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      })),
      disk: systemChecks.map((check) => ({
        value: check.metrics?.disk_usage_percent || 0,
        time: new Date(check.checked_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      })),
    };
  };

  const metricsHistory = getMetricsHistory();

  const renderChart = (data: Array<{ value: number; time: string }>, color: string, label: string) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.value), 100);
    const chartHeight = 100;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <svg width="100%" height={chartHeight} className="overflow-visible">
            <polyline
              points={data
                .map((d, i) => {
                  const x = (i / (data.length - 1 || 1)) * 100;
                  const y = chartHeight - (d.value / maxValue) * chartHeight;
                  return `${x}%,${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * 100;
              const y = chartHeight - (d.value / maxValue) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={y}
                  r="3"
                  fill={color}
                  className="hover:r-4 transition-all"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{data[0]?.time}</span>
            <span>{data[data.length - 1]?.time}</span>
          </div>
        </div>
      </div>
    );
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

      {/* Графики метрик */}
      {metricsHistory.cpu.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">История метрик</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderChart(metricsHistory.cpu, '#3b82f6', 'CPU')}
            {renderChart(metricsHistory.memory, '#a855f7', 'Память')}
            {renderChart(metricsHistory.disk, '#10b981', 'Диск')}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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

