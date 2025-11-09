import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, Database, LogOut, Shield, HardDrive, Activity, FileSearch, Users, BarChart3, FlaskConical } from 'lucide-react';
import { AdminLogin } from './components/AdminLogin';
import { ToastProvider } from './components/Toast';
import { CompaniesTab } from './tabs/CompaniesTab';
import { LegalDocsTab } from './tabs/LegalDocsTab';
import { AIDocumentsTab } from './tabs/AIDocumentsTab';
import { BackupsTab } from './tabs/BackupsTab';
import { HealthChecksTab } from './tabs/HealthChecksTab';
import { LogsTab } from './tabs/LogsTab';
import { UsersTab } from './tabs/UsersTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { ABTestingTab } from './tabs/ABTestingTab';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'companies' | 'legal' | 'ai-docs' | 'backups' | 'health' | 'logs' | 'users' | 'analytics' | 'ab-testing'>('companies');

  // Проверка авторизации при загрузке
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  // Фиксируем страницу
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'companies' as const, label: 'Компании', icon: Building2 },
    { id: 'legal' as const, label: 'Юр документы', icon: FileText },
    { id: 'ai-docs' as const, label: 'Документы для ИИ', icon: Database },
    { id: 'backups' as const, label: 'Бэкапы', icon: HardDrive },
    { id: 'health' as const, label: 'Health Checks', icon: Activity },
    { id: 'logs' as const, label: 'Логи', icon: FileSearch },
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'analytics' as const, label: 'Аналитика', icon: BarChart3 },
    { id: 'ab-testing' as const, label: 'A/B Тесты', icon: FlaskConical },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 fixed inset-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Админ-панель</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Управление платформой Lumon</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-6 py-3 text-sm font-medium transition-colors
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            {activeTab === 'companies' && (
              <motion.div
                key="companies"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CompaniesTab />
              </motion.div>
            )}
            {activeTab === 'legal' && (
              <motion.div
                key="legal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <LegalDocsTab />
              </motion.div>
            )}
            {activeTab === 'ai-docs' && (
              <motion.div
                key="ai-docs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AIDocumentsTab />
              </motion.div>
            )}
            {activeTab === 'backups' && (
              <motion.div
                key="backups"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BackupsTab />
              </motion.div>
            )}
            {activeTab === 'health' && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <HealthChecksTab />
              </motion.div>
            )}
            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <LogsTab />
              </motion.div>
            )}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <UsersTab />
              </motion.div>
            )}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AnalyticsTab />
              </motion.div>
            )}
            {activeTab === 'ab-testing' && (
              <motion.div
                key="ab-testing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ABTestingTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
};

export default AdminPage;

