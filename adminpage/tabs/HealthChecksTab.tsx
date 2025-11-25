import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Server, Cpu, HardDrive, MemoryStick, Database, Terminal } from 'lucide-react';
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

interface DatabaseTable {
  schema: string;
  table_name: string;
  row_count: string;
  total_size: string;
}

interface LogEntry {
  timestamp: string;
  level?: string;
  message: string;
  context?: string;
  [key: string]: any;
}

interface HealthCheckResponse {
  system_status?: {
    overall_status: string;
    services_status: Record<string, string>;
    last_checked_at: string;
    system_metrics?: SystemMetrics;
  };
  database_stats?: {
    tables: DatabaseTable[];
    total_size: string;
  };
  recent_logs?: LogEntry[];
}

export const HealthChecksTab: React.FC = () => {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { showToast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadHealthChecks = async () => {
    setIsLoading(true);
    try {
      const response = await adminApiRequest<HealthCheckResponse>(ADMIN_API_CONFIG.endpoints.healthCheckList);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        showToast('error', response.message || 'Не удалось загрузить данные');
      }
    } catch (error) {
      showToast('error', 'Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthChecks();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll logs to bottom on update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.recent_logs]);

  const handleCheckAll = async () => {
    setIsChecking(true);
    try {
      const response = await adminApiRequest(ADMIN_API_CONFIG.endpoints.healthCheck, {
        method: 'POST',
        body: JSON.stringify({ service: 'all' }),
      });
      if (response.success) {
        await loadHealthChecks();
        showToast('success', 'Проверка завершена');
      } else {
        showToast('error', response.message || 'Не удалось выполнить проверку');
      }
    } catch (error) {
      showToast('error', 'Ошибка при проверке здоровья системы');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'unhealthy': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const metrics = data?.system_status?.system_metrics;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Health & Monitoring</h2>
        <button
          onClick={handleCheckAll}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isChecking ? 'Checking...' : 'Refresh All'}
        </button>
      </div>

      {/* System Status & Metrics */}
      {data?.system_status && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Status
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.system_status.overall_status)}`}>
              {data.system_status.overall_status.toUpperCase()}
            </span>
          </div>

          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Usage</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.cpu_usage_percent.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${metrics.cpu_usage_percent > 80 ? 'bg-red-500' : metrics.cpu_usage_percent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(metrics.cpu_usage_percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.memory_usage_percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.memory_used_mb} MB / {metrics.memory_total_mb} MB
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${metrics.memory_usage_percent > 80 ? 'bg-red-500' : metrics.memory_usage_percent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(metrics.memory_usage_percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Disk */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disk</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.disk_usage_percent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.disk_used_gb} GB / {metrics.disk_total_gb} GB
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${metrics.disk_usage_percent > 80 ? 'bg-red-500' : metrics.disk_usage_percent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(metrics.disk_usage_percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {Object.entries(data.system_status.services_status).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{service}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(status)}`}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Statistics */}
        {data?.database_stats && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Statistics
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Size: {data.database_stats.total_size}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2">Table</th>
                    <th className="px-4 py-2 text-right">Rows</th>
                    <th className="px-4 py-2 text-right">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {data.database_stats.tables.slice(0, 10).map((table) => (
                    <tr key={table.table_name} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{table.table_name}</td>
                      <td className="px-4 py-2 text-right">{parseInt(table.row_count).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{table.total_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.database_stats.tables.length > 10 && (
                <div className="text-center mt-2 text-xs text-gray-500">
                  Showing top 10 of {data.database_stats.tables.length} tables
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Logs */}
        {data?.recent_logs && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Live System Logs
              </h3>
              <span className="text-xs text-gray-500">Last 50 lines</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-1">
              {data.recent_logs.length === 0 ? (
                <div className="text-gray-500 italic">No logs available</div>
              ) : (
                data.recent_logs.map((log, index) => (
                  <div key={index} className="break-all hover:bg-gray-800 p-0.5 rounded">
                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                      {log.level?.toUpperCase() || 'INFO'}
                    </span>{' '}
                    <span className="text-white">{log.message}</span>
                    {log.context && <span className="text-purple-400 ml-2">({log.context})</span>}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
