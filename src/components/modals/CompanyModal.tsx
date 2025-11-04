import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Clock, ArrowRight } from 'lucide-react';
import { isTelegramWebApp } from '../../hooks/useTelegram';
import { getApiUrl, getDefaultHeaders } from '../../config/api';

interface CompanyModalProps {
  isOpen: boolean;
  onConnectCompany: () => void; // Создатель компании → роль owner
  onLater: () => void; // Пропустить → роль viewer
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onConnectCompany,
  onLater
}) => {
  const [isSettingViewerRole, setIsSettingViewerRole] = useState(false);

  const handleLater = async () => {
    try {
      setIsSettingViewerRole(true);
      
      // Устанавливаем роль viewer через API (ограниченный доступ, только просмотр)
      // Создатель компании получает роль owner через onConnectCompany
      const token = localStorage.getItem('session_token');
      if (!token) {
        console.warn('[CompanyModal] Нет session_token, пропускаем установку роли');
        onLater();
        return;
      }

      const response = await fetch(getApiUrl('/webhook/auth-set-viewer-role'), {
        method: 'POST',
        headers: getDefaultHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Обновляем user_context с новой ролью
        if (data.success && data.data) {
          const currentContext = localStorage.getItem('user_context');
          if (currentContext) {
            const context = JSON.parse(currentContext);
            context.role = 'viewer';
            localStorage.setItem('user_context', JSON.stringify(context));
          }
        }
        
        console.log('[CompanyModal] Роль viewer установлена успешно');
      } else {
        console.error('[CompanyModal] Ошибка установки роли viewer:', response.status);
      }
    } catch (error) {
      console.error('[CompanyModal] Ошибка при установке роли viewer:', error);
    } finally {
      setIsSettingViewerRole(false);
      onLater();
    }
  };

  // Блокируем скролл body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App настраиваем кнопку "Назад" для закрытия модального окна
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram.WebApp;
        tg.MainButton.hide();
        
        // Показываем кнопку "Назад" и привязываем к handleLater
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          handleLater();
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем стили при размонтировании
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onLater]);

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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Подключение компании
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Настройте вашу организацию для работы с PROJECT LUMON
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Готовы начать работу?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Подключите вашу компанию и станьте её владельцем с полным доступом
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Командная работа</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Пригласите коллег как менеджеров и настройте роли доступа
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Централизованное управление</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Управляйте всеми процессами из единого интерфейса
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Аналитика и отчеты</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Отслеживайте эффективность работы команды
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
                  <strong>Совет:</strong> Вы можете подключить компанию позже в настройках, 
                  но это займет всего 2 минуты!
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLater}
                disabled={isSettingViewerRole}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>{isSettingViewerRole ? 'Сохранение...' : 'Позже'}</span>
              </button>
              
              <button
                onClick={onConnectCompany}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                title="Вы станете владельцем (owner) компании"
              >
                <span>Подключить компанию</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer with Back Button for TMA */}
          {isTelegramWebApp() && (
            <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-white/[0.05]">
              <button
                onClick={handleLater}
                disabled={isSettingViewerRole}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettingViewerRole ? 'Сохранение...' : 'Назад'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
