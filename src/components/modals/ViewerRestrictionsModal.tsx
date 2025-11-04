import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lock, Building2, ArrowRight } from 'lucide-react';
import { isTelegramWebApp } from '../../hooks/useTelegram';

interface ViewerRestrictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectCompany?: () => void;
}

export const ViewerRestrictionsModal: React.FC<ViewerRestrictionsModalProps> = ({
  isOpen,
  onClose,
  onConnectCompany
}) => {
  // Блокируем скролл body когда модальное окно открыто
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App настраиваем кнопку "Назад"
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.MainButton.hide();
          tg.BackButton.show();
          tg.BackButton.onClick(() => {
            onClose();
          });
        }
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-2 sm:mx-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Ограниченный доступ
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Ваша роль: <span className="font-medium">Только просмотр</span>
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Внимание:</strong> У вас ограниченный доступ. Для использования всех функций необходимо подключить компанию.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Что доступно:
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Голосовой ассистент</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        3 генерации в сутки
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Просмотр меню</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Доступ ко всем разделам
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Что недоступно:
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Внутренние страницы</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        CRM, Аналитика, База знаний недоступны
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Загрузка документов</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Недоступна для роли viewer
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Неограниченные генерации</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Только 3 генерации в сутки
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {onConnectCompany && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                    <strong>Хотите полный доступ?</strong> Подключите компанию и получите все возможности!
                  </p>
                  <button
                    onClick={onConnectCompany}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Подключить компанию</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Понятно
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

