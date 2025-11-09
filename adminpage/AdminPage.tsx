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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 fixed inset-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm px-4 sm:px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Админ-панель
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Управление платформой Lumon</p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-5 py-3.5 text-sm font-medium transition-all duration-200 rounded-t-lg whitespace-nowrap
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/50'
                    }
                  `}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-full"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'companies' && (
              <motion.div
                key="companies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <CompaniesTab />
              </motion.div>
            )}
            {activeTab === 'legal' && (
              <motion.div
                key="legal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <LegalDocsTab />
              </motion.div>
            )}
            {activeTab === 'ai-docs' && (
              <motion.div
                key="ai-docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <AIDocumentsTab />
              </motion.div>
            )}
            {activeTab === 'backups' && (
              <motion.div
                key="backups"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <BackupsTab />
              </motion.div>
            )}
            {activeTab === 'health' && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <HealthChecksTab />
              </motion.div>
            )}
            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <LogsTab />
              </motion.div>
            )}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <UsersTab />
              </motion.div>
            )}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <AnalyticsTab />
              </motion.div>
            )}
            {activeTab === 'ab-testing' && (
              <motion.div
                key="ab-testing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
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

