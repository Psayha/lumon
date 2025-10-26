import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, X, Shield, Cookie, ChevronDown, ChevronUp } from 'lucide-react';

// Telegram WebApp detection
const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && (window as any).Telegram?.WebApp;
};

interface AgreementModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

interface Document {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);
  const [readDocuments, setReadDocuments] = useState<Set<string>>(new Set());

  const documents: Document[] = [
    {
      id: 'agreement',
      title: 'Пользовательское соглашение',
      icon: FileText,
      content: `
1. Общие положения
Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между пользователем (далее — «Пользователь») и сервисом PROJECT LUMON (далее — «Сервис») при использовании платформы для автоматизации бизнес-процессов.

2. Принятие условий
Используя Сервис, Пользователь подтверждает, что прочитал, понял и согласился соблюдать настоящее Соглашение. Если Пользователь не согласен с какими-либо условиями Соглашения, он не должен использовать Сервис.

3. Описание сервиса
PROJECT LUMON — это платформа для автоматизации бизнес-процессов с использованием искусственного интеллекта. Сервис предоставляет инструменты для создания AI-агентов, управления задачами, аналитики и интеграции с внешними системами.

4. Обязанности пользователя
Пользователь обязуется:
• Предоставлять достоверную информацию при регистрации
• Не использовать Сервис для незаконных целей
• Не нарушать права интеллектуальной собственности
• Соблюдать конфиденциальность данных других пользователей
• Не передавать свои учетные данные третьим лицам

5. Ограничение ответственности
Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу Сервиса и не несем ответственности за возможные сбои, потерю данных или ущерб, возникший в результате использования Сервиса.

6. Изменения в соглашении
Мы оставляем за собой право изменять настоящее Соглашение в любое время. Обновленная версия будет размещена на нашем сайте. Продолжение использования Сервиса после внесения изменений означает согласие с новыми условиями.

7. Контактная информация
По вопросам, связанным с настоящим Соглашением, вы можете обращаться по электронной почте: support@projectlumon.com
      `
    },
    {
      id: 'privacy',
      title: 'Политика конфиденциальности',
      icon: Shield,
      content: `
1. Сбор информации
Мы собираем информацию, которую вы предоставляете нам напрямую, а также информацию, которую мы получаем автоматически при использовании нашего сервиса.

2. Использование информации
Мы используем собранную информацию для:
• Предоставления и улучшения наших услуг
• Обработки транзакций
• Связи с вами
• Обеспечения безопасности

3. Защита данных
Мы применяем соответствующие технические и организационные меры для защиты ваших персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.

4. Передача данных третьим лицам
Мы не продаем, не обмениваем и не передаем ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.

5. Cookies
Мы используем файлы cookie для улучшения функциональности нашего сайта и анализа трафика. Вы можете отключить cookies в настройках вашего браузера.

6. Ваши права
Вы имеете право:
• Получать информацию о том, какие данные мы о вас храним
• Требовать исправления неточных данных
• Требовать удаления ваших данных
• Ограничить обработку ваших данных

7. Изменения в политике
Мы можем обновлять данную Политику конфиденциальности. Мы уведомим вас о любых изменениях, разместив новую Политику на этой странице.
      `
    },
    {
      id: 'cookies',
      title: 'Политика использования cookies',
      icon: Cookie,
      content: `
1. Что такое cookies
Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайта. Они помогают нам предоставлять вам лучший пользовательский опыт.

2. Типы cookies, которые мы используем
• Необходимые cookies — обеспечивают базовую функциональность сайта
• Аналитические cookies — помогают нам понять, как пользователи взаимодействуют с сайтом
• Функциональные cookies — запоминают ваши предпочтения
• Рекламные cookies — используются для показа релевантной рекламы

3. Управление cookies
Вы можете управлять cookies через настройки вашего браузера. Однако отключение некоторых cookies может повлиять на функциональность сайта.

4. Сторонние cookies
Мы можем использовать сторонние сервисы, которые устанавливают свои собственные cookies. Эти сервисы имеют свои собственные политики конфиденциальности.

5. Обновления политики
Мы можем обновлять данную Политику использования cookies. Продолжение использования нашего сайта после внесения изменений означает ваше согласие с обновленной политикой.

6. Контактная информация
Если у вас есть вопросы о нашей Политике использования cookies, свяжитесь с нами по адресу: privacy@projectlumon.com
      `
    }
  ];

  const handleDocumentToggle = (documentId: string) => {
    setExpandedDocument(expandedDocument === documentId ? null : documentId);
  };

  const handleDocumentRead = (documentId: string) => {
    setReadDocuments(prev => new Set([...prev, documentId]));
  };

  const allDocumentsRead = readDocuments.size === documents.length;
  const progress = (readDocuments.size / documents.length) * 100;

  // Блокируем скролл body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Для Telegram Mini App скрываем штатные кнопки
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram.WebApp;
        tg.BackButton.hide();
        tg.MainButton.hide();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем стили при размонтировании
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Юридические документы
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Пожалуйста, ознакомьтесь с условиями использования
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Прогресс чтения
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {readDocuments.size} из {documents.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-3">
              {documents.map((document) => {
                const isExpanded = expandedDocument === document.id;
                const isRead = readDocuments.has(document.id);
                const IconComponent = document.icon;

                return (
                  <div
                    key={document.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                  >
                    {/* Document Header */}
                    <button
                      onClick={() => handleDocumentToggle(document.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isRead 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            isRead 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            {document.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {isRead ? 'Прочитано' : 'Нажмите для чтения'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isRead && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Document Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                            <div 
                              className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto"
                              onScroll={(e) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
                                if (isAtBottom && !isRead) {
                                  handleDocumentRead(document.id);
                                }
                              }}
                            >
                              {document.content}
                            </div>
                            
                            {!isRead && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  Прокрутите до конца, чтобы отметить документ как прочитанный
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium text-xs sm:text-sm">
                <strong>Важно:</strong> Для принятия условий необходимо прочитать все документы. 
                Прогресс чтения отображается в верхней части окна.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onDecline}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Отклонить</span>
              </button>
              
              <button
                onClick={onAccept}
                disabled={!allDocumentsRead}
                className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  allDocumentsRead
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Принять все условия</span>
              </button>
            </div>
            
            {!allDocumentsRead && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Прочитайте все документы, чтобы принять условия
              </p>
            )}
          </div>

          {/* Footer with Back Button for TMA */}
          {isTelegramWebApp() && (
            <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-white/[0.05]">
              <button
                onClick={onDecline}
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
