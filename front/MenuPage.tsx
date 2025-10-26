import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  FileText, 
  CreditCard,
  Users,
  Settings,
  Brain,
  Bot
} from 'lucide-react';
import { Card } from '../src/components';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { Header } from '../src/components/Header';

const MenuPage: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    { title: 'Оркестратор', description: 'Автоматизация бизнес-процессов', icon: Brain, path: '/app/orchestrator', bgColor: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
    { title: 'Агенты', description: 'AI-помощники для задач', icon: Bot, path: '/app/agents', bgColor: 'bg-purple-100 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
    { title: 'Менеджеры', description: 'Управление командой', icon: Users, path: '/app/managers', bgColor: 'bg-green-100 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400' },
    { title: 'CRM', description: 'Интеграции с системами', icon: MessageSquare, path: '/app/crm', bgColor: 'bg-orange-100 dark:bg-orange-900/20', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Аналитика', description: 'Отчеты и метрики', icon: BarChart3, path: '/app/analytics', bgColor: 'bg-indigo-100 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { title: 'База знаний', description: 'Документы и материалы', icon: FileText, path: '/app/knowledge', bgColor: 'bg-pink-100 dark:bg-pink-900/20', iconColor: 'text-pink-600 dark:text-pink-400' },
    { title: 'Тарифы', description: 'Управление подпиской', icon: CreditCard, path: '/app/payment', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Настройки', description: 'Конфигурация системы', icon: Settings, path: '/app/settings', bgColor: 'bg-gray-100 dark:bg-gray-800/20', iconColor: 'text-gray-600 dark:text-gray-400' }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {menuItems.map((item, index) => (
            <Card
              key={index}
              variant="elevated"
              padding="md"
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 backdrop-blur-sm h-full"
            >
              <div
                onClick={() => handleItemClick(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item.path);
                  }
                }}
                aria-label={`Перейти к ${item.title}`}
                className="flex flex-col items-center text-center h-full p-4 sm:p-6"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${item.bgColor} rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300 shadow-md`}>
                  <item.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.iconColor} transition-colors duration-300`} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-300">
            {/* Theme Toggle */}
            <div className="flex justify-center mb-4">
              <ThemeToggle />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
              © 2024 Lumon Platform. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
