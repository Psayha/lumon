import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useTelegram } from '../../hooks/useTelegram';
import { getChatList, type Chat } from '../../utils/api';

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
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmChat, setDeleteConfirmChat] = useState<{ id: string; title: string } | null>(null);

  // Загружаем список чатов при открытии
  useEffect(() => {
    if (isOpen) {
      // Проверяем наличие токена перед загрузкой
      const token = localStorage.getItem('session_token');
      if (token) {
        loadChatList();
      } else {
        setError('Необходима авторизация');
        setIsLoading(false);
      }
    }
  }, [isOpen]);

  const loadChatList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChatList();
      if (response.success && response.data) {
        const formattedChats: ChatHistoryItem[] = response.data.map((chat: Chat) => ({
          id: chat.id || '',
          title: chat.title || 'Без названия',
          lastMessage: chat.lastMessage || 'Нет сообщений',
          timestamp: chat.lastMessageAt ? new Date(chat.lastMessageAt) : (chat.updated_at ? new Date(chat.updated_at) : new Date(chat.created_at || Date.now())),
          messageCount: chat.messageCount || 0
        }));
        setChatHistory(formattedChats);
      } else {
        setError(response.error || 'Не удалось загрузить список чатов');
      }
    } catch (err) {
      console.error('Error loading chat list:', err);
      setError('Ошибка загрузки списка чатов');
    } finally {
      setIsLoading(false);
    }
  };

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
  const handleDeleteChat = (chatId: string, title: string) => {
    triggerHaptic('medium');
    setDeleteConfirmChat({ id: chatId, title });
  };

  // Подтверждение удаления
  const confirmDelete = () => {
    if (deleteConfirmChat) {
      triggerHaptic('heavy');
      onDeleteChat(deleteConfirmChat.id);
      // Удаляем чат из локального состояния
      setChatHistory(prev => prev.filter(chat => chat.id !== deleteConfirmChat.id));
      setDeleteConfirmChat(null);
    }
  };

  // Отмена удаления
  const cancelDelete = () => {
    triggerHaptic('light');
    setDeleteConfirmChat(null);
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
            {/* Header - Заголовок между системными кнопками по центру экрана */}
            <h2 
              className="text-lg font-semibold text-center fixed left-0 right-0 z-[62] pointer-events-none"
              style={{
                color: themeParams.text_color || '#000000',
                top: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)) + 1rem)',
                width: '100vw',
                left: 0,
                right: 0
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
                paddingTop: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)) + 3rem)'
              }}
            >
              {isLoading ? (
                <div 
                  className="p-4 text-center"
                  style={{
                    color: themeParams.hint_color || '#6B7280'
                  }}
                >
                  <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50 animate-spin" />
                  <p>Загрузка...</p>
                </div>
              ) : error ? (
                <div 
                  className="p-4 text-center"
                  style={{
                    color: themeParams.hint_color || '#6B7280'
                  }}
                >
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">{error}</p>
                  <button
                    onClick={loadChatList}
                    className="text-sm underline"
                    style={{
                      color: themeParams.button_color || '#2481cc'
                    }}
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : chatHistory.length === 0 ? (
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
                            handleDeleteChat(chat.id, chat.title);
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
                paddingTop: '3.5rem',
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

          {/* Delete Confirmation Modal */}
          {deleteConfirmChat && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[70]"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            >
              <motion.div
                className="rounded-2xl shadow-2xl max-w-sm mx-4"
                style={{
                  backgroundColor: themeParams.secondary_bg_color || themeParams.bg_color || '#ffffff',
                  padding: '1.5rem'
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{
                    color: themeParams.text_color || '#000000'
                  }}
                >
                  Удалить чат?
                </h3>
                <p
                  className="mb-6"
                  style={{
                    color: themeParams.hint_color || '#6B7280'
                  }}
                >
                  Вы уверены, что хотите удалить чат "{deleteConfirmChat.title}"? Это действие нельзя отменить.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: themeParams.secondary_bg_color || '#F3F4F6',
                      color: themeParams.text_color || '#000000'
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#ffffff'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
