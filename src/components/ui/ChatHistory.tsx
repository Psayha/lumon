import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Calendar, Trash2 } from 'lucide-react';

interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onCreateNewChat?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  onDeleteChat,
  onCreateNewChat
}) => {
  // Моковые данные для истории чатов
  const chatHistory: ChatHistoryItem[] = [
    {
      id: '1',
      title: 'Создание резюме',
      lastMessage: 'Помогите составить резюме для позиции...',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 минут назад
      messageCount: 12
    },
    {
      id: '2', 
      title: 'Анализ KPI',
      lastMessage: 'Какие метрики нужно отслеживать...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
      messageCount: 8
    },
    {
      id: '3',
      title: 'Скрипты продаж',
      lastMessage: 'Как улучшить конверсию в воронке...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
      messageCount: 15
    },
    {
      id: '4',
      title: 'Контроль качества',
      lastMessage: 'Процедуры проверки качества...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 дня назад
      messageCount: 6
    }
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} мин назад`;
    } else if (hours < 24) {
      return `${hours} ч назад`;
    } else {
      return `${days} дн назад`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-[60]"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={onClose}
          />
          
          {/* History Panel */}
          <motion.div
            className="fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 shadow-2xl z-[61] flex flex-col"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              opacity: { duration: 0.2 }
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                История чатов
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Закрыть историю"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {chatHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>История чатов пуста</p>
                </div>
              ) : (
                <div className="p-2">
                  {chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors mb-1"
                      onClick={() => onSelectChat(chat.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {chat.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {chat.lastMessage}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatTime(chat.timestamp)}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {chat.messageCount} сообщений
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                          aria-label="Удалить чат"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onCreateNewChat?.();
                  onClose();
                }}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Новый чат
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
