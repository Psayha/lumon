import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, LogOut, Shield, HardDrive, Activity, FileSearch, Users, BarChart3, Menu, X, Bot } from 'lucide-react';
import { AdminLogin } from './components/AdminLogin';
import { ToastProvider } from './components/Toast';
import { getAdminApiUrl, ADMIN_API_CONFIG } from './config/api';
import { CompaniesTab } from './tabs/CompaniesTab';
// Hidden tabs - stub endpoints not yet migrated from n8n:
// import { LegalDocsTab } from './tabs/LegalDocsTab';
// import { AIDocumentsTab } from './tabs/AIDocumentsTab';
import { BackupsTab } from './tabs/BackupsTab';
import { HealthChecksTab } from './tabs/HealthChecksTab';
import { LogsTab } from './tabs/LogsTab';
import { UsersTab } from './tabs/UsersTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
// import { ABTestingTab } from './tabs/ABTestingTab';
import { AgentsTab } from './tabs/agents/AgentsTab';
import { KnowledgeBaseTab } from './tabs/knowledge-base/KnowledgeBaseTab';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'companies' | 'backups' | 'health' | 'logs' | 'users' | 'analytics' | 'ab-testing' | 'agents' | 'knowledge-base'>('companies');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication on load by validating cookie with backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(getAdminApiUrl(ADMIN_API_CONFIG.endpoints.adminValidate), {
          method: 'POST',
          credentials: 'include', // Send httpOnly cookie
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    // Cookie was set by backend during login
    // Just update UI state
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch(getAdminApiUrl(ADMIN_API_CONFIG.endpoints.adminLogout), {
        method: 'POST',
        credentials: 'include', // Send cookie to invalidate session
      });
    } catch {
      // Ignore errors - we'll clear UI state anyway
    }
    setIsAuthenticated(false);
  };

  // Определение и применение системной темы
  useEffect(() => {
    const applySystemTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Применяем тему при загрузке
    applySystemTheme();

    // Отслеживаем изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Современный способ подписки на изменения
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => {
        mediaQuery.removeEventListener('change', handleThemeChange);
      };
    } else {
      // Fallback для старых браузеров
      mediaQuery.addListener(handleThemeChange);
      return () => {
        mediaQuery.removeListener(handleThemeChange);
      };
    }
  }, []);

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
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'companies' as const, label: 'Компании', icon: Building2 },
    { id: 'agents' as const, label: 'AI Agents', icon: Bot },
    { id: 'knowledge-base' as const, label: 'База Знаний', icon: FileSearch },
    { id: 'logs' as const, label: 'Логи', icon: ScrollText },
    { id: 'health' as const, label: 'Здоровье системы', icon: Activity },
    { id: 'analytics' as const, label: 'Аналитика', icon: BarChart3 },
    { id: 'backups' as const, label: 'База данных', icon: Database },
    // { id: 'ab-testing' as const, label: 'A/B Тестирование', icon: FlaskConical },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white dark:bg-slate-950 fixed inset-0 overflow-hidden flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? '256px' : '64px' }}
          className="bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full transition-all duration-200"
        >
          {/* Sidebar Header */}
          <div className="h-16 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Lumon Admin</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Панель управления</p>
                </div>
              </motion.div>
            )}
            {!sidebarOpen && (
              <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150
                    ${isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : ''}`} />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 dark:border-slate-800 p-4">
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white transition-all duration-150"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium"
                >
                  Выйти
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 scrollbar-thin">
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'companies' && (
                  <motion.div
                    key="companies"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CompaniesTab />
                  </motion.div>
                )}
                {activeTab === 'agents' && (
                  <motion.div
                    key="agents"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AgentsTab />
                  </motion.div>
                )}
                {activeTab === 'knowledge-base' && (
                  <motion.div
                    key="knowledge-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KnowledgeBaseTab />
                  </motion.div>
                )}
                {activeTab === 'backups' && (
                  <motion.div
                    key="backups"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BackupsTab />
                  </motion.div>
                )}
                {activeTab === 'health' && (
                  <motion.div
                    key="health"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HealthChecksTab />
                  </motion.div>
                )}
                {activeTab === 'logs' && (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LogsTab />
                  </motion.div>
                )}
                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UsersTab />
                  </motion.div>
                )}
                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnalyticsTab />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AdminPage;

