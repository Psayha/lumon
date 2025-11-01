import React from 'react';
import { Send, Smartphone } from 'lucide-react';

const TelegramOnlyPage: React.FC = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 text-center">
        {/* Иконка */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
          <Send className="w-12 h-12 text-white" />
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Lumon
        </h1>

        {/* Подзаголовок */}
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
          Приложение доступно только через Telegram
        </h2>

        {/* Описание */}
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Для использования Lumon откройте приложение в Telegram Mini App.
          Это обеспечивает безопасность и интеграцию с платформой Telegram.
        </p>

        {/* Инструкции */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              1
            </div>
            <div className="text-left">
              <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">
                Откройте Telegram на вашем устройстве
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Используйте мобильное приложение или веб-версию
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              2
            </div>
            <div className="text-left">
              <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">
                Найдите бота Lumon
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Используйте поиск или перейдите по ссылке бота
              </p>
            </div>
          </div>
        </div>

        {/* Иконка смартфона */}
        <div className="flex justify-center mb-6">
          <Smartphone className="w-16 h-16 text-blue-500 dark:text-blue-400 opacity-50" />
        </div>

        {/* Дополнительная информация */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Приложение оптимизировано для работы внутри Telegram Mini App
        </p>
      </div>
    </div>
  );
};

export default TelegramOnlyPage;

