import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, BookOpen, Download } from 'lucide-react';
import { AppHeader } from '../src/components/AppHeader';
import { AppFooter } from '../src/components/AppFooter';

const KnowledgeBasePage: React.FC = () => {
  const knowledgeFeatures = [
    {
      icon: FileText,
      title: 'Централизованное хранение',
      description: 'Все документы, инструкции и материалы в одном месте',
      color: 'bg-pink-100 dark:bg-pink-900/20',
      iconColor: 'text-pink-600 dark:text-pink-400'
    },
    {
      icon: Search,
      title: 'Умный поиск',
      description: 'AI-поиск по содержимому документов и семантический анализ',
      color: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: BookOpen,
      title: 'Интерактивные руководства',
      description: 'Пошаговые инструкции и обучающие материалы',
      color: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: Download,
      title: 'Экспорт и интеграция',
      description: 'Выгрузка данных и интеграция с внешними системами',
      color: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="min-h-screen gradient-bg relative flex flex-col">
      <AppHeader />
      
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-red-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 dark:from-pink-400 dark:via-rose-400 dark:to-red-400 mb-2 sm:mb-4">
            База Знаний
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Централизованное хранилище всех знаний и документов вашей компании
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {knowledgeFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -5
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative backdrop-blur-xl bg-white/80 dark:bg-white/[0.02] rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/[0.05] p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Document Categories */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
        >
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-white/[0.02] rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/[0.05] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Категории документов
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: 'Политики и процедуры', count: '24 документа', color: 'bg-blue-50 dark:bg-blue-900/20' },
                { title: 'Техническая документация', count: '156 документов', color: 'bg-green-50 dark:bg-green-900/20' },
                { title: 'Обучающие материалы', count: '89 документов', color: 'bg-purple-50 dark:bg-purple-900/20' }
              ].map((category, index) => (
                <motion.div
                  key={category.title}
                  className={`${category.color} rounded-xl p-4 sm:p-6 border border-gray-200/50 dark:border-white/[0.05]`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {category.count}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Отступ от подвала */}
        <div className="pb-4"></div>
      </div>

      <AppFooter showHomeButton={true} />
    </div>
  );
};

export default KnowledgeBasePage;
