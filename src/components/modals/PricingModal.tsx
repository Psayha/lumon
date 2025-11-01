import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, Zap } from 'lucide-react';
import { isTelegramWebApp } from '../../hooks/useTelegram';

interface PricingModalProps {
  isOpen: boolean;
  onSelectPlan: (plan: 'basic' | 'pro') => void;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onSelectPlan,
  onClose
}) => {
  // Блокируем скролл body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App настраиваем кнопку "Назад" для закрытия модального окна
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram.WebApp;
        tg.MainButton.hide();
        
        // Показываем кнопку "Назад" и привязываем к закрытию модального окна
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          onClose();
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем стили при размонтировании
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const plans = [
    {
      id: 'basic' as const,
      name: 'Базовый',
      price: '0',
      period: 'месяц',
      description: 'Для небольших команд и личного использования',
      features: [
        'До 3 AI-агентов',
        'Базовые шаблоны автоматизации',
        'До 100 задач в месяц',
        'Email поддержка',
        'Мобильное приложение',
        'Базовая аналитика'
      ],
      limitations: [
        'Без интеграции с CRM',
        'Ограниченная кастомизация',
        'Стандартные шаблоны'
      ],
      popular: false,
      color: 'blue'
    },
    {
      id: 'pro' as const,
      name: 'Профессиональный',
      price: '29',
      period: 'месяц',
      description: 'Для растущих компаний с полным функционалом',
      features: [
        'Неограниченное количество AI-агентов',
        'Полная кастомизация процессов',
        'Неограниченные задачи',
        'Приоритетная поддержка 24/7',
        'Интеграция с CRM системами',
        'Расширенная аналитика и отчеты',
        'API доступ',
        'Командная работа',
        'Продвинутые шаблоны',
        'Экспорт данных'
      ],
      limitations: [],
      popular: true,
      color: 'purple'
    }
  ];

  const handleSelectPlan = (planId: 'basic' | 'pro') => {
    onSelectPlan(planId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Выберите тарифный план
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Начните с бесплатного плана или сразу получите полный доступ
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-4 sm:p-6 transition-all duration-200 ${
                    plan.popular
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>Популярный</span>
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 ml-1">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      Что включено:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mt-4">
                          Ограничения:
                        </h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {limitation}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {plan.price === '0' ? 'Начать бесплатно' : 'Выбрать план'}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Все планы включают 14-дневную бесплатную пробную версию. 
                Вы можете изменить или отменить подписку в любое время.
              </p>
            </div>
          </div>

          {/* Footer with Back Button for TMA */}
          {isTelegramWebApp() && (
            <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-white/[0.05]">
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Назад
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
