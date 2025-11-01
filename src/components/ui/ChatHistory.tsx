import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, Trash2 } from 'lucide-react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useTelegram } from '../../hooks/useTelegram';

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
  const { themeParams } = useTelegramTheme();
  const { tg, isReady } = useTelegram();
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

  // Haptic feedback при взаимодействии
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isReady && tg?.HapticFeedback) {
      try {
        tg.HapticFeedback.impactOccurred(style);
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
    }
  };

  // Обработчик выбора чата с haptic feedback
  const handleSelectChat = (chatId: string) => {
    triggerHaptic('medium');
    onSelectChat(chatId);
  };

  // Обработчик удаления чата с haptic feedback
  const handleDeleteChat = (chatId: string) => {
    triggerHaptic('heavy');
    onDeleteChat(chatId);
  };

  // Обработчик создания нового чата с haptic feedback
  const handleCreateNewChat = () => {
    triggerHaptic('light');
    onCreateNewChat?.();
    onClose();
  };

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
            className="fixed inset-0 backdrop-blur-md z-[60]"
            style={{
              backgroundColor: themeParams.bg_color 
                ? `${themeParams.bg_color}CC` 
                : 'rgba(0, 0, 0, 0.3)'
            }}
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
          />
          
          {/* History Panel */}
          <motion.div
            className="fixed left-0 top-0 h-full backdrop-blur-xl shadow-2xl z-[61] flex flex-col"
            style={{
              width: 'min(320px, 85vw)',
              backgroundColor: themeParams.secondary_bg_color || themeParams.bg_color || 'rgba(255, 255, 255, 0.95)',
              paddingTop: 'max(var(--safe-top, 0px), env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px))',
              paddingLeft: 'max(var(--safe-left, 0px), env(safe-area-inset-left, 0px))'
            }}
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
            {/* Header - Заголовок между системными кнопками */}
            <h2 
              className="text-lg font-semibold text-center fixed left-0 right-0 z-[62] pointer-events-none"
              style={{
                color: themeParams.text_color || '#000000',
                top: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)) + 2.5rem)',
                paddingLeft: 'max(var(--safe-left, 0px), env(safe-area-inset-left, 0px))',
                paddingRight: '1rem'
              }}
            >
              История чатов
            </h2>

            {/* Chat List */}
            <div 
              className="flex-1 overflow-y-auto chat-history-scroll"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingTop: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)) + 4.5rem)'
              }}
            >
              {chatHistory.length === 0 ? (
                <div 
                  className="p-4 text-center"
                  style={{
                    color: themeParams.hint_color || '#6B7280'
                  }}
                >
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>История чатов пуста</p>
                </div>
              ) : (
                <div className="p-2 pt-0">
                  {chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      className="group p-3 rounded-lg cursor-pointer transition-colors mb-1"
                      style={{
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeParams.secondary_bg_color || 'rgba(249, 250, 251, 1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => handleSelectChat(chat.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-medium truncate"
                            style={{
                              color: themeParams.text_color || '#000000'
                            }}
                          >
                            {chat.title}
                          </h3>
                          <p 
                            className="text-sm truncate mt-1"
                            style={{
                              color: themeParams.hint_color || '#6B7280'
                            }}
                          >
                            {chat.lastMessage}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div 
                              className="flex items-center gap-1 text-xs"
                              style={{
                                color: themeParams.hint_color || '#9CA3AF'
                              }}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatTime(chat.timestamp)}
                            </div>
                            <div 
                              className="text-xs"
                              style={{
                                color: themeParams.hint_color || '#9CA3AF'
                              }}
                            >
                              {chat.messageCount} сообщений
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                          style={{
                            color: '#DC2626'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(254, 242, 242, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          aria-label="Удалить чат"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="flex-shrink-0"
              style={{
                paddingTop: '1.5rem',
                paddingBottom: `calc(1rem + max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px)))`,
                paddingLeft: '1rem',
                paddingRight: '1rem'
              }}
            >
              <button
                onClick={handleCreateNewChat}
                className="w-full py-2 px-4 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: themeParams.button_color || '#2481cc',
                  color: themeParams.button_text_color || '#ffffff'
                }}
                onMouseEnter={(e) => {
                  const buttonColor = themeParams.button_color || '#2481cc';
                  // Небольшое затемнение при hover
                  const rgb = buttonColor.match(/\d+/g);
                  if (rgb) {
                    const r = Math.max(0, parseInt(rgb[0]) - 10);
                    const g = Math.max(0, parseInt(rgb[1]) - 10);
                    const b = Math.max(0, parseInt(rgb[2]) - 10);
                    e.currentTarget.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeParams.button_color || '#2481cc';
                }}
              >
                Новый чат
              </button>
              <p 
                className="text-xs text-center mt-2"
                style={{
                  color: themeParams.hint_color || '#9CA3AF'
                }}
              >
                История хранится 14 дней
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
