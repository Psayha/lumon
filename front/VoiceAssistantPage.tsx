import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';
import { AnimatedAIChat } from '../src/components/ui/animated-ai-chat';
import { useTelegram } from '../src/hooks/useTelegram';
import { 
  createUser, 
  createChat, 
  saveMessage, 
  getChatHistory, 
  trackEvent,
  type User as ApiUser,
  type Chat,
  type Message as ApiMessage 
} from '../src/utils/api';

const VoiceAssistantPage: React.FC = () => {
  const { tg, isReady } = useTelegram();
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  
  // Backend state
  const [userId, setUserId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Инициализация пользователя и чата при загрузке
  useEffect(() => {
    if (!isReady || !tg || initializationRef.current || isInitialized) return;

    const initializeUserAndChat = async () => {
      try {
        initializationRef.current = true;

        // Получаем данные пользователя из Telegram
        const telegramUser = tg.initDataUnsafe?.user;
        if (!telegramUser?.id) {
          console.warn('[VoiceAssistantPage] Telegram user data not available');
          setIsInitialized(true);
          return;
        }

        // Создаем или получаем пользователя
        const userData: ApiUser = {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language_code: telegramUser.language_code,
          is_premium: telegramUser.is_premium || false,
        };

        const userResponse = await createUser(userData);
        if (userResponse.success && userResponse.data?.id) {
          setUserId(userResponse.data.id);

          // Отслеживаем событие инициализации
          await trackEvent({
            event_type: 'user_initialized',
            event_data: { telegram_id: telegramUser.id },
          });

          // Создаем новый чат
          const chatResponse = await createChat(userResponse.data.id, 'Voice Assistant Chat');
          if (chatResponse.success && chatResponse.data?.id) {
            setChatId(chatResponse.data.id);

            // Загружаем историю чата
            const historyResponse = await getChatHistory(chatResponse.data.id);
            if (historyResponse.success && historyResponse.data) {
              // История будет передана в AnimatedAIChat через пропсы (нужно добавить)
              console.log('[VoiceAssistantPage] Chat history loaded:', historyResponse.data.length, 'messages');
            }
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('[VoiceAssistantPage] Error initializing user/chat:', error);
        setIsInitialized(true); // Все равно помечаем как инициализированное, чтобы не блокировать UI
      }
    };

    initializeUserAndChat();
  }, [isReady, tg, isInitialized]);

  return (
    <>
      {/* Контент занимает весь экран, включая safe-area */}
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader isTyping={isTyping} showHomeButton={false} isListening={isListening} isRecognizing={isRecognizing} />
        
        {/* AI Chat с поддержкой ответов - скроллируемый контент */}
        <div className="flex-1 overflow-hidden min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-6">
          <AnimatedAIChat 
            onTypingChange={setIsTyping} 
            isListening={isListening}
            onListeningChange={setIsListening}
            isRecognizing={isRecognizing}
            onRecognizingChange={setIsRecognizing}
            chatId={chatId}
            onMessageSave={async (message, role) => {
              if (!chatId || !userId) return;
              
              try {
                const apiMessage: ApiMessage = {
                  chat_id: chatId,
                  role,
                  content: message,
                };
                
                await saveMessage(apiMessage);
                
                // Отслеживаем событие отправки сообщения
                await trackEvent({
                  event_type: 'message_sent',
                  event_data: { 
                    chat_id: chatId,
                    role,
                    message_length: message.length,
                  },
                });
              } catch (error) {
                console.error('[VoiceAssistantPage] Error saving message:', error);
                // Не показываем ошибку пользователю, чтобы не нарушать UX
              }
            }}
          />
        </div>

        {/* <AppFooter showHomeButton={true} /> */}
      </div>

      {/* Градиентное размытие сверху с плавным переходом */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] pointer-events-none overflow-hidden"
        style={{
          height: `calc(var(--safe-top, 0px) + 40px)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 bg-white/10 dark:bg-black/10"
          style={{
            height: `calc(var(--safe-top, 0px) + 40px)`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>
      
      {/* Правая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Левая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-left, 0px)'
        }}
      />
    </>
  );
};

export default VoiceAssistantPage;