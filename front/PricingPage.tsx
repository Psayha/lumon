import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Basic',
      price: '₽2,990',
      period: 'в месяц',
      description: 'Для малого бизнеса',
      features: [
        'До 5 пользователей',
        'Базовые CRM функции',
        'Email поддержка',
        '5GB хранилища',
        'Стандартные отчеты'
      ],
      color: 'bg-emerald-100 dark:bg-emerald-900/20',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      popular: false
    },
    {
      name: 'Pro',
      price: '₽9,990',
      period: 'в месяц',
      description: 'Для растущего бизнеса',
      features: [
        'До 50 пользователей',
        'Полная CRM автоматизация',
        'Приоритетная поддержка',
        '100GB хранилища',
        'Расширенная аналитика',
        'API интеграции',
        'AI-помощники'
      ],
      color: 'bg-blue-100 dark:bg-blue-900/20',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen gradient-bg relative flex flex-col">
      <AppHeader />
      
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 mb-2 sm:mb-4">
            Тарифные Планы
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Выберите подходящий план для вашего бизнеса
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`${plan.color} backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl p-8 lg:p-10 relative ${
                plan.popular ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut",
                delay: index * 0.2 
              }}
              whileHover={{ 
                scale: 1.02,
                y: -5
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Популярный</span>
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.6 + featureIndex * 0.1 
                    }}
                  >
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className={`w-full ${plan.buttonColor} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-5 h-5" />
                <span>Выбрать план</span>
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Нужен индивидуальный план?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Свяжитесь с нами для обсуждения корпоративного решения с персональными настройками
            </p>
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Связаться с нами
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* <AppFooter /> */}
    </div>
  );
};

export default PricingPage;
